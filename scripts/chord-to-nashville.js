const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const DEGREE_BY_INTERVAL = new Map([
  [0, '1'], [1, 'b2'], [2, '2'], [3, 'b3'], [4, '3'],
  [5, '4'], [6, 'b5'], [7, '5'], [8, 'b6'], [9, '6'],
  [10, 'b7'], [11, '7'],
]);

function normalizeNote(note) {
  note = (note || '').trim();
  if (!note) return note;
  const n = note[0].toUpperCase() + note.slice(1);
  const enharmonic = { 'E#': 'F', 'B#': 'C', Fb: 'E', Cb: 'B' };
  return enharmonic[n] || n;
}

function noteToSemitone(note) {
  const n = normalizeNote(note);
  const i = CHROMATIC_SHARPS.indexOf(n);
  if (i !== -1) return i;
  const j = CHROMATIC_FLATS.indexOf(n);
  return j !== -1 ? j : null;
}

function detectKey(text) {
  let m = text.match(/\{ *key *: *([A-Ga-g])([#b]?)(?:[^}]*)\}/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ''));
  m = text.match(/\{ *meta *: *key *: *([A-Ga-g])([#b]?)(?:[^}]*)\}/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ''));
  m = text.match(/\{ *meta *: *key +([A-Ga-g])([#b]?)(?:[^}]*)\}/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ''));
  m = text.match(/(?:^|\n)\s*Key\s*:\s*([A-Ga-g])([#b]?)/);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ''));
  m = text.match(/(?:^|\n)\s*Key\s+of\s+([A-Ga-g])([#b]?)/i);
  if (m) return normalizeNote(m[1].toUpperCase() + (m[2] || ''));
  return null;
}

function parseChord(chordText) {
  const raw = chordText.trim();
  if (!raw || /\s/.test(raw)) return null;
  const m = raw.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!m) return null;
  const root = normalizeNote(m[1].toUpperCase() + (m[2] || ''));
  let rest = m[3] || '';
  let bass = null;
  const slashIdx = rest.indexOf('/');
  if (slashIdx !== -1) {
    const bm = rest.slice(slashIdx + 1).trim().match(/^([A-Ga-g])([#b]?)/);
    if (bm) bass = normalizeNote(bm[1].toUpperCase() + (bm[2] || ''));
    rest = rest.slice(0, slashIdx);
  }
  if (rest && /^\s*[249]/.test(rest)) rest = 'add' + rest.trim();
  return { root, quality: rest, bass };
}

function noteToDegree(note, keyRoot) {
  const noteSemi = noteToSemitone(note);
  const keySemi  = noteToSemitone(keyRoot);
  if (noteSemi == null || keySemi == null) return note;
  const interval = (((noteSemi - keySemi) % 12) + 12) % 12;
  return DEGREE_BY_INTERVAL.get(interval) || note;
}

function formatChord({ root, quality, bass }) {
  const body = quality === '5' ? `${root}(${quality})` : `${root}${quality}`;
  return bass ? `${body}/${bass}` : body;
}

export function convertToNashville(input) {
  const key = detectKey(input);
  if (!key) {
    throw new Error(
      'Could not detect key from input.\nAdd one of these:\n  {key: D}\n  {meta: key D}\n  Key: D'
    );
  }
  return input.replace(/\[([^\]]+)\]/g, (match, inner) => {
    const chord = parseChord(inner);
    if (!chord) return match;
    const n = {
      root: noteToDegree(chord.root, key),
      quality: chord.quality,
      bass: chord.bass ? noteToDegree(chord.bass, key) : null,
    };
    return `[ ${formatChord(n)} ]`;
  });
}
