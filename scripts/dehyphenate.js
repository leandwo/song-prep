#!/usr/bin/env node
/**
 * dehyphenate-chordpro.js
 *
 * Usage:
 *   node dehyphenate-chordpro.js input.txt > output.txt
 *   node dehyphenate-chordpro.js input.txt --out output.txt
 *
 * What it does:
 * - Replaces syllable-splitting hyphens surrounded by whitespace:
 *     "sepa  -  rate" -> "separate"
 * - Preserves inline ChordPro chords in brackets:
 *     "[4]sepa  -  [6m]rate" -> "[4]sepa[6m]rate"
 *
 * Notes:
 * - Only removes hyphens that have whitespace on BOTH sides (so "re-entry" stays).
 * - Works line-by-line; leaves directives like {title: ...} unchanged.
 */

const fs = require("fs");
const path = require("path");

function dehyphenateLine(line) {
  // Skip ChordPro directives entirely
  if (/^\s*\{.*\}\s*$/.test(line)) return line;

  // Replace " <spaces>-<spaces> " with nothing.
  // This will naturally pull adjacent chord tags and lyric fragments together.
  return line.replace(/\s+-\s+/g, "");
}

function dehyphenate(input) {
  const lines = input.split(/\r?\n/);
  return lines.map(dehyphenateLine).join("\n");
}

module.exports = { dehyphenate };

// CLI functionality
if (require.main === module) {
  const argv = process.argv.slice(2);

  function getArg(name) {
    const i = argv.indexOf(name);
    return i === -1 ? null : (argv[i + 1] ?? null);
  }

  const inputPath = argv.find((a) => !a.startsWith("--"));
  if (!inputPath) {
    console.error("Usage: node dehyphenate-chordpro.js <input.txt> [--out output.txt]");
    process.exit(1);
  }

  const outPath = getArg("--out");
  const input = fs.readFileSync(inputPath, "utf8");
  const output = dehyphenate(input);

  if (outPath) {
    fs.writeFileSync(outPath, output, "utf8");
    console.log(`Wrote: ${path.resolve(outPath)}`);
  } else {
    process.stdout.write(output);
  }
}