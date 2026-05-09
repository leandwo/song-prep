# SongPrep

A browser-based tool for preparing ChordPro songs for worship presentation. Paste or upload a `.cho` file, choose your transforms, and get clean output ready for ProPresenter or any lyric display.

**[song-prep.ko.church](https://song-prep.ko.church)**

## What it does

SongPrep runs a configurable pipeline of transforms on ChordPro-formatted songs:

| Transform | Description |
|-----------|-------------|
| **Nashville numbers** | Converts chord names to scale-degree numbers relative to the song's key (`[G]` → `[ 1 ]`, `[Am]` → `[ 2m ]`) |
| **Dehyphenate** | Joins syllable-split words back together (`sepa - rate` → `separate`) |
| **Strip comments** | Converts `{comment: …}` directives to plain text |
| **Strip parentheses** | Removes parenthetical notes like `(v2 only)` |
| **Strip header / footer** | Removes the metadata block at the top and the CCLI footer |
| **Split for presentation** | Breaks lyrics into 2-line slides sized for a display width you control |

The split transform keeps wrapped lines together in the same slide and balances line lengths across multi-line wraps.

## Usage

1. Paste a ChordPro song into the input box, or drag and drop / upload a `.cho` / `.txt` file
2. Select which transforms to apply (settings are remembered between sessions)
3. Click **Process**
4. Use the **Hide chords** toggle to preview lyrics-only view
5. Adjust the **Max width** slider to tune slide line length
6. **Copy** or **Download** the result

## Running locally

```bash
pnpm install
pnpm dev
```

Requires Node 20+. No server — everything runs in the browser.

## Tech

- [Vite](https://vitejs.dev/) — build tool
- Vanilla JS + CSS — no frameworks
- Deployed to [Cloudflare Pages](https://pages.cloudflare.com/), auto-deployed on push to `main`
