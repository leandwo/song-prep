#!/usr/bin/env node

/**
 * strip-header-footer.js
 *
 * Usage:
 *   node strip-header-footer.js input.txt
 *   node strip-header-footer.js input.txt --out output.txt
 *
 * What it does:
 * - Removes top metadata block (title, artist, key, etc.)
 * - Removes bottom metadata block (copyright, ccli, etc.)
 * - Keeps only the main song body
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
  console.error("Usage: node strip-header-footer.js <input.txt> [--out output.txt]");
  process.exit(1);
}

const outPath = getArg("--out");

const input = fs.readFileSync(inputPath, "utf8");
const lines = input.split("\n");

// Step 1: Remove header (top block of directives)
let startIndex = 0;
while (
  startIndex < lines.length &&
  lines[startIndex].trim().match(/^\{.*\}$/)
) {
  startIndex++;
}

// Step 2: Remove footer (bottom block of directives)
let endIndex = lines.length - 1;
while (
  endIndex >= 0 &&
  lines[endIndex].trim().match(/^\{.*\}$/)
) {
  endIndex--;
}

// Slice the body
const body = lines.slice(startIndex, endIndex + 1).join("\n");

if (outPath) {
  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Wrote: ${path.resolve(outPath)}`);
} else {
  process.stdout.write(body);
}