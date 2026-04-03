#!/usr/bin/env node

const { stripHeaderFooter } = require("./strip-header-footer.js");
const { stripComments } = require("./strip-comments.js");
const { dehyphenate } = require("./dehyphenate.js");
const { convertToNashville } = require("./chord-to-nashville.js");

const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);

function hasFlag(flag) {
  return argv.includes(flag);
}

function getArg(name) {
  const idx = argv.indexOf(name);
  return idx === -1 ? null : (argv[idx + 1] ?? null);
}

// Get input and output directories
const inputDir = getArg("--input") || path.join(__dirname, "..", "input");
const outputDir = getArg("--output") || path.join(__dirname, "..", "output");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all files from input directory
const files = fs.readdirSync(inputDir).filter((file) => {
  return fs.statSync(path.join(inputDir, file)).isFile() && file.endsWith(".txt");
});

if (files.length === 0) {
  console.log(`No files found in ${inputDir}`);
  process.exit(0);
}

let processedCount = 0;
let errorCount = 0;

for (const file of files) {
  try {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    let text = fs.readFileSync(inputPath, "utf8");

    // Apply transforms conditionally
    if (!hasFlag("--skip-numbers")) {
      text = convertToNashville(text);
    }

    if (!hasFlag("--skip-dehyphenate")) {
      text = dehyphenate(text);
    }

    if (!hasFlag("--skip-comments")) {
      text = stripComments(text);
    }

    if (!hasFlag("--skip-header")) {
      text = stripHeaderFooter(text);
    }

    // Write output
    fs.writeFileSync(outputPath, text, "utf8");
    console.log(`✓ Processed: ${file}`);
    processedCount++;
  } catch (err) {
    console.error(`✗ Error processing ${file}: ${err.message}`);
    errorCount++;
  }
}

console.log(`\nSummary: ${processedCount} processed, ${errorCount} errors`);
process.exit(errorCount > 0 ? 1 : 0);
