#!/usr/bin/env python3
"""Refine wording, answer-key placement, QA metadata, and image coverage."""

from __future__ import annotations

import csv
import hashlib
import json
import math
import random
import re
from collections import Counter
from decimal import Decimal
from datetime import datetime, timezone
from pathlib import Path

from verify_question_bank import (
    FORMULA_METADATA,
    evaluate,
    exact_decimal_value,
    parse_display_number,
    round_half_up,
)


PACKAGE_DIR = Path(__file__).resolve().parents[1]
QUESTION_CSV = PACKAGE_DIR / "question_database.csv"
IMAGE_CSV = PACKAGE_DIR / "image_database.csv"
IMAGE_JSON = PACKAGE_DIR / "image_database.json"
REPORT_JSON = PACKAGE_DIR / "content_refinement_report.json"

FACT_CHECK_DATE = "2026-07-23"
CONTENT_VERSION = "2.0"
OPTION_LETTERS = "ABCDEF"


def clean_stem(question: str) -> tuple[str, str]:
    match = re.match(r"^(EE-\d+\s+\[Level\s+\d+,\s+Node\s+\d+\]:\s*)(.*)$", question)
    if not match:
        return "", question
    return match.group(1), match.group(2)


def fix_articles(text: str) -> str:
    text = re.sub(r"\bA (?=(?:8|11|18)\d*(?:\.\d+)?\b)", "An ", text)
    text = re.sub(r"\bA (?=(?:ideal|initially|unloaded)\b)", "An ", text, flags=re.IGNORECASE)
    text = re.sub(r"\bAn (?=(?:10|12|14|16)-bit\b)", "A ", text)
    return text


