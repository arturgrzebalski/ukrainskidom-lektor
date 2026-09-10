import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts.generate_catalog import build_manifest, write_manifest


class BuildManifestTests(unittest.TestCase):
    def test_checked_in_manifest_preserves_corrected_polish_descriptions(self):
        manifest = json.loads(
            (Path(__file__).resolve().parent.parent / "audio-manifest.json").read_text(
                encoding="utf-8"
            )
        )
        descriptions = {entry["id"]: entry["descriptionPl"] for entry in manifest}

        self.assertEqual(descriptions["track-009"], "Zapraszamy, numer l007.")
        self.assertEqual(descriptions["track-033"], "Zapraszamy, numer M001.")
        self.assertEqual(descriptions["track-036"], "Zapraszamy, numer M004")
        self.assertEqual(descriptions["track-037"], "Zapraszamy, numer M005.")
        self.assertEqual(descriptions["track-038"], "Zapraszamy, numer M006.")
        self.assertEqual(descriptions["track-041"], "Zapraszamy, numer M009.")
        self.assertEqual(descriptions["track-055"], "Zapraszamy, numer M024.")
        self.assertEqual(descriptions["track-067"], "Zapraszamy, numer O, 006.")
        self.assertEqual(
            descriptions["track-122"],
            "Proszę zgłosić się do recepcji, do działu legalizacji.",
        )
        self.assertNotIn("track-126", descriptions)

    def test_write_manifest_writes_json_and_sibling_javascript_assignment(self):
        entries = [{"id": "track-001", "title": "Nagranie 001"}]

        with TemporaryDirectory() as directory:
            output = Path(directory) / "audio-manifest.json"
            write_manifest(entries, output)

            self.assertEqual(json.loads(output.read_text(encoding="utf-8")), entries)
            javascript = output.with_name("audio-manifest.js").read_text(encoding="utf-8")

        self.assertEqual(
            javascript,
            'globalThis.AUDIO_MANIFEST = [\n  {\n    "id": "track-001",\n    "title": "Nagranie 001"\n  }\n];\n',
        )

    def test_build_manifest_sorts_files_and_emits_bilingual_entry(self):
        with TemporaryDirectory() as directory:
            audio_dir = Path(directory)
            (audio_dir / "b.mp3").write_bytes(b"x")
            (audio_dir / "a.mp3").write_bytes(b"x")

            entries = build_manifest(
                audio_dir,
                lambda _: "Привіт.",
                lambda _: "Cześć.",
                lambda _: 12.4,
            )

        self.assertEqual([entry["file"] for entry in entries], ["a.mp3", "b.mp3"])
        self.assertEqual(entries[0]["descriptionUk"], "Привіт.")
        self.assertEqual(entries[0]["descriptionPl"], "Cześć.")
        self.assertEqual(entries[0]["durationSeconds"], 12)

    def test_build_manifest_uses_fallback_copy_for_empty_transcript(self):
        with TemporaryDirectory() as directory:
            audio_dir = Path(directory)
            (audio_dir / "empty.mp3").write_bytes(b"x")

            entry = build_manifest(audio_dir, lambda _: "", lambda _: "", lambda _: 1)[0]

        self.assertEqual(entry["descriptionUk"], "Опис запису недоступний.")
        self.assertEqual(entry["descriptionPl"], "Opis nagrania jest niedostępny.")
