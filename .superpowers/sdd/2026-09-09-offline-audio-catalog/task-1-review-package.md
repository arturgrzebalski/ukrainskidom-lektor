# Review package — Task 1

This project has no Git history, so all files below are new for this task. Review the current versions at the listed absolute project-relative paths as the effective diff:

- `scripts/requirements.txt`
- `scripts/generate_catalog.py`
- `tests/test_generate_catalog.py`

Required behavior: scan exactly sorted root-level MP3 files; emit entries with `id`, `file`, `title`, `durationSeconds`, `transcriptUk`, `descriptionUk`, `descriptionPl`; use the exact bilingual fallback strings for empty transcription; use FFprobe for duration; use a lazily constructed Faster Whisper `small` Ukrainian transcriber and MarianMT `Helsinki-NLP/opus-mt-uk-pl` translator; expose the pure functions and CLI arguments described in the brief. The full implementation report is in `task-1-report.md`.
