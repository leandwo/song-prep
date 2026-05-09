function dehyphenateLine(line) {
  if (/^\s*\{.*\}\s*$/.test(line)) return line;
  return line.replace(/\s+((?:\[[^\]]+\])?)\s*-\s+/g, '$1');
}

export function dehyphenate(input) {
  return input.split(/\r?\n/).map(dehyphenateLine).join('\n');
}
