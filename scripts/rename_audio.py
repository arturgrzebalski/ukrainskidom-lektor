"""Rename catalog MP3 files to queue codes and keep both manifests in sync."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIRECTORY = "audio"
DESCRIPTIVE_NAMES = {
    "track-001": "prosze-czekac",
    "track-002": "recepcja",
    "track-122": "recepcja-legalizacja",
    "track-123": "recepcja-zatrudnienie",
    "track-124": "recepcja-mieszkania",
    "track-125": "recepcja-sprawy-ogolne",
}
QUEUE_CODE = re.compile(r"([LMOPЛМОП])\s*[-,]?\s*(\d(?:[\s,.-]?\d){2})", re.IGNORECASE)
CYRILLIC_PREFIXES = str.maketrans({"Л": "L", "М": "M", "О": "O", "П": "P"})


def target_name(entry: dict[str, Any]) -> str:
    """Return the stable filename prescribed by a catalog entry."""
    if entry["id"] in DESCRIPTIVE_NAMES:
        return f"{DESCRIPTIVE_NAMES[entry['id']]}.mp3"

    match = QUEUE_CODE.search(entry.get("transcriptUk", ""))
    if not match:
        raise ValueError(f"No filename rule for {entry['id']}: {entry.get('transcriptUk', '')}")
    prefix = match.group(1).upper().translate(CYRILLIC_PREFIXES)
    digits = re.sub(r"\D", "", match.group(2))
    return f"{prefix}{digits}.mp3"


def rename_audio_files(project_root: Path, manifest_path: Path) -> None:
    """Rename MP3s named in *manifest_path*, then rewrite JSON and browser manifest."""
    entries = json.loads(manifest_path.read_text(encoding="utf-8"))
    plan = [
        (entry, project_root / entry["file"], project_root / AUDIO_DIRECTORY / target_name(entry))
        for entry in entries
    ]
    targets = [target for _, _, target in plan]
    if len(set(targets)) != len(targets):
        raise ValueError("Two catalog entries would receive the same filename.")
    for _, source, target in plan:
        if not source.is_file():
            raise FileNotFoundError(source)
        if source != target and target.exists():
            raise FileExistsError(target)

    (project_root / AUDIO_DIRECTORY).mkdir(exist_ok=True)
    for _, source, target in plan:
        if source != target:
            source.rename(source.with_name(f".renaming-{source.name}"))
    for entry, source, target in plan:
        temporary = source.with_name(f".renaming-{source.name}")
        if source != target:
            temporary.rename(target)
        entry["file"] = target.relative_to(project_root).as_posix()

    content = json.dumps(entries, ensure_ascii=False, indent=2) + "\n"
    manifest_path.write_text(content, encoding="utf-8")
    manifest_path.with_name("audio-manifest.js").write_text(
        f"globalThis.AUDIO_MANIFEST = {content}", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, default=PROJECT_ROOT)
    parser.add_argument("--manifest", type=Path, default=PROJECT_ROOT / "audio-manifest.json")
    args = parser.parse_args()
    rename_audio_files(args.project, args.manifest)
    print("Renamed catalog audio files and updated manifests.")


if __name__ == "__main__":
    main()
