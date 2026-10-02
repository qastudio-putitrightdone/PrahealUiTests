import { readFileSync } from 'node:fs';

const {
  ZEPHYR_API_TOKEN,
  ZEPHYR_BASE_URL = 'https://api.zephyrscale.smartbear.com/v2',
  ZEPHYR_PROJECT_KEY,
  AUTOMATION_REPO_URL,
} = process.env;

const AUTOMATED_LABEL = 'automated';

const usage = `Usage:
  npm run -s zephyr -- list [--folder <name>] [--status <name>] [--label <label>] [--search <text>]
  npm run -s zephyr -- get <TEST-CASE-KEY> [--json]
  npm run -s zephyr -- create --file <test-case.json> [--dry-run]
  npm run -s zephyr -- mark-automated <TEST-CASE-KEY> --spec <spec path> --title <test title> [--dry-run]`;

if (!ZEPHYR_API_TOKEN) {
  console.error('ZEPHYR_API_TOKEN is not set. Copy .env.example to .env and add your Zephyr Scale API token.');
  process.exit(1);
}

const cache = new Map();

async function api(path) {
  const url = path.startsWith('http') ? path : `${ZEPHYR_BASE_URL}${path}`;
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${ZEPHYR_API_TOKEN}`, Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Zephyr API ${response.status} for ${url}: ${(await response.text()).slice(0, 300)}`);
  }
  const body = await response.json();
  cache.set(url, body);
  return body;
}

async function send(method, path, body) {
  const response = await fetch(`${ZEPHYR_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${ZEPHYR_API_TOKEN}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Zephyr API ${response.status} for ${method} ${path}: ${(await response.text()).slice(0, 500)}`);
  }
  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : {};
}

async function paged(path) {
  const values = [];
  let startAt = 0;
  for (;;) {
    const separator = path.includes('?') ? '&' : '?';
    const page = await api(`${path}${separator}startAt=${startAt}&maxResults=100`);
    values.push(...page.values);
    if (page.isLast || page.values.length === 0) return values;
    startAt += page.values.length;
  }
}

