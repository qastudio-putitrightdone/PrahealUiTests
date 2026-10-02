import { readFileSync, writeFileSync } from 'node:fs';

const CONTEXT = '.claude/skills/praheal-test-advisor/context';
const CATALOG = `${CONTEXT}/03-test-scenarios.md`;
const MODULES = `${CONTEXT}/02-modules-and-rules.md`;
const output = process.argv[2] ?? 'requirements.csv';
const PRIORITY = { P1: 'high', P2: 'medium', P3: 'low' };

const csvField = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

const moduleNames = new Map(
  [...readFileSync(MODULES, 'utf8').matchAll(/^## ([A-Z]+) - (.+)$/gm)].map(([, code, name]) => [code, name.trim()]),
);

const rows = [];
for (const line of readFileSync(CATALOG, 'utf8').split('\n')) {
  const row = line.match(/^\| ([A-Z]+-\d+) \| (.+?) \| [A-Z/]+ \| (P[123]) \|/);
  if (row) {
    const [, id, title, priority] = row;
    const code = id.split('-')[0];
    rows.push([id, title.trim(), moduleNames.get(code) ?? code, code, PRIORITY[priority]]);
  }
}

if (rows.length === 0) {
  console.error(`No scenarios found in ${CATALOG}`);
  process.exit(1);
}

writeFileSync(output, ['id,title,epic,feature,priority', ...rows.map((row) => row.map(csvField).join(','))].join('\n') + '\n');
console.log(`Wrote ${rows.length} requirements to ${output}`);