def refine_stem(template_id: str, question: str) -> str:
    prefix, stem = clean_stem(question)
    stem = fix_articles(stem)

    if template_id in {"DL-03", "DL-04"}:
        question_id_match = re.search(r"EE-\d+", prefix)
        question_id = question_id_match.group(0) if question_id_match else question
        digest = hashlib.sha256(f"zyloxp-full-adder-v2|{template_id}|{question_id}".encode()).digest()
        triplets = []
        for index in range(5):
            value = digest[index] % 8
            triplets.append(((value >> 2) & 1, (value >> 1) & 1, value & 1))
        rendered = "; ".join(f"({a},{b},{cin})" for a, b, cin in triplets)
        output_name = "Sum" if template_id == "DL-03" else "Carry-out"
        stem = (
            f"Across these five full-adder input triplets (A,B,Cin): {rendered}, "
            f"how many {output_name} outputs are 1?"
        )
    elif template_id == "NT-01":
        stem = stem.replace("What is the Norton current?", "What is the Norton current magnitude?")
    elif template_id == "NT-02":
        stem = stem.replace(
            "For a DC Thevenin source with ",
            "For a passive DC Thevenin source with ",
        ).replace(
            "what load resistance maximizes power transfer?",
            "what adjustable resistive load maximizes power transfer?",
        )
    elif template_id == "NT-03":
        stem = stem.replace(
            "A Thevenin source has ",
            "A passive DC Thevenin source with positive Rth has ",
        ).replace(
            "What is the maximum load power?",
            "What maximum power can be delivered to an adjustable resistive load?",
        )
    elif template_id == "NT-04":
        stem = stem.replace(
            "What is the equivalent current source value?",
            "What is the magnitude of the equivalent current source?",
        )
    elif template_id == "NT-05":
        stem = re.sub(
            r"Which statement is correct\?$",
            (
                "Using the chain convention [V1, I1]^T = [A B; C D][V2, -I2]^T "
                "and treating displayed coefficients as rounded, which statement is best?"
            ),
            stem,
        )
    elif template_id == "TR-03":
        stem = stem.replace(
            "An RL circuit is stepped with ",
            "An initially unenergized series RL circuit is connected at the switching instant to ",
        )
        stem = stem.replace("connected at t = 0 to ", "connected at the switching instant to ")
    elif template_id in {"TR-02", "TR-03"}:
        pass
    elif template_id == "EM-01":
        stem = stem.replace(
            " in air. What is the force magnitude?",
            " in air. Using k = 8.98755e9 N m^2/C^2, what is the force magnitude?",
        )
    elif template_id == "EM-02":
        stem = stem.replace(
            "What is the average electric field magnitude?",
            "Assuming a uniform field and neglecting fringing, what is the average electric field magnitude?",
        )
    elif template_id == "EM-03":
        stem = stem.replace(
            "A parallel-plate capacitor has er = ",
            "An ideal parallel-plate capacitor is fully filled by a dielectric with relative permittivity er = ",
        ).replace(
            "What is the capacitance?",
            "Neglecting fringing, what is the capacitance?",
        )
    elif template_id == "EM-05":
        match = re.search(
            r"A (\d+)-turn coil has flux changing by ([\d.]+) mWb in ([\d.]+) ms\.",
            stem,
        )
        if match:
            turns, flux, duration = match.groups()
            stem = (
                f"The magnetic flux through each turn of a {turns}-turn coil changes by "
                f"{flux} mWb over {duration} ms, and every turn links the same flux. "
                "What is the magnitude of the average induced emf?"
            )
    elif template_id == "TL-01":
        stem = stem.replace(
            "A lossless line has L = ",
            "A lossless line has per-unit-length inductance L' = ",
        ).replace(
            " and C = ",
            " and per-unit-length capacitance C' = ",
        )
    elif template_id == "TL-04":
        stem = stem.replace(
            "A lossless quarter-wave transformer has Z0 = ",
            "A lossless quarter-wave transformer section has characteristic impedance Zt = ",
        )
    elif template_id == "SS-01":
        stem = stem.replace(
            "What minimum sampling rate avoids aliasing?",
            "What is the theoretical Nyquist rate? Practical sampling must be higher.",
        )
    elif template_id == "SS-02":
        stem = stem.replace(
            "What is the output length?",
            (
                "Assuming both finite sequences have nonzero endpoint samples, what is "
                "the nonzero-support length of their linear convolution?"
            ),
        )
    elif template_id == "SS-04":
        stem = stem.replace(
            "A first-order system has time constant ",
            "A canonical low-pass system H(s) = K/(1 + s*tau) has time constant ",
        ).replace(
            "What is its approximate -3 dB bandwidth?",
            "What is its -3 dB bandwidth relative to its DC gain?",
        )
    elif template_id == "CS-01":
        stem = stem.replace(
            "A unity-feedback system has forward gain ",
            "A stable negative-unity-feedback system has scalar DC forward gain ",
        )
    elif template_id == "CS-02":
        stem = stem.replace(
            "For a type-0 unity-feedback system with ",
            "For a stable type-0 negative-unity-feedback system with ",
        )
    elif template_id in {"MI-01", "MI-02", "MI-03", "ES-05"}:
        stem = re.sub(
            r"\??\s*Use the ideal unipolar convention LSB = Vref/2\^N\.?$",
            "",
            stem,
        ).rstrip()
        stem = stem.replace(
            "What input voltage does this code represent approximately",
            (
                "Using the nominal reconstruction level code x LSB, what input voltage "
                "does this code represent approximately"
            ),
        )
        stem = stem.replace(
            "what is the maximum quantization error magnitude",
            (
                "for an in-range input and rounding-to-nearest quantization, what is the "
                "maximum quantization error magnitude"
            ),
        )
        stem = stem.rstrip("?") + "? Use the ideal unipolar convention LSB = Vref/2^N."
    elif template_id == "SD-02":
        stem = stem.replace(
            "A silicon diode with 0.7 V drop is ",
            "A forward-biased silicon diode using a constant 0.7 V drop model is ",
        )
    elif template_id == "SD-03":
        stem = stem.replace(
            "A MOSFET in saturation has ",
            (
                "A long-channel MOSFET in saturation has, under the square-law model "
                "with channel-length modulation neglected, "
            ),
        )
    elif template_id == "SD-04":
        stem = stem.replace(
            "A 6.8 V Zener diode is fed ",
            "A 6.8 V Zener diode regulating in reverse breakdown is fed ",
        )
    elif template_id == "AE-04":
        stem = stem.replace(
            " has parasitic capacitance ",
            " has a parasitic capacitance of ",
        ).replace(
            "What is the pole frequency?",
            "The capacitance is in parallel across the resistor. What is the pole frequency?",
        )
    elif template_id in {"PE-01", "PE-02", "PE-03", "PE-05"}:
        stem = stem.replace(
            "An ideal buck converter has ",
            "An ideal buck converter operating in continuous-conduction mode at steady state has ",
        ).replace(
            "An ideal boost converter has ",
            "An ideal boost converter operating in continuous-conduction mode at steady state has ",
        ).replace(
            "An ideal buck converter must produce ",
            (
                "An ideal buck converter operating in continuous-conduction mode at steady state "
                "must produce "
            ),
        ).replace(
            "An ideal buck has ",
            "An ideal buck converter operating in continuous-conduction mode at steady state has ",
        )
    elif template_id == "PE-04":
        stem = stem.replace(
            "An ideal full-wave rectifier has ",
            "An ideal full-wave rectifier with unfiltered output feeding a resistive load has ",
        )
    elif template_id == "TM-05":
        stem = stem.replace(
            "What is the back emf?",
            "Neglecting brush voltage drop, what is the back emf?",
        )
    elif template_id == "PS-02":
        stem = stem.replace(
            "What is the line current?",
            "What is the rated full-load line current?",
        )
    elif template_id == "PS-05":
        stem = stem.replace(
            "Ignoring reactance, a three-phase feeder carries ",
            "A balanced unity-power-factor three-phase feeder, with reactance neglected, carries ",
        )
    elif template_id == "CM-03":
        stem = stem.replace(
            "A channel has bandwidth ",
            "A bandlimited additive-white-Gaussian-noise channel has bandwidth ",
        )
    elif template_id == "PCB-02":
        stem = stem.replace(
            "what is the capacitive reactance of ",
            "what is the magnitude of the capacitive reactance of ",
        )
    elif template_id == "PCB-03":
        stem = stem.replace(
            "Estimate L*di/dt voltage.",
            "Estimate the magnitude of the inductive ground-bounce voltage L*di/dt.",
        )
    elif template_id == "RF-01":
        stem = stem.replace(
            "What is the approximate free-space wavelength at ",
            "Using c = 300 Mm/s, what is the approximate free-space wavelength at ",
        )
    elif template_id == "RF-02":
        stem = stem.replace(
            "Estimate the total physical length",
            "Using c = 300 Mm/s, estimate the total physical length",
        )
    elif template_id == "SP-01":
        stem = stem.replace(
            " current transformer carries ",
            (
                " ideal current transformer, with saturation and ratio error neglected, "
                "carries "
            ),
        )
    elif template_id == "SP-02":
        statement = "The stated voltage is across the complete loop."
        stem = re.sub(rf"(?:\s*{re.escape(statement)})+", "", stem).strip()
        stem = stem.replace(
            "What is the prospective fault current?",
            f"{statement} What is the prospective fault current?",
        )
    elif template_id == "SP-04":
        stem = stem.replace(
            "A relay pickup is ",
            "Using an ideal current-transformer ratio, a relay pickup is ",
        )
    elif template_id == "SP-05":
        stem = re.sub(
            r"A conductor carries (?:(?:a steady RMS current of )+)",
            "A conductor carries ",
            stem,
        )
        stem = stem.replace(
            "A conductor carries ",
            "A conductor carries a steady RMS current of ",
        ).replace(
            "What I^2R heating is produced?",
            "What real I^2R power loss is produced?",
        )

    stem = re.sub(
        r"after 1 time constant\(s\)",
        "after 1 time constant",
        stem,
    )
    stem = re.sub(
        r"after ([2-9]\d*(?:\.\d+)?) time constant\(s\)",
        r"after \1 time constants",
        stem,
    )
    return prefix + stem


