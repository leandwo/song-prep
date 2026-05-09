export function stripHeaderFooter(input) {
  const lines = input.split(/\r?\n/);

  let startIndex = 0;
  while (startIndex < lines.length && /^\{.*\}$/.test(lines[startIndex].trim())) {
    startIndex++;
  }

  const ccliIndex = lines.findIndex((line) => line.trim().startsWith('CCLI Song #'));
  let endIndex = ccliIndex !== -1 ? ccliIndex - 1 : lines.length - 1;

  while (endIndex >= startIndex && /^\{.*\}$/.test(lines[endIndex].trim())) {
    endIndex--;
  }

  return lines.slice(startIndex, endIndex + 1).join('\n');
}
