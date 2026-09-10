# Task 4 report — direct-file offline manifest

## Outcome

The catalog no longer fetches `audio-manifest.json` at runtime. `index.html` loads
the generated non-module `audio-manifest.js` before the `app.js` module, allowing
the page to render when opened directly from the filesystem.

`app.js` reads `globalThis.AUDIO_MANIFEST` synchronously. It renders the catalog
when the value is an array and presents `loadingError` only when it is not an
array. Existing exported pure helpers and browser interaction behavior were
retained.

## Red / green evidence

Red run before implementation:

- `python -m unittest tests.test_generate_catalog.BuildManifestTests.test_write_manifest_writes_json_and_sibling_javascript_assignment`
  failed with `FileNotFoundError` for the missing `audio-manifest.js` sibling.
- `node --test tests/app.test.mjs` failed the new script-order check because
  `index.html` did not load `audio-manifest.js`; the other five Node tests passed.

Green runs after implementation:

- `python -m unittest discover -s tests` — 3 tests passed.
- `node --test tests/app.test.mjs` — 6 tests passed.

## Changed files

- `scripts/generate_catalog.py`: `write_manifest` now writes the original
  readable UTF-8 JSON plus sibling `audio-manifest.js` in the exact assignment
  form `globalThis.AUDIO_MANIFEST = <JSON>;`.
- `tests/test_generate_catalog.py`: added coverage for both generated artifacts.
- `index.html`: loads the non-module manifest script before the app module.
- `app.js`: removes runtime fetch and initializes synchronously from the global
  manifest.
- `tests/app.test.mjs`: added manifest-script load-order coverage.
- `audio-manifest.json` and `audio-manifest.js`: regenerated only by passing the
  existing JSON data to `write_manifest`; no transcription, translation, or audio
  downloads were performed.

## Manifest validation

The regenerated JSON contains **126 entries**. The JavaScript artifact was
verified to equal `globalThis.AUDIO_MANIFEST = ` followed by the same UTF-8,
indented JSON data and a trailing semicolon/newline.

## Concerns

The default `python -m unittest` invocation discovers no tests in this project;
the complete Python suite requires explicit `discover -s tests`, which was used
for verification. No other concerns identified.

## Fix round 1 — inline runtime for `file://`

### Issue addressed

An external module script (`<script type="module" src="app.js">`) can be
blocked when `index.html` is opened from a `file://` origin. The browser runtime
is now self-contained in `index.html`: the generated non-module
`audio-manifest.js` loads first, followed by an inline module containing the
catalog runtime. `app.js` remains unchanged as the Node-tested pure-helper
module.

### Red / green evidence

Red run before the markup change:

- `node --test tests/app.test.mjs` failed the new direct-file test with
  `index.html should not load app.js as an external module` (`true !== false`).
  The remaining five Node tests passed.

Green verification after the change:

- `python -m unittest discover -s tests` — 3 tests passed.
- `node --test tests/app.test.mjs` — 6 tests passed, including the new test that
  confirms no external `app.js` module, an inline module after
  `audio-manifest.js`, and a `globalThis.AUDIO_MANIFEST` reference in that
  runtime.
- The artifact validation again confirmed 126 JSON entries and the exact
  `globalThis.AUDIO_MANIFEST = <JSON>;` JavaScript assignment.

### Changed files in this fix round

- `index.html`: replaced the external `app.js` module element with the inline
  catalog module runtime, after `audio-manifest.js`.
- `tests/app.test.mjs`: strengthened the script-order test to enforce the
  self-contained direct-file runtime.

### Fix-round concern

The browser runtime is intentionally duplicated between `index.html` and
`app.js` so that `file://` opening avoids an external module request while the
existing Node pure-helper exports remain unchanged. Future behavior changes to
the runtime should update both copies together.

## Final fix wave — translation and runtime accessibility

### Manifest corrections

Inspected the Ukrainian transcripts and corrected the drifted Polish descriptions
for every matching numbered-announcement record, including the cited entries.
The corrected values now preserve the source identifiers and meaning:

- `track-009`, `track-033`, `track-036`, `track-037`, `track-038`, `track-041`,
  and `track-055` now say `Zapraszamy, numer …` rather than changing the
  announcement into a presentation, lecture, or request to send something.
- `track-067` now preserves `O, 006`, without changing it to `O, 0006`.
- `track-122` and `track-126` now retain the destination department:
  `Proszę zgłosić się do recepcji, do działu legalizacji.`

`audio-manifest.js` was regenerated solely with `write_manifest` from the edited
existing JSON; no audio, transcription, or model download action was performed.

### Browser runtime fixes

Both `app.js` and the inline `index.html` runtime now:

- assign stable `data-track-id` attributes to cards and playback buttons;
- remember the focused playback-button track before replacing rendered cards and
  restore focus to its replacement when it is still visible;
- apply the active language to dynamic search, count, status, empty-state,
  duration, description, and playback-button text, including `lang="uk"` for
  Ukrainian descriptions and localized UI text;
- clear a previous audio-error status only in the fulfilled `audio.play()` path,
  leaving the error visible when playback fails.

### Red / green evidence

Red runs before implementation:

- The new Python manifest regression failed at `track-009`: the checked-in value
  was `Zapraszamy na prezentację L007.` rather than the transcript-faithful
  `Zapraszamy, numer l007.`.
- The strengthened Node runtime tests failed because the inline runtime had no
  focus-restoration/data-language structure and no successful-playback
  `setStatus(null)` path. The existing six tests passed.

Green verification after implementation:

- `python -m unittest discover -s tests` — 4 tests passed.
- `node --test tests/app.test.mjs` — 8 tests passed. The added tests inspect the
  actual inline module for focus restoration, stable track identifiers, dynamic
  language metadata, and success-only clearing of audio errors.
- JSON and JavaScript manifest validation confirmed 126 identical entries and
  the exact generated `globalThis.AUDIO_MANIFEST = <JSON>;` assignment.

### Changed files in this wave

- `audio-manifest.json` and regenerated `audio-manifest.js`
- `tests/test_generate_catalog.py`
- `app.js` and the inline module in `index.html`
- `tests/app.test.mjs`

### Remaining concern

The required self-contained `file://` implementation still intentionally keeps
the browser runtime in both `app.js` and the inline module. The current tests
cover critical inline behavior, but future runtime edits should be mirrored in
both locations.
