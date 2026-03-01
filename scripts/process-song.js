#!/usr/bin/env node

import { stripHeaderFooter } from "./strip-header-footer.js";
import { stripComments } from "./strip-comments.js";
import { dehyphenate } from "./dehyphenate.js";
import { convertToNashville } from "./chord-to-nashville.js";

import fs from "fs";
import path from "path";

// const fs = require("fs");
// const path = require("path");

// Import transforms
// const stripHeaderFooter = require("./strip-header-footer");
// const stripComments = require("./strip-comments");
// const dehyphenate = require("./dehyphenate");
// const convertToNashville = require("./chord-to-nashville");

const argv = process.argv.slice(2);

function hasFlag(flag) {
  return argv.includes(flag);
}

function getArg(name) {
  const idx = argv.indexOf(name);
  return idx === -1 ? null : (argv[idx + 1] ?? null);
}

const inputPath = argv.find((a) => !a.startsWith("--"));
if (!inputPath) {
  console.error("Usage: node process-song.js input.txt [options]");
  process.exit(1);
}

const outPath = getArg("--out");

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

// Output
if (outPath) {
  fs.writeFileSync(outPath, text, "utf8");
  console.log(`Wrote: ${path.resolve(outPath)}`);
} else {
  process.stdout.write(text);
}