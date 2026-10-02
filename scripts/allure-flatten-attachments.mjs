import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const resultsDir = process.argv[2] ?? 'allure-results';

const isAttachmentWrapper = (step) =>
  !step.status && (step.steps ?? []).length === 0 && (step.attachments ?? []).length > 0;

const flatten = (node) => {
  let merged = 0;
  const kept = [];
  for (const child of node.steps ?? []) {
    if (isAttachmentWrapper(child)) {
      node.attachments = [...(node.attachments ?? []), ...child.attachments];
      merged += 1;
    } else {
      merged += flatten(child);
      kept.push(child);
    }
  }
  node.steps = kept;
  return merged;
};

let files = 0;
let wrappers = 0;
for (const name of readdirSync(resultsDir).filter((file) => file.endsWith('-result.json'))) {
  const path = join(resultsDir, name);
  const result = JSON.parse(readFileSync(path, 'utf8'));
  const merged = flatten(result);
  if (merged > 0) {
    writeFileSync(path, JSON.stringify(result));
    files += 1;
    wrappers += merged;
  }
}
console.log(`Merged ${wrappers} attachment step(s) into their parent steps in ${files} result file(s)`);
