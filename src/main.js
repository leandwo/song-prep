import { convertToNashville } from '../scripts/chord-to-nashville.js';
import { dehyphenate } from '../scripts/dehyphenate.js';
import { stripComments } from '../scripts/strip-comments.js';
import { stripHeaderFooter } from '../scripts/strip-header-footer.js';
import { splitForPresentation } from '../scripts/split-for-presentation.js';

const inputEl       = document.getElementById('input');
const fileInput     = document.getElementById('file-input');
const processBtn    = document.getElementById('process-btn');
const outputSection = document.getElementById('output-section');
const outputEl      = document.getElementById('output');
const copyBtn       = document.getElementById('copy-btn');
const downloadBtn   = document.getElementById('download-btn');
const errorEl       = document.getElementById('error');

const splitCheck = document.getElementById('t-split-presentation');
const splitSub   = document.getElementById('split-sub');

splitCheck.addEventListener('change', () => {
  splitSub.classList.toggle('hidden', !splitCheck.checked);
});

const checks = {
  nashville:     () => document.getElementById('t-nashville').checked,
  dehyphenate:   () => document.getElementById('t-dehyphenate').checked,
  stripComments: () => document.getElementById('t-strip-comments').checked,
  stripHeader:   () => document.getElementById('t-strip-header').checked,
  split:         () => splitCheck.checked,
};

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
  if (!raw) return;

  try {
    let text = raw;
    if (checks.nashville())     text = convertToNashville(text);
    if (checks.dehyphenate())   text = dehyphenate(text);
    if (checks.stripComments()) text = stripComments(text);
    if (checks.stripHeader())   text = stripHeaderFooter(text);
    if (checks.split()) {
      const maxWidth = parseInt(document.getElementById('t-split-width').value, 10) || 50;
      text = splitForPresentation(text, { maxWidth });
    }

    outputEl.textContent = text;
    outputSection.classList.remove('hidden');
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(outputEl.textContent);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([outputEl.textContent], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'song-output.txt';
  a.click();
  URL.revokeObjectURL(url);
});
