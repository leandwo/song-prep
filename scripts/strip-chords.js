export function stripChords(text) {
  const lines = [];
  for (const line of text.split('\n')) {
    const stripped = line.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
    // Drop lines that were only chords (e.g. instrumental bars) rather than
    // leaving blank lines behind, but keep original blank separator lines.
    if (stripped === '' && line.trim() !== '') continue;
    lines.push(stripped);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
