export function wrapLine(line, maxWidth) {
  if (line.length <= maxWidth) return [line];

  // Only split on spaces that are outside [...] brackets.
  // Spaces inside brackets are part of chord notation, and text with no space
  // between ] and the next word (e.g. "[ 4m ]word") has no split point there.
  const splits = [];
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    if      (line[i] === '[') depth++;
    else if (line[i] === ']') depth--;
    else if (line[i] === ' ' && depth === 0) splits.push(i);
  }

  if (splits.length === 0) return [line];

  // Among valid split positions, pick the one with the smallest length difference
  // between the two halves, as long as both fit within maxWidth.
  let bestLeft = null, bestRight = null, bestDiff = Infinity;
  for (const pos of splits) {
    const left  = line.slice(0, pos);
    const right = line.slice(pos + 1);
    if (left.length > maxWidth || right.length > maxWidth) continue;
    const diff = Math.abs(left.length - right.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestLeft  = left;
      bestRight = right;
    }
  }

  if (bestLeft !== null) {
    return [...wrapLine(bestLeft, maxWidth), ...wrapLine(bestRight, maxWidth)];
  }

  // Greedy fallback: take the longest left segment that fits, recurse on the rest.
  for (let i = splits.length - 1; i >= 0; i--) {
    const left = line.slice(0, splits[i]);
    if (left.length <= maxWidth) {
      return [left, ...wrapLine(line.slice(splits[i] + 1), maxWidth)];
    }
  }

  return [line];
}

export function splitForPresentation(input, { maxWidth = 50, linesPerSlide = 2 } = {}) {
  // Split by blank lines into blocks of consecutive non-blank lines
  const blocks = input
    .split(/\n{2,}/)
    .map(block => block.split('\n').filter(line => line.trim() !== ''))
    .filter(block => block.length > 0);

  const slides = [];

  for (const block of blocks) {
    // First line with no '[' is a section label, not a lyric line
    let label = null;
    let contentLines = block;
    if (block[0] && !block[0].includes('[')) {
      label = block[0];
      contentLines = block.slice(1);
    }

    // Wrap each original line independently — wrapped pieces are one atomic unit
    const groups = contentLines.map(line => wrapLine(line, maxWidth));

    if (groups.length === 0) {
      if (label) slides.push({ label, lines: [] });
      continue;
    }

    // Pack groups into slides: never split a group across slides
    let slideLines = [];
    let slideLabel = label;

    for (const group of groups) {
      const wouldExceed = slideLines.length + group.length > linesPerSlide;
      if (wouldExceed && slideLines.length > 0) {
        slides.push({ label: slideLabel, lines: slideLines });
        slideLines = [];
        slideLabel = null;
      }
      slideLines.push(...group);
    }
    if (slideLines.length > 0) {
      slides.push({ label: slideLabel, lines: slideLines });
    }
  }

  return slides
    .map(slide => {
      const parts = slide.label ? [slide.label, ...slide.lines] : slide.lines;
      return parts.join('\n');
    })
    .join('\n\n');
}
