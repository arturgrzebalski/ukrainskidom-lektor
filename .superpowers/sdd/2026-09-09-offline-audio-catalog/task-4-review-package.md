# Review package — Task 4

This project has no Git history. Review current versions of:

- `scripts/generate_catalog.py`
- `tests/test_generate_catalog.py`
- `index.html`
- `app.js`
- `tests/app.test.mjs`
- `audio-manifest.json`
- `audio-manifest.js`

Required behavior: direct filesystem opening of `index.html` cannot depend on an HTTP server. A generated `audio-manifest.js` must assign the exact JSON content to `globalThis.AUDIO_MANIFEST`, HTML must load it before the module, and the app must consume it synchronously with a localized failure only if it is not an array. Existing behavior and exports must stay intact. Verify tests evidence and 126-entry coverage from `task-4-report.md`. Do not modify files.
