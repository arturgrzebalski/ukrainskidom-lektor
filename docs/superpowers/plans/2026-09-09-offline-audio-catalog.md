# Offline Audio Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static offline browser catalog that plays every MP3 and presents Ukrainian and Polish descriptions of its spoken content.

**Architecture:** A Python generator produces `audio-manifest.json` from the folder's MP3 recordings. The browser client consumes that manifest to render and filter accessible tiles, and owns a single HTMLAudioElement for playback coordination. The site requires no server or network after generation completes.

**Tech Stack:** Python 3, `faster-whisper`, `transformers` MarianMT (`Helsinki-NLP/opus-mt-uk-pl`), FFprobe, HTML/CSS, modern browser JavaScript, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-09-offline-audio-catalog-design.md`

## Global Constraints

- Catalog exactly every `*.mp3` file in the project root.
- Generated site must run offline by opening `index.html` in a browser.
- Manifest descriptions must be present in Polish and Ukrainian; untranscribable tracks receive explicit fallback copy in both languages.
- Only one recording may play at a time.
- The project is not a Git repository; do not create commits or initialize Git.

---

## File structure

- `scripts/generate_catalog.py`: scan MP3s, obtain durations, transcribe Ukrainian speech, translate to Polish, and write the manifest.
- `scripts/requirements.txt`: pinned generator dependencies.
- `tests/test_generate_catalog.py`: generator unit tests using temporary fixtures.
- `audio-manifest.json`: generated catalog consumed by the page.
- `index.html`: static application shell.
- `styles.css`: responsive visual system and accessible visual states.
- `app.js`: manifest fetch, UI rendering, filtering, language switching, and playback lifecycle.
- `tests/app.test.mjs`: Node tests for pure browser-client helpers.

### Task 1: Create the deterministic catalog generator

**Files:**
- Create: `scripts/requirements.txt`
- Create: `scripts/generate_catalog.py`
- Create: `tests/test_generate_catalog.py`
- Create: `audio-manifest.json`

**Interfaces:**
- Produces: `build_manifest(audio_dir: pathlib.Path, transcribe: Callable[[Path], str], translate: Callable[[str], str], duration: Callable[[Path], float]) -> list[dict]`.
- Produces: `write_manifest(entries: list[dict], output: pathlib.Path) -> None`.
- Entry shape: `{id, file, title, durationSeconds, transcriptUk, descriptionUk, descriptionPl}`.

- [ ] **Step 1: Write the failing generator tests**

```python
def test_build_manifest_sorts_files_and_emits_bilingual_entry(tmp_path):
    (tmp_path / "b.mp3").write_bytes(b"x")
    (tmp_path / "a.mp3").write_bytes(b"x")
    entries = build_manifest(tmp_path, lambda _: "Привіт.", lambda _: "Cześć.", lambda _: 12.4)
    assert [entry["file"] for entry in entries] == ["a.mp3", "b.mp3"]
    assert entries[0]["descriptionUk"] == "Привіт."
    assert entries[0]["descriptionPl"] == "Cześć."
    assert entries[0]["durationSeconds"] == 12

def test_build_manifest_uses_fallback_copy_for_empty_transcript(tmp_path):
    (tmp_path / "empty.mp3").write_bytes(b"x")
    entry = build_manifest(tmp_path, lambda _: "", lambda _: "", lambda _: 1)[0]
    assert entry["descriptionUk"] == "Опис запису недоступний."
    assert entry["descriptionPl"] == "Opis nagrania jest niedostępny."
```

- [ ] **Step 2: Run the tests and confirm import failure**

Run: `python -m unittest tests/test_generate_catalog.py -v`

Expected: FAIL because `scripts.generate_catalog` does not exist.

- [ ] **Step 3: Implement the pure manifest functions and command-line generator**

```python
FALLBACK_UK = "Опис запису недоступний."
FALLBACK_PL = "Opis nagrania jest niedostępny."

def build_manifest(audio_dir, transcribe, translate, duration):
    entries = []
    for index, path in enumerate(sorted(audio_dir.glob("*.mp3")), start=1):
        transcript = transcribe(path).strip()
        entries.append({
            "id": f"track-{index:03d}", "file": path.name,
            "title": f"Nagranie {index:03d}",
            "durationSeconds": round(duration(path)),
            "transcriptUk": transcript,
            "descriptionUk": transcript or FALLBACK_UK,
            "descriptionPl": translate(transcript).strip() if transcript else FALLBACK_PL,
        })
    return entries