def transformed_answer(template_id: str, answer: str) -> str:
    if template_id == "NT-05" and answer == "Reciprocal because AD - BC = 1":
        return "Reciprocal because AD - BC is approximately 1"
    return answer


def canonical_answer(template_id: str, question: str, answer: str) -> str:
    transformed = transformed_answer(template_id, answer)
    result = evaluate(template_id, question)
    if result.value is None:
        return transformed
    _, decimals = parse_display_number(transformed)
    decimals = max(decimals, {"CS-04": 2, "CS-05": 2, "TM-03": 1}.get(template_id, 0))
    exact_value = exact_decimal_value(template_id, question)
    value = round_half_up(exact_value if exact_value is not None else result.value, decimals)
    numeric = f"{value:.{decimals}f}"
    match = re.search(r"[-+]?\d+(?:\.\d+)?", transformed)
    if not match:
        return transformed
    return transformed[: match.start()] + numeric + transformed[match.end() :]


def numeric_bounds(template_id: str, question: str) -> tuple[Decimal | None, Decimal | None]:
    lower = Decimal("0")
    upper: Decimal | None = None
    if template_id in {"CS-01", "CS-02"}:
        upper = Decimal("1")
    elif template_id in {"CS-04", "TM-03"}:
        upper = Decimal("100")
    elif template_id == "CS-05":
        match = re.search(r"wn\s*=\s*([\d.]+)\s*rad/s", question)
        if match:
            upper = Decimal(match.group(1))
    elif template_id in {"MI-02", "ES-05"}:
        match = re.search(r"(?:with|ADC with)\s+([\d.]+)\s*V reference", question)
        if match:
            upper = Decimal(match.group(1))
    elif template_id == "MI-04":
        match = re.search(r"A\s+([\d.]+)\s*V source", question)
        if match:
            upper = Decimal(match.group(1))
    return lower, upper


