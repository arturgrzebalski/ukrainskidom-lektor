# Task 1 report — deterministic catalog generator

## Files changed

- `scripts/requirements.txt` — pinned generator dependencies: Faster Whisper, Transformers, SentencePiece, and PyTorch.
- `scripts/generate_catalog.py` — deterministic root-level MP3 scanner, pure manifest writer, FFprobe duration reader, lazy Faster Whisper Ukrainian transcription, lazy MarianMT Ukrainian-to-Polish translation, and CLI.
- `tests/test_generate_catalog.py` — the two prescribed `unittest` cases for sorting/bilingual values and fallback copy.

`audio-manifest.json` was intentionally not generated, and dependencies were intentionally not installed, per the task brief.

## Test-first evidence

The prescribed test command was run before implementation:

```text
python -m unittest tests/test_generate_catalog.py -v
...
ModuleNotFoundError: No module named 'scripts'
...
FAILED (errors=1)
```

After implementation, the test and syntax-check command was run:

```text
python -m unittest tests/test_generate_catalog.py -v; python -m py_compile scripts/generate_catalog.py
test_build_manifest_sorts_files_and_emits_bilingual_entry ... ok
test_build_manifest_uses_fallback_copy_for_empty_transcript ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.010s

OK
```

## Self-review

Pass. `build_manifest` scans only sorted root-level `*.mp3` files; produces stable three-digit IDs and Polish titles; rounds FFprobe durations; retains the Ukrainian transcript; and applies the exact specified bilingual fallback strings when the stripped transcript is empty. External model imports occur only when the CLI factory functions are called, so unit-test imports do not require installed model dependencies. The CLI defaults point to the project root and `audio-manifest.json` there, while allowing explicit paths through `--input` and `--output`.

## Concerns

- Real generation requires FFprobe to be on `PATH`.
- The controller must install the pinned dependencies and allow the initial Faster Whisper and MarianMT model downloads before running the generator.
- The current generator intentionally propagates FFprobe/model errors so failed catalog data is not silently emitted.
