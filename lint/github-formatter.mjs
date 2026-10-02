import { relative } from 'node:path';

const escape = (value) => String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escapeProperty = (value) => escape(value).replace(/:/g, '%3A').replace(/,/g, '%2C');

export default function githubFormatter(results) {
  const lines = [];
  let errors = 0;
  let warnings = 0;
  for (const result of results) {
    const file = relative(process.cwd(), result.filePath);
    for (const message of result.messages) {
      const level = message.severity === 2 ? 'error' : 'warning';
      if (level === 'error') errors += 1;
      else warnings += 1;
      const title = message.ruleId ?? 'parse-error';
      lines.push(
        `::${level} file=${escapeProperty(file)},line=${message.line ?? 1},col=${message.column ?? 1},title=${escapeProperty(title)}::${escape(message.message)}`,
      );
      lines.push(`${file}:${message.line ?? 1}:${message.column ?? 1} ${level} ${message.message} (${title})`);
    }
  }
  lines.push(`Framework rule check: ${errors} error(s), ${warnings} warning(s)`);
  return lines.join('\n');
}
