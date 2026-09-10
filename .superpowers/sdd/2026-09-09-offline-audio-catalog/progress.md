# SDD ledger — plan: docs/superpowers/plans/2026-09-09-offline-audio-catalog.md

## Preflight

| Scope | Contract checked | Result |
|---|---|---|
| Task 1 → Task 3 | Task 1 produces `audio-manifest.json` with the fields Task 3 consumes | Compatible: both use `file`, `id`, descriptions, transcript, and duration. |
| Task 2 → Task 3 | Task 2 exports `filterEntries`, `formatDuration`, and `textFor`; Task 3 imports them in the browser client | Compatible. |
| Task 1 → Task 4 | Task 1 produces 126 bilingual manifest entries; Task 4 validates that invariant | Compatible. |
| Task 1 itself | Test examples agree with `build_manifest` signature and expected rounded duration | Compatible. |
| Task 2 itself | Tests agree with exported helper signatures and behavior | Compatible. |
| Task 3 itself | DOM ids and static asset names agree with the client implementation requirements | Compatible. |
| Task 4 itself | Validation agrees with generated manifest and test file locations | Compatible. |

Ruling: Execute directly in the project folder without a Git worktree or commits — this folder has no Git repository, and the plan expressly forbids initializing one — cost if wrong: there is no commit-based rollback, but every modified file remains directly inspectable and recoverable.

Task 1: complete (no Git range; review clean)
Ruling: Update `sentencepiece` from 0.2.0 to 0.2.2 — 0.2.0 fails to build under Python 3.14, while the PyPI wheel for 0.2.2 installed successfully — cost if wrong: a newer tokenization dependency could affect MarianMT loading, which will be caught before generation.
Ruling: Update `torch` from 2.6.0 to 2.14.0 — the Python 3.14 package index offers PyTorch from 2.9.0 onward, and 2.14.0 installed in this environment — cost if wrong: Transformers compatibility could fail during catalog generation, which will be detected before publishing the static catalog.
Task 2: complete (no Git range; review clean)
Task 3: fix round 1/5 (1 addressed, 0 open — persisted status localization; no Git range)
Task 3: complete (no Git range; review clean)
Ruling: Replace runtime manifest `fetch()` with a generated local JavaScript data file — a static page must function when opened directly without any HTTP server, while browser security policy blocked an in-app `file://` verification and local port binding is unavailable — cost if wrong: the generator must keep JSON and JavaScript manifest outputs in sync, which dedicated tests will enforce.
Task 4: fix round 1/5 (1 addressed, 0 open — inline runtime avoids external module on `file://`; no Git range)
Task 4: final fix wave complete (translation fidelity, focus restoration, language metadata, and stale-error clearing; no Git range)
Task 4: complete (no Git range; final review found no Critical or Important issue)
