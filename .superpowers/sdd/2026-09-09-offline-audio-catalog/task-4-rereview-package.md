# Scoped re-review package — Task 4, fix round 1

Open finding:

- High: `index.html` loaded `app.js` as an external ES module, which can be blocked under `file://` CORS.

Changed files:

- `index.html`: replaces the external module with an inline module after `audio-manifest.js`.
- `tests/app.test.mjs`: asserts no external module, correct script order, and direct global manifest access.

Verify the High finding is addressed and note any new breakage in the focused change. Do not modify files.
