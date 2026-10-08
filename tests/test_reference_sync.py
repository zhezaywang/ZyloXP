import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sync", ROOT / "tools/sync_question_bank.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class ReferenceSyncTests(unittest.TestCase):
    def test_all_displayed_references_are_valid_svg(self):
        paths = list((ROOT / "public/question-bank/images").glob("*.svg"))
        paths += list((ROOT / "public").glob("lab-*-reference.svg"))
        self.assertEqual(len(paths), 30)
        for path in paths:
            tree = sync.ET.parse(path)
            self.assertEqual(tree.getroot().tag, "{http://www.w3.org/2000/svg}svg")
            self.assertIsNotNone(tree.find("{http://www.w3.org/2000/svg}title"))

    def test_sync_preserves_corrected_images_and_rejects_changed_prompts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "upstream.svg"
            source.write_text("old incorrect drawing", encoding="utf-8")
            for name in sync.REVIEWED_REFERENCE_IMAGES:
                original = ROOT / "public/question-bank/images" / name
                destination = root / name
                destination.write_bytes(original.read_bytes())
                prompt = sync.ET.parse(original).findtext("{http://www.w3.org/2000/svg}desc")
                sync.sync_reference_image(source, destination, prompt)
                self.assertEqual(destination.read_bytes(), original.read_bytes())
                with self.assertRaisesRegex(ValueError, "Question changed"):
                    sync.sync_reference_image(source, destination, "New question")
            destination = root / "new.svg"
            sync.sync_reference_image(source, destination, "New question")
            self.assertEqual(destination.read_bytes(), source.read_bytes())


if __name__ == "__main__":
    unittest.main()
