#!/usr/bin/env node
/**
 * strip-header-footer.js
 *
 * Usage:
 *   node strip-header-footer.js input.txt
 *   node strip-header-footer.js input.txt --out output.txt
 *
 * What it does:
 * - Removes top metadata block ({title}, {artist}, etc.)
 * - Removes everything starting from "CCLI Song #" to the end
 * - Removes trailing directive-only lines
 * - Leaves only the main song body
 */

const fs = require("fs");
const path = require("path");

// command-line arguments handling only used when script is executed directly
function getArg(name) {
  const idx = argv.indexOf(name);
  return idx === -1 ? null : (argv[idx + 1] ?? null);
}

/**
 * Strip header/footer from a chordpro input string, returning the main body.
 *
 * @param {string} input - full text including metadata, footer, etc.
 * @returns {string} the stripped body text
 */
function stripHeaderFooter(input) {
  const lines = input.split(/\r?\n/);

  // 1. Remove header block (top directives)
  let startIndex = 0;
  while (
    startIndex < lines.length &&
    lines[startIndex].trim().match(/^\{.*\}$/)
  ) {
    startIndex++;
  }

  // 2. Remove everything from "CCLI Song #" onward
  let ccliIndex = lines.findIndex((line) =>
    line.trim().startsWith("CCLI Song #")
  );

  let endIndex;
  if (ccliIndex !== -1) {
    endIndex = ccliIndex - 1;
  } else {
    endIndex = lines.length - 1;
  }

  // 3. Remove trailing directive lines before cutoff
  while (
    endIndex >= startIndex &&
    lines[endIndex].trim().match(/^\{.*\}$/)
  ) {
    endIndex--;
  }

  return lines.slice(startIndex, endIndex + 1).join("\n");
}

module.exports = { stripHeaderFooter };

// CLI boilerplate: only run when invoked directly
if (require.main === module) {
  const argv = process.argv.slice(2);
  const inputPath = argv.find((a) => !a.startsWith("--"));
  if (!inputPath) {
    console.error("Usage: node strip-header-footer.js <input.txt> [--out output.txt]");
    process.exit(1);
  }

  const outPath = getArg("--out");
  const input = fs.readFileSync(inputPath, "utf8");
  const body = stripHeaderFooter(input);

  if (outPath) {
    fs.writeFileSync(outPath, body, "utf8");
    console.log(`Wrote: ${path.resolve(outPath)}`);
  } else {
    process.stdout.write(body);
  }
}