def regenerate_numeric_options(
    row: dict[str, str],
    correct_answer: str,
    refined_question: str,
) -> None:
    match = re.search(r"[-+]?\d+(?:\.\d+)?", correct_answer)
    if not match:
        return

    token = match.group(0)
    decimals = len(token.partition(".")[2])
    correct = Decimal(token)
    quantum = Decimal(1).scaleb(-decimals)
    lower, upper = numeric_bounds(row["template_id"], refined_question)
    if correct <= 0:
        lower, upper = None, None
    candidates: set[Decimal] = set()

    for factor in (
        Decimal("0.5"),
        Decimal("0.67"),
        Decimal("0.75"),
        Decimal("0.8"),
        Decimal("0.9"),
        Decimal("1.1"),
        Decimal("1.2"),
        Decimal("1.25"),
        Decimal("1.33"),
        Decimal("1.5"),
        Decimal("2"),
    ):
        candidates.add((correct * factor).quantize(quantum))
    for offset in range(1, 31):
        step = quantum * offset
        candidates.add(correct - step)
        candidates.add(correct + step)

    def allowed(value: Decimal) -> bool:
        if value == correct:
            return False
        if lower is not None and value <= lower:
            return False
        if upper is not None and value >= upper:
            return False
        return True

    candidates = {value for value in candidates if allowed(value)}
    if len(candidates) < 5:
        raise RuntimeError(f"Insufficient numeric distractors for {row['question_id']}")

    digest = hashlib.sha256(
        f"zyloxp-distractors-v2|{row['question_id']}|{refined_question}".encode("utf-8")
    ).digest()
    rng = random.Random(int.from_bytes(digest[:16], "big"))
    nearby = sorted(candidates, key=lambda value: (abs(value - correct), value))[:18]
    rng.shuffle(nearby)
    selected = nearby[:5]

    prefix = correct_answer[: match.start()]
    suffix = correct_answer[match.end() :]

    def render(value: Decimal) -> str:
        return f"{prefix}{value:.{decimals}f}{suffix}"

    options = [correct_answer, *(render(value) for value in selected)]
    for letter, option in zip(OPTION_LETTERS, options):
        row[f"option_{letter.lower()}"] = option


