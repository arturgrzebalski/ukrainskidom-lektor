"""Build a local bilingual catalog for root-level MP3 recordings."""

from __future__ import annotations

import argparse
import json
import subprocess
from collections.abc import Callable
from pathlib import Path
from typing import Any


FALLBACK_UK = "Опис запису недоступний."
FALLBACK_PL = "Opis nagrania jest niedostępny."
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def build_manifest(
    audio_dir: Path,
    transcribe: Callable[[Path], str],
    translate: Callable[[str], str],
    duration: Callable[[Path], float],
) -> list[dict[str, Any]]:
    """Return sorted catalog entries without loading external model dependencies."""
    entries = []
    for index, path in enumerate(sorted(audio_dir.glob("*.mp3")), start=1):
        transcript = transcribe(path).strip()
        entries.append(
            {
                "id": f"track-{index:03d}",
                "file": path.name,
                "title": f"Nagranie {index:03d}",
                "durationSeconds": round(duration(path)),
                "transcriptUk": transcript,
                "descriptionUk": transcript or FALLBACK_UK,
                "descriptionPl": translate(transcript).strip() if transcript else FALLBACK_PL,
            }
        )
    return entries


def write_manifest(entries: list[dict[str, Any]], output: Path) -> None:
    """Write the manifest as readable UTF-8 JSON and a browser-ready sibling."""
    manifest_json = json.dumps(entries, ensure_ascii=False, indent=2)
    output.write_text(manifest_json + "\n", encoding="utf-8")
    output.with_name("audio-manifest.js").write_text(
        f"globalThis.AUDIO_MANIFEST = {manifest_json};\n", encoding="utf-8"
    )


def get_duration(path: Path) -> float:
    """Read an MP3 duration in seconds with FFprobe."""
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nokey=1:noprint_wrappers=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def create_transcriber() -> Callable[[Path], str]:
    """Create a Ukrainian Faster Whisper transcriber on first CLI use."""
    from faster_whisper import WhisperModel

    model = WhisperModel("small")

    def transcribe(path: Path) -> str:
        segments, _ = model.transcribe(str(path), language="uk")
        return "".join(segment.text for segment in segments)

    return transcribe


def create_translator() -> Callable[[str], str]:
    """Create a Ukrainian-to-Polish MarianMT translator on first use."""
    from transformers import MarianMTModel, MarianTokenizer

    model_name = "Helsinki-NLP/opus-mt-uk-pl"
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)

    def translate(text: str) -> str:
        inputs = tokenizer([text], return_tensors="pt", padding=True, truncation=True)
        output_ids = model.generate(**inputs)
        return tokenizer.decode(output_ids[0], skip_special_tokens=True)

    return translate


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", type=Path, default=PROJECT_ROOT, help="directory containing MP3 files"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=PROJECT_ROOT / "audio-manifest.json",
        help="path for the generated JSON manifest",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    entries = build_manifest(
        args.input, create_transcriber(), create_translator(), get_duration
    )
    write_manifest(entries, args.output)
    print(f"Wrote {len(entries)} entries to {args.output}")


if __name__ == "__main__":
    main()