const text = (html) =>
  (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const nameOf = async (ref) => (ref?.self ? (await api(ref.self)).name : null);

async function steps(key, depth = 0) {
  if (depth > 5) return [{ description: `Call to ${key} skipped: nesting too deep`, testData: '', expectedResult: '' }];
  const result = [];
  for (const step of await paged(`/testcases/${key}/teststeps`)) {
    if (step.inline) {
      result.push({
        description: text(step.inline.description),
        testData: text(step.inline.testData),
        expectedResult: text(step.inline.expectedResult),
      });
    } else if (step.testCase) {
      const calledKey = step.testCase.testCaseKey;
      result.push({ description: `Call to test case ${calledKey}`, testData: '', expectedResult: '', calledTestCase: calledKey });
      result.push(...(await steps(calledKey, depth + 1)).map((called) => ({ ...called, fromTestCase: calledKey })));
    }
  }
  return result;
}

async function script(testCase) {
  const self = testCase.testScript?.self ?? '';
  if (self.endsWith('/testscript')) {
    const body = await api(self);
    return { type: body.type, text: text(body.text) };
  }
  return null;
}

async function get(key) {
  const testCase = await api(`/testcases/${key}`);
  const [status, priority, folder] = await Promise.all([
    nameOf(testCase.status),
    nameOf(testCase.priority),
    nameOf(testCase.folder),
  ]);
  const testScript = await script(testCase);
  return {
    key: testCase.key,
    name: testCase.name,
    status,
    priority,
    folder,
    labels: testCase.labels ?? [],
    objective: text(testCase.objective),
    precondition: text(testCase.precondition),
    steps: testScript ? [] : await steps(key),
    script: testScript,
    issues: (testCase.links?.issues ?? []).map((issue) => issue.issueId),
    webLinks: (testCase.links?.webLinks ?? []).map((link) => link.url),
  };
}

function markdown(testCase) {
  const lines = [
    `# ${testCase.key} - ${testCase.name}`,
    '',
    `- Status: ${testCase.status ?? '-'} | Priority: ${testCase.priority ?? '-'} | Folder: ${testCase.folder ?? '-'} | Labels: ${testCase.labels.join(', ') || '-'}`,
    '',
    '## Objective',
    testCase.objective || '_(empty)_',
    '',
    '## Precondition',
    testCase.precondition || '_(empty)_',
    '',
  ];
  if (testCase.script) {
    lines.push(`## Test script (${testCase.script.type})`, '', testCase.script.text || '_(empty)_', '');
  } else {
    lines.push('## Steps', '');
    if (testCase.steps.length === 0) lines.push('_(no steps)_');
    testCase.steps.forEach((step, index) => {
      const origin = step.fromTestCase ? ` _(from ${step.fromTestCase})_` : '';
      lines.push(
        `### Step ${index + 1}${origin}`,
        `- Action: ${step.description || '_(empty)_'}`,
        `- Test data: ${step.testData || '-'}`,
        `- Expected: ${step.expectedResult || '_(empty)_'}`,
        '',
      );
    });
  }
  if (testCase.issues.length || testCase.webLinks.length) {
    lines.push('## Links', `- Jira issue ids: ${testCase.issues.join(', ') || '-'}`, `- Web links: ${testCase.webLinks.join(', ') || '-'}`);
  }
  return lines.join('\n');
}

async function list(options) {
  if (!ZEPHYR_PROJECT_KEY) throw new Error('ZEPHYR_PROJECT_KEY is not set in .env');
  const testCases = await paged(`/testcases?projectKey=${encodeURIComponent(ZEPHYR_PROJECT_KEY)}`);
  const rows = [];
  for (const testCase of testCases) {
    const [status, folder] = await Promise.all([nameOf(testCase.status), nameOf(testCase.folder)]);
    const labels = testCase.labels ?? [];
    if (options.status && status?.toLowerCase() !== options.status.toLowerCase()) continue;
    if (options.folder && folder?.toLowerCase() !== options.folder.toLowerCase()) continue;
    if (options.label && !labels.some((label) => label.toLowerCase() === options.label.toLowerCase())) continue;
    if (options.search && !testCase.name.toLowerCase().includes(options.search.toLowerCase())) continue;
    rows.push(`| ${testCase.key} | ${testCase.name} | ${status ?? '-'} | ${folder ?? '-'} | ${labels.join(', ') || '-'} |`);
  }
  return ['| Key | Name | Status | Folder | Labels |', '|---|---|---|---|---|', ...rows, '', `Total: ${rows.length}`].join('\n');
}

const html = (value) =>
  (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

async function folderId(path, dryRun) {
  if (!path) return undefined;
  const folders = await paged(`/folders?projectKey=${encodeURIComponent(ZEPHYR_PROJECT_KEY)}&folderType=TEST_CASE`);
  let parentId = null;
  for (const name of path.split('/').filter(Boolean)) {
    const existing = folders.find(
      (folder) => folder.name.toLowerCase() === name.toLowerCase() && (folder.parentId ?? null) === parentId,
    );
    if (existing) {
      parentId = existing.id;
    } else if (dryRun) {
      return `<new folder path "${path}" from "${name}">`;
    } else {
      const created = await send('POST', '/folders', { name, projectKey: ZEPHYR_PROJECT_KEY, folderType: 'TEST_CASE', parentId });
      folders.push({ id: created.id, name, parentId });
      parentId = created.id;
    }
  }
  return parentId;
}

async function create(file, dryRun) {
  if (!ZEPHYR_PROJECT_KEY) throw new Error('ZEPHYR_PROJECT_KEY is not set in .env');
  const input = JSON.parse(readFileSync(file, 'utf8'));
  if (!input.name || !Array.isArray(input.steps) || input.steps.length === 0) {
    throw new Error('Test case file needs "name" and at least one entry in "steps"');
  }
  const emptyStep = input.steps.findIndex((step) => !step.description || !step.expectedResult);
  if (emptyStep !== -1) throw new Error(`Step ${emptyStep + 1} needs both "description" and "expectedResult"`);

  const testCase = {
    projectKey: ZEPHYR_PROJECT_KEY,
    name: input.name,
    objective: html(input.objective),
    precondition: html(input.precondition),
    priorityName: input.priority ?? 'Normal',
    statusName: input.status ?? 'Draft',
    folderId: await folderId(input.folder, dryRun),
    labels: input.labels ?? [],
  };
  const steps = {
    mode: 'OVERWRITE',
    items: input.steps.map((step) => ({
      inline: { description: html(step.description), testData: html(step.testData), expectedResult: html(step.expectedResult) },
    })),
  };
  if (dryRun) return JSON.stringify({ dryRun: true, testCase, steps }, null, 2);

  const created = await send('POST', '/testcases', testCase);
  await send('POST', `/testcases/${created.key}/teststeps`, steps);
  return `Created ${created.key}`;
}

async function markAutomated(key, spec, title, dryRun) {
  if (!spec || !title) throw new Error('mark-automated needs --spec <spec path> and --title <test title>');
  const testCase = await api(`/testcases/${key}`);
  const labels = [...new Set([...(testCase.labels ?? []), AUTOMATED_LABEL])];
  const webLink = AUTOMATION_REPO_URL
    ? { url: `${AUTOMATION_REPO_URL.replace(/\/$/, '')}/${spec}`, description: `Automated: ${spec} > ${title}` }
    : null;
  const existingLinks = (testCase.links?.webLinks ?? []).map((link) => link.url);
  const addLink = webLink && !existingLinks.includes(webLink.url);
  if (dryRun) {
    return JSON.stringify({ dryRun: true, key, labels, webLink: addLink ? webLink : null, note: AUTOMATION_REPO_URL ? undefined : 'AUTOMATION_REPO_URL not set - no web link' }, null, 2);
  }
  const { links, testScript, ...updatable } = testCase;
  await send('PUT', `/testcases/${key}`, { ...updatable, labels });
  if (addLink) await send('POST', `/testcases/${key}/links/weblinks`, webLink);
  return `Marked ${key} as automated (label "${AUTOMATED_LABEL}"${addLink ? `, web link ${webLink.url}` : ''})`;
}

const [command, ...rest] = process.argv.slice(2);
const option = (name) => {
  const index = rest.indexOf(`--${name}`);
  return index === -1 ? undefined : rest[index + 1];
};
const dryRun = rest.includes('--dry-run');

try {
  if (command === 'list') {
    console.log(await list({ folder: option('folder'), status: option('status'), label: option('label'), search: option('search') }));
  } else if (command === 'get' && rest[0]) {
    const testCase = await get(rest[0]);
    console.log(rest.includes('--json') ? JSON.stringify(testCase, null, 2) : markdown(testCase));
  } else if (command === 'create' && option('file')) {
    console.log(await create(option('file'), dryRun));
  } else if (command === 'mark-automated' && rest[0] && !rest[0].startsWith('--')) {
    console.log(await markAutomated(rest[0], option('spec'), option('title'), dryRun));
  } else {
    console.error(usage);
    process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
