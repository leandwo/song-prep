#!/usr/bin/env node

/**
 * strip-comments.js
 *
 * Usage:
 *   node strip-comments.js input.txt
 *   node strip-comments.js input.txt --out output.txt
 *
 * What it does:
 * - Converts {comment: Something} → Something
 * - Leaves everything else untouched
 */

const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);

function getArg(name) {
  const idx = argv.indexOf(name);
  if (idx === -1) return null;
  return argv[idx + 1] ?? null;
}

const inputPath = argv.find((a) => !a.startsWith("--"));
if (!inputPath) {
  console.error("Usage: node strip-comments.js <input.txt> [--out output.txt]");
  process.exit(1);
}

const outPath = getArg("--out");

const input = fs.readFileSync(inputPath, "utf8");

// Replace {comment: Something} with Something
const output = input.replace(/\{\s*comment\s*:\s*([^}]+)\}/gi, (_, content) =>
  content.trim(),
);

if (outPath) {
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`Wrote: ${path.resolve(outPath)}`);
} else {
  process.stdout.write(output);
}
