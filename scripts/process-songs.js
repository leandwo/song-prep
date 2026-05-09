#!/usr/bin/env node
import { convertToNashville } from './chord-to-nashville.js';
import { dehyphenate } from './dehyphenate.js';
import { stripComments } from './strip-comments.js';
import { stripHeaderFooter } from './strip-header-footer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const argv = process.argv.slice(2);

function hasFlag(flag) { return argv.includes(flag); }
function getArg(name) {
  const idx = argv.indexOf(name);
  return idx === -1 ? null : (argv[idx + 1] ?? null);
}

const inputDir  = getArg('--input')  || path.join(__dirname, '..', 'input');
const outputDir = getArg('--output') || path.join(__dirname, '..', 'output');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((file) =>
  fs.statSync(path.join(inputDir, file)).isFile() && file.endsWith('.txt')
);

if (files.length === 0) {
  console.log(`No files found in ${inputDir}`);
  process.exit(0);
}

let processedCount = 0;
let errorCount = 0;

for (const file of files) {
  try {
    const inputPath  = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    let text = fs.readFileSync(inputPath, 'utf8');

    if (!hasFlag('--skip-numbers'))     text = convertToNashville(text);
    if (!hasFlag('--skip-dehyphenate')) text = dehyphenate(text);
    if (!hasFlag('--skip-comments'))    text = stripComments(text);
    if (!hasFlag('--skip-header'))      text = stripHeaderFooter(text);

    fs.writeFileSync(outputPath, text, 'utf8');
    console.log(`✓ Processed: ${file}`);
    processedCount++;
  } catch (err) {
    console.error(`✗ Error processing ${file}: ${err.message}`);
    errorCount++;
  }
}

console.log(`\nSummary: ${processedCount} processed, ${errorCount} errors`);
process.exit(errorCount > 0 ? 1 : 0);