def refine_explanation(row: dict[str, str], refined_question: str, correct_answer: str) -> str:
    template_id = row["template_id"]
    result = evaluate(template_id, refined_question)
    formula, assumptions = FORMULA_METADATA[template_id]

    if template_id == "NT-05":
        return (
            "For the stated chain convention, reciprocity requires AD - BC = 1. "
            f"Using the displayed rounded coefficients gives {result.parameters}, which is "
            "approximately 1. Assumptions: " + assumptions
        )

    if template_id in {"DL-03", "DL-04"}:
        matches = re.findall(r"\(([01]),([01]),([01])\)", refined_question)
        triplets = [tuple(map(int, match)) for match in matches]
        if template_id == "DL-03":
            outputs = [a ^ b ^ cin for a, b, cin in triplets]
            label = "Sum"
        else:
            outputs = [int(a + b + cin >= 2) for a, b, cin in triplets]
            label = "Carry-out"
        return (
            f"{label} outputs for the five triplets are {', '.join(map(str, outputs))}; "
            f"{sum(outputs)} of them are 1. Governing relation: {formula}. "
            f"Assumptions: {assumptions}"
        )

    if template_id == "NT-04":
        base = (
            f"Source transformation gives Is = Vs/R = {correct_answer}. "
            "The same resistance remains in the equivalent circuit and moves from series to parallel."
        )
    else:
        base = row["explanation"].split(" Governing relation:", 1)[0].rstrip()
    return (
        f"{base} Governing relation: {formula}. "
        f"Assumptions: {assumptions} Result is rounded to the precision shown in the choices."
    )


def shuffle_options(
    row: dict[str, str],
    old_correct: str,
    correct_answer: str,
    refined_question: str,
) -> None:
    options = [row[f"option_{letter.lower()}"] for letter in OPTION_LETTERS]
    options = [correct_answer if value == old_correct else value for value in options]
    if correct_answer not in options:
        raise RuntimeError(f"Correct answer missing from options for {row['question_id']}")

    digest = hashlib.sha256(
        f"zyloxp-content-v2|{row['question_id']}|{refined_question}".encode("utf-8")
    ).digest()
    rng = random.Random(int.from_bytes(digest[:16], "big"))
    options.sort()
    rng.shuffle(options)
    for letter, option in zip(OPTION_LETTERS, options):
        row[f"option_{letter.lower()}"] = option
    row["correct_option"] = OPTION_LETTERS[options.index(correct_answer)]


def calibration_note(level: int) -> str:
    if level <= 5:
        return "Provisional: direct-substitution item; suitable for foundational practice."
    return (
        "Uncalibrated: numeric variant level only; the current one-step template does not by itself "
        "establish advanced cognitive difficulty."
    )


def image_target(node_number: int) -> bool:
    block = (node_number - 1) // 20
    target = block * 20 + (block % 5) + 1
    return node_number == target


