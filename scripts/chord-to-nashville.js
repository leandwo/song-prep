#!/usr/bin/env node
/**
 * chordpro-to-nashville.js
 *
 * Usage:
 *   node chordpro-to-nashville.js input.txt > output.txt
 *   node chordpro-to-nashville.js input.txt --out output.txt
 *
 * Requirements:
 * - Input file must contain a key, e.g.:
 *   {key: D}
 *   {meta: key D}
 *   Key: D
 *   Key of D
 *
 * Behavior:
 * - Converts chords in [brackets] to Nashville numbers relative to the detected key.
 * - Leaves everything else untouched.
 */

const fs = require("fs");
const path = require("path");

// ---------------- CLI ----------------
const argv = process.argv.slice(2);

function getArg(name) {
  const idx = argv.indexOf(name);
  if (idx === -1) return null;
  return argv[idx + 1] ?? null;
}

const inputPath = argv.find((a) => !a.startsWith("--"));
if (!inputPath) {
  console.error(
    "Usage: node chordpro-to-nashville.js <input.txt> [--out output.txt]",
  );
  process.exit(1);
}

const outPath = getArg("--out");

// ---------------- Music helpers ----------------
const CHROMATIC_SHARPS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const CHROMATIC_FLATS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

// Interval -> Nashville degree (chromatic-friendly)
const DEGREE_BY_INTERVAL = new Map([
  [0, "1"],
  [1, "b2"],
  [2, "2"],
  [3, "b3"],
  [4, "3"],
  [5, "4"],
  [6, "b5"], // could be #4 in some styles, see note below
  [7, "5"],
  [8, "b6"],
  [9, "6"],
  [10, "b7"],
  [11, "7"],
]);

function normalizeNote(note) {
  note = (note || "").trim();
  if (!note) return note;
  const n = note[0].toUpperCase() + note.slice(1);

  // Common enharmonics
  const enharmonic = { "E#": "F", "B#": "C", Fb: "E", Cb: "B" };
  return enharmonic[n] || n;
}

function noteToSemitone(note) {
  const n = normalizeNote(note);
  let i = CHROMATIC_SHARPS.indexOf(n);
  if (i !== -1) return i;
  i = CHROMATIC_FLATS.indexOf(n);
  if (i !== -1) return i;
  return null;
}

// ---------------- Key detection ----------------
function detectKey(text) {
  // 1) ChordPro directive {key: D}
  let m = text.match(/\{ *key *: *([A-Ga-g])([#b]?)(?:[^}]*)\}/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ""));

  // 2) Meta variants: {meta: key D} / {meta: key: D}
  m = text.match(/\{ *meta *: *key *: *([A-Ga-g])([#b]?)(?:[^}]*)\}/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ""));
  m = text.match(/\{ *meta *: *key +([A-Ga-g])([#b]?)(?:[^}]*)\}/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ""));

  // 3) Plain text: Key: D / Key of D
  m = text.match(/(?:^|\n)\s*Key\s*:\s*([A-Ga-g])([#b]?)/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ""));
  m = text.match(/(?:^|\n)\s*Key\s+of\s+([A-Ga-g])([#b]?)/i);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ""));

  return null;
}

// ---------------- Chord parsing ----------------
// Parse chord like: "A", "Bm7", "Dbsus4", "Gb/Db", "A/C#"
function parseChord(chordText) {
  const raw = chordText.trim();
  if (!raw) return null;

  // Root note: A-G + optional accidental
  const m = raw.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!m) return null;

  const root = normalizeNote(m[1].toUpperCase() + (m[2] || ""));
  let rest = m[3] || "";

  // Slash chord
  let bass = null;
  const slashIdx = rest.indexOf("/");
  if (slashIdx !== -1) {
    const before = rest.slice(0, slashIdx);
    const after = rest.slice(slashIdx + 1);
    rest = before;

    const bm = after.trim().match(/^([A-Ga-g])([#b]?)/);
    if (bm) bass = normalizeNote(bm[1].toUpperCase() + (bm[2] || ""));
  }

  // Heuristic: avoid converting bracketed non-chords like [Verse 1]
  // If it contains spaces or starts with a digit/letter word patterns, treat as not a chord.
  // (ChordPro chords generally don't contain spaces.)
  if (/\s/.test(raw)) return null;

  return { root, quality: rest, bass };
}

function noteToDegree(note, keyRoot) {
  const noteSemi = noteToSemitone(note);
  const keySemi = noteToSemitone(keyRoot);
  if (noteSemi == null || keySemi == null) return note;

  const interval = (((noteSemi - keySemi) % 12) + 12) % 12;
  return DEGREE_BY_INTERVAL.get(interval) || note;
}

function chordToNashville({ root, quality, bass }, keyRoot) {
  const rootDeg = noteToDegree(root, keyRoot);
  const bassDeg = bass ? noteToDegree(bass, keyRoot) : null;

  return {
    root: rootDeg,
    quality, // keep suffix like m7, sus4, maj7, add9
    bass: bassDeg,
  };
}

function formatChord({ root, quality, bass }) {
  return bass ? `${root}${quality}/${bass}` : `${root}${quality}`;
}

// ---------------- Main function ----------------
function convertToNashville(input) {
  const key = detectKey(input);

  if (!key) {
    throw new Error(
      [
        "Could not detect key from input.",
        "Add one of these:",
        "  {key: D}",
        "  {meta: key D}",
        "  Key: D",
      ].join("\n"),
    );
  }

  // Replace [CHORD] with [NASHVILLE]
  const output = input.replace(/\[([^\]]+)\]/g, (match, inner) => {
    const chord = parseChord(inner);
    if (!chord) return match;

    const n = chordToNashville(chord, key);
    return `[${formatChord(n)}]`;
  });

  return output;
}

module.exports = { convertToNashville };

// ---------------- CLI ----------------
if (require.main === module) {
  const input = fs.readFileSync(inputPath, "utf8");

  try {
    const output = convertToNashville(input);

    if (outPath) {
      fs.writeFileSync(outPath, output, "utf8");
      const key = detectKey(input);
      console.log(`Wrote: ${path.resolve(outPath)} (key detected: ${key})`);
    } else {
      process.stdout.write(output);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
