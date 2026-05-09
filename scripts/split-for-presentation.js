function wrapLine(line, maxWidth) {
  if (line.length <= maxWidth) return [line];

  const words = line.split(' ');
  if (words.length === 1) return [line];

  // Try every word boundary; pick the split with the smallest length difference
  // that still keeps both halves within maxWidth.
  let bestSplit = null;
  let bestDiff = Infinity;

  for (let i = 1; i < words.length; i++) {
    const left  = words.slice(0, i).join(' ');
    const right = words.slice(i).join(' ');
    if (left.length > maxWidth || right.length > maxWidth) continue;
    const diff = Math.abs(left.length - right.length);
    if (diff < bestDiff) {
      bestDiff  = diff;
      bestSplit = [left, right];
    }
  }

  if (bestSplit) {
    // Recurse in case either half still needs splitting
    return [...wrapLine(bestSplit[0], maxWidth), ...wrapLine(bestSplit[1], maxWidth)];
  }

  // Fallback: greedy wrap (handles words that are individually > maxWidth)
  const result = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxWidth) {
      current += ' ' + word;
    } else {
      result.push(current);
      current = word;
    }
  }
  if (current) result.push(current);
  return result.length > 0 ? result : [line];
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