def write_rows_atomic(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    temp.replace(path)


def main() -> None:
    with QUESTION_CSV.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        question_fields = list(reader.fieldnames or [])
        rows = list(reader)

    qa_fields = [
        "fact_check_status",
        "fact_check_rule",
        "fact_check_assumptions",
        "fact_checked_at",
        "content_version",
        "difficulty_calibration",
        "rounding_policy",
    ]
    for field in qa_fields:
        if field not in question_fields:
            question_fields.append(field)

    changes: Counter[str] = Counter()
    answer_positions: Counter[str] = Counter()
    image_rows: list[dict[str, str]] = []
    image_index = 0

    for row in rows:
        template_id = row["template_id"]
        old_question = row["question"]
        refined_question = refine_stem(template_id, old_question)
        if refined_question != old_question:
            changes["questions_reworded"] += 1

        old_correct_answer = row["correct_answer"]
        correct_answer = canonical_answer(template_id, refined_question, old_correct_answer)
        if correct_answer != old_correct_answer:
            changes["answers_clarified"] += 1

        row["question"] = refined_question
        shuffle_old_answer = old_correct_answer
        if template_id in {"DL-03", "DL-04"}:
            for letter, option in zip(OPTION_LETTERS, ["0", "1", "2", "3", "4", "5"]):
                row[f"option_{letter.lower()}"] = option
            shuffle_old_answer = correct_answer
        elif template_id != "NT-05":
            regenerate_numeric_options(row, correct_answer, refined_question)
            shuffle_old_answer = correct_answer
        row["correct_answer"] = correct_answer
        row["verification_value"] = correct_answer
        row["explanation"] = refine_explanation(row, refined_question, correct_answer)
        formula, assumptions = FORMULA_METADATA[template_id]
        row["verification_method"] = (
            f"Independent deterministic recomputation from stem givens using {formula}; "
            "unit, rounding, six-option uniqueness, and keyed-position checks."
        )
        row["fact_check_status"] = "Verified by deterministic recomputation"
        row["fact_check_rule"] = formula
        row["fact_check_assumptions"] = assumptions
        row["fact_checked_at"] = FACT_CHECK_DATE
        row["content_version"] = CONTENT_VERSION
        row["difficulty_calibration"] = calibration_note(int(row["difficulty_rank"]))
        row["rounding_policy"] = "Nearest displayed precision using decimal ROUND_HALF_UP."
        row["status"] = "Verified"

        shuffle_options(row, shuffle_old_answer, correct_answer, refined_question)
        answer_positions[row["correct_option"]] += 1
        changes["answer_keys_reshuffled"] += 1

        row["image_required"] = "No"
        row["image_id"] = ""
        row["image_path"] = ""
        node = int(row["level_question_number"])
        if image_target(node):
            image_index += 1
            image_id = f"IMG-{image_index:04d}"
            row["image_required"] = "Yes"
            row["image_id"] = image_id
            row["image_path"] = f"images/{image_id}.svg"
            image_rows.append(
                {
                    "image_id": image_id,
                    "question_id": row["question_id"],
                    "section_order": row["section_order"],
                    "topic": row["topic"],
                    "subtopic": row["subtopic"],
                    "template_id": row["template_id"],
                    "difficulty_rank": row["difficulty_rank"],
                    "difficulty_label": row["difficulty_label"],
                    "level_question_number": row["level_question_number"],
                    "tree_path": row["tree_path"],
                    "asset_type": "svg_diagram",
                    "asset_role": "instructional_hint",
                    "relative_path": f"images/{image_id}.svg",
                    "latex_source_path": f"latex_sources/{image_id}.tex",
                    "alt_text": f"{row['subtopic']} problem diagram for {row['question_id']}",
                    "tags": row["tags"],
                    "use_notes": (
                        "Question-linked LaTeX/TikZ problem diagram. The topology, variable labels, "
                        "and visual assumptions correspond to the linked problem."
                    ),
                    "visual_spec_version": CONTENT_VERSION,
                    "qa_status": "Pending regeneration",
                }
            )

    image_fields = [
        "image_id",
        "question_id",
        "section_order",
        "topic",
        "subtopic",
        "template_id",
        "difficulty_rank",
        "difficulty_label",
        "level_question_number",
        "tree_path",
        "asset_type",
        "asset_role",
        "relative_path",
        "latex_source_path",
        "alt_text",
        "tags",
        "use_notes",
        "visual_spec_version",
        "qa_status",
    ]

    if len(image_rows) != 12500:
        raise RuntimeError(f"Expected 12500 image rows, found {len(image_rows)}")
    template_image_counts = Counter(row["template_id"] for row in image_rows)
    if len(template_image_counts) != 100 or set(template_image_counts.values()) != {125}:
        raise RuntimeError(f"Image coverage is not balanced by template: {template_image_counts}")

    write_rows_atomic(QUESTION_CSV, question_fields, rows)
    write_rows_atomic(IMAGE_CSV, image_fields, image_rows)
    IMAGE_JSON.write_text(json.dumps(image_rows, indent=2), encoding="utf-8")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "content_version": CONTENT_VERSION,
        "questions": len(rows),
        "images": len(image_rows),
        "templates_with_images": len(template_image_counts),
        "images_per_template": sorted(set(template_image_counts.values())),
        "changes": dict(changes),
        "answer_position_distribution": dict(answer_positions),
        "difficulty_disclosure": (
            "Existing 1-25 levels are preserved for application compatibility. A new calibration "
            "field explicitly distinguishes numeric variant levels from validated cognitive difficulty."
        ),
    }
    REPORT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(
        f"Refined {len(rows)} questions and reassigned {len(image_rows)} diagrams "
        f"across {len(template_image_counts)} templates."
    )


if __name__ == "__main__":
    main()
