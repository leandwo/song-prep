// A section starts at a labeled block (first line has no '[' chords) and
// includes any unlabeled blocks that follow it, so multi-stanza sections
// travel together when reordered.
export function parseSections(text) {
  const blocks = text
    .split(/\n{2,}/)
    .map(b => b.replace(/^\n+|\n+$/g, ''))
    .filter(b => b.trim() !== '');

  const sections = [];
  for (const block of blocks) {
    const firstLine = block.split('\n')[0].trim();
    const isLabel = firstLine !== '' && !firstLine.includes('[');
    if (isLabel) {
      sections.push({ label: normalizeLabel(firstLine), blocks: [block] });
    } else if (sections.length > 0) {
      sections[sections.length - 1].blocks.push(block);
    } else {
      sections.push({ label: null, blocks: [block] });
    }
  }
  return sections;
}

// Unwrap a {comment: …} directive so sequences still match when the
// strip-comments transform is turned off.
function normalizeLabel(line) {
  const m = line.match(/^\{\s*comment\s*:\s*([^}]+)\}$/i);
  return (m ? m[1] : line).trim();
}

export function applySequence(text, sequence) {
  const names = (sequence || '')
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean);
  if (names.length === 0) return text;

  const sections = parseSections(text);
  const labeled = sections.filter(s => s.label !== null);

  const resolved = names.map(name => {
    const section = findSection(labeled, name);
    return section.blocks.join('\n\n');
  });
  return resolved.join('\n\n');
}

function findSection(labeled, name) {
  const q = name.toLowerCase();
  const exact = labeled.find(s => s.label.toLowerCase() === q);
  if (exact) return exact;

  const prefixed = labeled.filter(s => s.label.toLowerCase().startsWith(q));
  if (prefixed.length === 1) return prefixed[0];

  const available = labeled.map(s => s.label).join(', ') || '(none)';
  if (prefixed.length > 1) {
    throw new Error(
      `Section "${name}" is ambiguous — matches: ${prefixed.map(s => s.label).join(', ')}`
    );
  }
  throw new Error(`Section "${name}" not found.\nAvailable sections: ${available}`);
}
