# Task 2 brief — browser client helpers

Read this first: it is the complete requirements for this task.

Create `app.js` and `tests/app.test.mjs` with test-first development. First add exactly the Node built-in tests for selected-language text, Polish/Ukrainian search, and `65 -> "1:05"` formatting. Run them before `app.js` exists to prove the expected missing-module failure.

In `app.js`, export `textFor(entry, language)`, `formatDuration(seconds)`, and `filterEntries(entries, query)`. Search must match title, Ukrainian transcript, and descriptions in both languages case-insensitively. Keep DOM behavior out of this task: only pure helpers belong in the initial file. Do not change the generator, tests, or manifest. Do not use subagents. No Git actions: this project is not a Git repository.

Write a full report to `.superpowers/sdd/2026-09-09-offline-audio-catalog/task-2-report.md` with files changed, red/green test evidence, self-review, and concerns. Return only status, a one-line test summary, and concerns.
