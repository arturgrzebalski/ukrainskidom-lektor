# Task 1 brief — deterministic catalog generator

Read this first: it is the complete requirements for this task.

Create `scripts/requirements.txt`, `scripts/generate_catalog.py`, and `tests/test_generate_catalog.py`. Use test-first development: first create the two `unittest` test cases specified in the implementation plan, run them to prove the module is missing, then implement the module and rerun them.

Expose `build_manifest(audio_dir, transcribe, translate, duration)` and `write_manifest(entries, output)`. It scans sorted root-level MP3 files and produces entries with `id`, `file`, `title`, `durationSeconds`, `transcriptUk`, `descriptionUk`, and `descriptionPl`. Empty transcripts use exactly `Опис запису недоступний.` / `Opis nagrania jest niedostępny.`.

Implement a CLI with `--input` and `--output`, defaulting to project root and `audio-manifest.json`. Use FFprobe to get duration, lazily load Faster Whisper `small` to transcribe as Ukrainian, and lazily load MarianMT `Helsinki-NLP/opus-mt-uk-pl` to translate nonempty transcripts. Do not run dependency installation or generate the actual 126-entry manifest: the controller will do that after review. Do not use subagents. No Git actions: this project is not a Git repository.

Write a complete report to `.superpowers/sdd/2026-09-09-offline-audio-catalog/task-1-report.md` containing files changed, test command and output, self-review result, and concerns. Return only status, one-line test summary, and concerns.
