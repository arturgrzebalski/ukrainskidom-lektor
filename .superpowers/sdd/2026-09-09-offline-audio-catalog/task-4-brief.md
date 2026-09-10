# Task 4 brief — direct-file offline manifest and final checks

Read this first: it is the complete requirements for this task.

The static page must work without an HTTP server when the user opens `index.html` directly. Replace runtime `fetch('./audio-manifest.json')` with a generated `audio-manifest.js` loaded by a non-module script before `app.js`. It must safely assign the manifest to `globalThis.AUDIO_MANIFEST`; `app.js` must render it synchronously, show `loadingError` only when the global is not an array, and preserve every existing pure helper/export and browser behavior.

Extend the generator so its existing `write_manifest(entries, output)` writes the existing UTF-8 JSON and a sibling JavaScript file named `audio-manifest.js` with an assignment in the exact form `globalThis.AUDIO_MANIFEST = <JSON>;`. Add a Python test that calls `write_manifest` in a temporary directory and verifies both JSON data and the JS assignment. First run that new test before implementation and confirm it fails because JS is absent; then implement and rerun all Python tests.

Add a Node test that reads `index.html` and asserts that it loads `audio-manifest.js` before `app.js`; run it first before HTML modification and confirm failure, then implement the minimal HTML/app changes and run the complete Node suite. Regenerate `audio-manifest.json` and `audio-manifest.js` from the real 126 entries without retranscribing or downloading models by invoking only `write_manifest` through a short Python command that loads the existing JSON. Do not change descriptions or MP3s. Do not use subagents or Git.

Write a complete report to `.superpowers/sdd/2026-09-09-offline-audio-catalog/task-4-report.md` with red/green evidence, changed files, the 126-entry validation result, and concerns. Return only status, one-line test result, and concerns.
