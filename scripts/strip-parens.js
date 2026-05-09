export function stripParens(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.replace(/\([^)]*\)/g, '').trimEnd())
    .join('\n');
}
