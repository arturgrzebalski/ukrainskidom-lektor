# Task 2 report — browser client helpers

## Files changed

- `app.js`: added pure exports `textFor`, `formatDuration`, and `filterEntries`.
- `tests/app.test.mjs`: added three Node built-in tests covering selected-language text, title/transcript/Polish/Ukrainian description search, and duration formatting.

## Red/green test evidence

- Red: ran `node --test tests/app.test.mjs` before `app.js` existed; the test run failed with `ERR_MODULE_NOT_FOUND` for `app.js`.
- Green: ran `node --test tests/app.test.mjs` after implementation and refactoring; all 3 tests passed, with 0 failures, cancellations, or skips.

## Self-review

- Helpers are pure and contain no DOM access or browser initialization.
- `textFor` selects Polish by default and Ukrainian when requested.
- `filterEntries` searches title, Ukrainian transcript, and both descriptions case-insensitively; empty queries return the original entries.
- `formatDuration(65)` returns `1:05` and handles non-negative whole-second output.

## Concerns

- The helpers assume catalog entries use the manifest field names specified by the project (`title`, `transcriptUk`, `descriptionUk`, `descriptionPl`).
- No DOM or manifest-loading behavior is included, as required for this task.
