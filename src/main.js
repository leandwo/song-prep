import { convertToNashville } from '../scripts/chord-to-nashville.js';
import { dehyphenate } from '../scripts/dehyphenate.js';
import { stripComments } from '../scripts/strip-comments.js';
import { stripHeaderFooter } from '../scripts/strip-header-footer.js';
import { stripParens } from '../scripts/strip-parens.js';
import { splitForPresentation } from '../scripts/split-for-presentation.js';

const inputEl              = document.getElementById('input');
const fileInput            = document.getElementById('file-input');
const processBtn           = document.getElementById('process-btn');
const outputSection        = document.getElementById('output-section');
const outputEl             = document.getElementById('output');
const copyBtn              = document.getElementById('copy-btn');
const downloadBtn          = document.getElementById('download-btn');
const errorEl              = document.getElementById('error');
const splitCheck           = document.getElementById('t-split-presentation');
const outputSplitControls  = document.getElementById('output-split-controls');
const splitSlider          = document.getElementById('t-split-width');
const splitWidthVal        = document.getElementById('split-width-value');
const toggleChordsBtn      = document.getElementById('toggle-chords-btn');

const checks = {
  nashville:     () => document.getElementById('t-nashville').checked,
  dehyphenate:   () => document.getElementById('t-dehyphenate').checked,
  stripComments: () => document.getElementById('t-strip-comments').checked,
  stripParens:   () => document.getElementById('t-strip-parens').checked,
  stripHeader:   () => document.getElementById('t-strip-header').checked,
  split:         () => splitCheck.checked,
};

// Persist transform settings to localStorage
const SETTINGS_KEY = 'chordpro-settings';

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    nashville:     document.getElementById('t-nashville').checked,
    dehyphenate:   document.getElementById('t-dehyphenate').checked,
    stripComments: document.getElementById('t-strip-comments').checked,
    stripParens:   document.getElementById('t-strip-parens').checked,
    stripHeader:   document.getElementById('t-strip-header').checked,
    split:         splitCheck.checked,
    splitWidth:    parseInt(splitSlider.value, 10),
  }));
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!s) return;
    const restore = (id, val) => { if (val !== undefined) document.getElementById(id).checked = val; };
    restore('t-nashville',      s.nashville);
    restore('t-dehyphenate',    s.dehyphenate);
    restore('t-strip-comments', s.stripComments);
    restore('t-strip-parens',   s.stripParens);
    restore('t-strip-header',   s.stripHeader);
    if (s.split !== undefined) splitCheck.checked = s.split;
    if (s.splitWidth) { splitSlider.value = s.splitWidth; splitWidthVal.textContent = s.splitWidth; }
  } catch {}
}

function updateTransformsCount() {
  const all     = document.querySelectorAll('.transforms input[type="checkbox"]');
  const checked = [...all].filter(cb => cb.checked).length;
  document.getElementById('transforms-count').textContent = `${checked} of ${all.length} active`;
}

loadSettings();
updateTransformsCount();

document.querySelectorAll('.transforms input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => { saveSettings(); updateTransformsCount(); });
});

function stripChords(text) {
  return text
    .split('\n')
    .map(line => line.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim())
    .join('\n');
}

let chordsVisible = true;
let renderedText  = null; // full output with chords, re-used by the toggle

function setOutput(text) {
  renderedText = text;
  outputEl.textContent = chordsVisible ? text : stripChords(text);
}

toggleChordsBtn.addEventListener('click', () => {
  chordsVisible = !chordsVisible;
  toggleChordsBtn.textContent = chordsVisible ? 'Hide chords' : 'Show chords';
  if (renderedText) outputEl.textContent = chordsVisible ? renderedText : stripChords(renderedText);
});

// Text after all transforms except split — re-used when slider moves
let baseText = null;

function applySliderSplit() {
  if (!baseText) return;
  const maxWidth = parseInt(splitSlider.value, 10) || 50;
  splitWidthVal.textContent = maxWidth;
  setOutput(splitForPresentation(baseText, { maxWidth }));
}

splitSlider.addEventListener('input', () => { applySliderSplit(); saveSettings(); });

// If split is toggled while output is already showing, update immediately
splitCheck.addEventListener('change', () => {
  if (!baseText) return;
  if (checks.split()) {
    applySliderSplit();
    outputSplitControls.classList.remove('hidden');
  } else {
    setOutput(baseText);
    outputSplitControls.classList.add('hidden');
  }
});

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => { inputEl.value = e.target.result; };
  reader.readAsText(file);
}

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

inputEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  inputEl.classList.add('drag-over');
});
inputEl.addEventListener('dragleave', () => inputEl.classList.remove('drag-over'));
inputEl.addEventListener('drop', (e) => {
  e.preventDefault();
  inputEl.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

processBtn.addEventListener('click', () => {
  const raw = inputEl.value.trim();
  errorEl.classList.add('hidden');
  outputSection.classList.add('hidden');
  outputSplitControls.classList.add('hidden');
  baseText = null;
  if (!raw) return;

  try {
    let text = raw;
    if (checks.nashville())     text = convertToNashville(text);
    if (checks.dehyphenate())   text = dehyphenate(text);
    if (checks.stripComments()) text = stripComments(text);
    if (checks.stripParens())   text = stripParens(text);
    if (checks.stripHeader())   text = stripHeaderFooter(text);

    baseText = text;

    if (checks.split()) {
      applySliderSplit();
      outputSplitControls.classList.remove('hidden');
    } else {
      setOutput(text);
    }

    outputSection.classList.remove('hidden');
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(renderedText ?? outputEl.textContent);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([renderedText ?? outputEl.textContent], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'song-output.txt';
  a.click();
  URL.revokeObjectURL(url);
});
