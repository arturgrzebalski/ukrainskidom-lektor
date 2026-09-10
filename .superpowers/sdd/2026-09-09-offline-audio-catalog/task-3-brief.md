# Task 3 brief — offline catalog interface

Read this first: it is the complete requirements for this task.

Create `index.html` and `styles.css`, then extend `app.js` from Task 2 into the browser application while preserving its three named exports and their tests. Do not change the generator, manifest, or existing tests. Do not use subagents and do not use Git.

The HTML must include `#language-toggle`, `#search`, `#track-count`, `#catalog`, and `#status`, with clear labels and accessible live/status regions. The page must load `app.js` as a module and have no external assets.

The CSS must use a responsive grid `repeat(auto-fill, minmax(260px, 1fr))`, high contrast warm paper-and-ink appearance, clear focus styling, visible playing state, 44px touch targets, and a mobile toolbar stack below 600px.

The browser behavior fetches `./audio-manifest.json`, renders language buttons and filtered cards, updates count, and plays only one track at a time. Starting another track pauses and resets the prior. Play/stop buttons and their pressed states follow current playback. Use `encodeURI(entry.file)` for filenames. Manifest and audio failures produce readable localized status messages. Never execute DOM initialization during Node tests: guard it on `typeof document !== 'undefined'`.

Before creating production HTML/CSS/DOM code, add an additional failing Node test in `tests/app.test.mjs` for a pure `statusText(language, key)` export that returns a nonempty Polish and Ukrainian text for both `loadingError` and `audioError`. Then implement it and run the full Node test suite. This is the Task 3 test-first proof.

Write a complete report to `.superpowers/sdd/2026-09-09-offline-audio-catalog/task-3-report.md` with files changed, red/green evidence, UI behavior, self-review, and concerns. Return only status, one-line test result, and concerns.
