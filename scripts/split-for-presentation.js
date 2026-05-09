// Length of a string excluding [...] chord brackets — used for balance calculations
// so that chord notation doesn't skew how lyric lines are distributed.
function lyricLength(s) {
  return s.replace(/\[[^\]]*\]/g, '').length;
}

export function wrapLine(line, maxWidth) {
  if (lyricLength(line) <= maxWidth) return [line];

  // Collect valid split positions: spaces outside [...] brackets.
  // Spaces inside brackets are chord notation; text with no space between ]
  // and the next word (e.g. "[ 4m ]word") has no split point there naturally.
  const splits = [];
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    if      (line[i] === '[') depth++;
    else if (line[i] === ']') depth--;
    else if (line[i] === ' ' && depth === 0) splits.push(i);
  }

  if (splits.length === 0) return [line];

  // Try the minimum number of lines needed, increasing until a valid split exists.
  // For each n, consider all combinations of split points and pick the one that
  // minimises variance across the resulting line lengths — so 3 lines come out
  // as even as possible rather than the recursive 2-way approach, which can
  // leave a short middle segment.
  for (let n = 2; n <= splits.length + 1; n++) {
    const result = balancedSplit(line, splits, n, maxWidth);
    if (result) return result;
  }

  return [line];
}

// Returns the most balanced split of `line` into exactly `n` parts,
// each ≤ maxWidth chars. Tries every valid combination of split points
// and picks the one with minimum length variance. Returns null if impossible.
function balancedSplit(line, splits, n, maxWidth) {
  if (n === 1) return lyricLength(line) <= maxWidth ? [line] : null;

  let bestParts    = null;
  let bestVariance = Infinity;

  for (const pos of splits) {
    const left = line.slice(0, pos);
    if (lyricLength(left) > maxWidth) continue;

    const rest       = line.slice(pos + 1);
    const restSplits = splits.filter(s => s > pos).map(s => s - pos - 1);
    const restParts  = balancedSplit(rest, restSplits, n - 1, maxWidth);
    if (!restParts) continue;

    const parts    = [left, ...restParts];
    const lengths  = parts.map(lyricLength);
    const avg      = lengths.reduce((sum, l) => sum + l, 0) / n;
    const variance = lengths.reduce((sum, l) => sum + (l - avg) ** 2, 0);

    if (variance < bestVariance) {
      bestVariance = variance;
      bestParts    = parts;
    }
  }

  return bestParts;
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