```

Use `ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1` for duration. Lazily load `WhisperModel("small")` with Ukrainian language set to `uk`, and lazily load MarianMT's tokenizer/model to translate each non-empty transcript. Accept `--input` and `--output` arguments, defaulting to the project root and `audio-manifest.json`.

- [ ] **Step 4: Run the generator test suite**

Run: `python -m unittest tests/test_generate_catalog.py -v`

Expected: PASS with both tests passing.

- [ ] **Step 5: Install dependencies and produce the real catalog**

Run: `python -m pip install -r scripts/requirements.txt` followed by `python scripts/generate_catalog.py --input . --output audio-manifest.json`

Expected: `audio-manifest.json` contains 126 sorted entries. The one-time model download may require network access; the produced catalog remains local.

### Task 2: Build and verify pure browser-client behavior

**Files:**
- Create: `app.js`
- Create: `tests/app.test.mjs`

**Interfaces:**
- Produces: `filterEntries(entries: CatalogEntry[], query: string): CatalogEntry[]`.
- Produces: `formatDuration(seconds: number): string`.
- Produces: `textFor(entry: CatalogEntry, language: "pl" | "uk"): string`.

- [ ] **Step 1: Write the failing Node tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterEntries, formatDuration, textFor } from '../app.js';

const entry = { descriptionPl: 'Dzień dobry', descriptionUk: 'Добрий день', transcriptUk: 'Добрий день' };
test('returns selected-language copy', () => assert.equal(textFor(entry, 'uk'), 'Добрий день'));
test('matches Polish and Ukrainian query', () => assert.equal(filterEntries([entry], 'добрий').length, 1));
test('formats duration', () => assert.equal(formatDuration(65), '1:05'));
```

- [ ] **Step 2: Run tests and confirm the missing-module failure**

Run: `node --test tests/app.test.mjs`

Expected: FAIL because `app.js` does not exist.

- [ ] **Step 3: Implement and export pure helpers before DOM initialization**

```js
export function textFor(entry, language) {
  return language === 'uk' ? entry.descriptionUk : entry.descriptionPl;
}
export function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}
export function filterEntries(entries, query) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle ? entries : entries.filter((entry) =>
    [entry.title, entry.transcriptUk, entry.descriptionUk, entry.descriptionPl]
      .some((value) => value.toLocaleLowerCase().includes(needle)));
}
```

- [ ] **Step 4: Run Node tests**

Run: `node --test tests/app.test.mjs`

Expected: PASS with all three tests passing.

### Task 3: Implement the offline catalog interface

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Modify: `app.js`

**Interfaces:**
- Consumes: `audio-manifest.json` entry shape from Task 1 and exported helpers from Task 2.
- Produces: a static page with `#language-toggle`, `#search`, `#track-count`, `#catalog`, and `#status` elements.

- [ ] **Step 1: Add the accessible HTML shell**

```html
<header class="hero"><p class="eyebrow">UKR LEKTOR</p><h1>Katalog nagrań</h1></header>
<main>
  <div class="toolbar"><div id="language-toggle" role="group" aria-label="Język opisów"></div><label>Wyszukaj<input id="search" type="search"></label></div>
  <p id="track-count" aria-live="polite"></p><p id="status" role="status"></p>
  <section id="catalog" class="catalog" aria-label="Nagrania"></section>
</main>
<script type="module" src="app.js"></script>
```

- [ ] **Step 2: Add responsive styles**

Create a high-contrast, warm paper-and-ink layout with a CSS grid: `repeat(auto-fill, minmax(260px, 1fr))`. Give each `.track-card` a clear focus ring, a visible playing accent, and buttons with a minimum 44px touch target. At `max-width: 600px`, reduce page padding and make the toolbar stack vertically.

- [ ] **Step 3: Connect manifest loading, tile rendering, and playback**

```js
const player = new Audio();
let currentId = null;
async function loadCatalog() {
  const response = await fetch('./audio-manifest.json');
  if (!response.ok) throw new Error('Nie można wczytać katalogu.');
  return response.json();
}
function play(entry) {
  if (currentId && currentId !== entry.id) { player.pause(); player.currentTime = 0; }
  player.src = encodeURI(entry.file); currentId = entry.id; player.play(); render();
}
player.addEventListener('ended', () => { currentId = null; render(); });
```

Render language buttons, search-filtered cards, count text, and play/stop controls. Catch manifest and audio promise errors, placing localized messages in `#status`. When a card's stop button is selected, pause, reset, clear `currentId`, and render again.

- [ ] **Step 4: Serve locally and exercise the UI**

Run: `python -m http.server 8000`

Open: `http://localhost:8000/index.html`

Expected: all 126 tiles display; language switch changes descriptions; search reduces the count; selecting a second tile stops the first; changing state is announced by controls.

### Task 4: Perform final catalog and offline checks

**Files:**
- Modify: `audio-manifest.json` only if generator output needs refreshing.

**Interfaces:**
- Consumes: generator output and static UI from Tasks 1–3.
- Produces: verified local deliverable.

- [ ] **Step 1: Validate catalog coverage and bilingual fields**

Run: `python -c "import json, pathlib; data=json.load(open('audio-manifest.json', encoding='utf8')); files=list(pathlib.Path('.').glob('*.mp3')); assert len(data)==len(files)==126; assert all(x['descriptionPl'] and x['descriptionUk'] and x['durationSeconds'] >= 0 for x in data); print(f'{len(data)} tracks validated')"`

Expected: `126 tracks validated`.

- [ ] **Step 2: Run both automated suites**

Run: `python -m unittest tests/test_generate_catalog.py -v; node --test tests/app.test.mjs`

Expected: all Python and Node tests PASS.

- [ ] **Step 3: Confirm local assets need no external network requests**

Open the static page through the local server and inspect the browser network log.

Expected: only `index.html`, `styles.css`, `app.js`, `audio-manifest.json`, and requested local MP3 files are fetched; no remote fonts, APIs, or scripts are requested.
