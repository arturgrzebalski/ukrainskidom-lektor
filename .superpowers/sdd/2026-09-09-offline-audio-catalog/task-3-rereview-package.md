# Scoped re-review package — Task 3, fix round 1

Open findings to verify:

- P2: after a manifest or audio error, changing language left `#status` in its previous language.

Changed current files:

- `app.js`: retains a logical `statusKey` and rerenders status using the selected language.
- `tests/app.test.mjs`: adds a test for the new pure `renderStatus(language, key)` helper.

Verify that the finding is addressed and that the focused change introduces no new breakage. Full evidence is appended to `task-3-report.md`.
