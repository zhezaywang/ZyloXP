import csv
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "electrical_engineering_question_bank_250000/tools"))
from refine_question_bank import refine_stem, repair_fact_check_copy


class QuestionContentTests(unittest.TestCase):
    def test_repeated_qualifiers_are_repaired_and_do_not_accumulate(self):
        cases = [
            ("AE-04", "A feedback resistor of 40 kohm has a parasitic capacitance of 400 pF. "
             + "The capacitance is in parallel across the resistor. " * 5
             + "What is the pole frequency?", "The capacitance is in parallel across the resistor."),
            ("MI-03", "For an ideal 12-bit ADC with 5 V reference, "
             + "for an in-range input and rounding-to-nearest quantization, " * 3
             + "what is the maximum quantization error magnitude? "
             + "Use the ideal unipolar convention LSB = Vref/2^N.",
             "for an in-range input and rounding-to-nearest quantization,"),
        ]
        for template_id, prompt, qualifier in cases:
            corrected = refine_stem(template_id, prompt)
            self.assertEqual(corrected.count(qualifier), 1)
            for _ in range(5):
                self.assertEqual(refine_stem(template_id, corrected), corrected)

    def test_copy_repair_preserves_answers_and_is_idempotent(self):
        rows = [
            {"question_id": "EE-150001", "template_id": "SS-01",
             "question": "A signal is band-limited to 2 kHz. What is the theoretical Nyquist rate? Practical sampling must be higher.",
             "correct_answer": "4 kHz", "correct_option": "C", "image_id": "IMG-7501",
             "explanation": "Nyquist sampling requires fs >= 2*fmax = 4 kHz."},
            {"question_id": "EE-00001", "template_id": "DC-01",
             "question": "An 8 V source is applied across a 8 ohm resistor. What current flows?",
             "correct_answer": "1 A", "correct_option": "B", "image_id": "IMG-0001",
             "explanation": "Ohm's law gives 1 A."},
        ]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "questions.csv"
            with path.open("w", newline="") as file:
                writer = csv.DictWriter(file, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
            self.assertEqual(repair_fact_check_copy(path), {"explanations_corrected": 1})
            with path.open(newline="") as file:
                corrected = list(csv.DictReader(file))
            self.assertIn("sample above this boundary", corrected[0]["explanation"])
            self.assertNotIn("fs >=", corrected[0]["explanation"])
            for before, after in zip(rows, corrected):
                for field in before:
                    if field != "explanation":
                        self.assertEqual(after[field], before[field])
            self.assertEqual(corrected[1], rows[1])
            self.assertEqual(repair_fact_check_copy(path), {})


if __name__ == "__main__":
    unittest.main()
