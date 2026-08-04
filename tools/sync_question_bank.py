#!/usr/bin/env python3
"""Sync the validated question bank into the lightweight app bundle."""

from __future__ import annotations

import csv
import json
import re
import shutil
from collections import Counter, OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BANK_DIR = ROOT / "electrical_engineering_question_bank_250000"
QUESTION_CSV = BANK_DIR / "question_database.csv"
IMAGE_JSON = BANK_DIR / "image_database.json"
VALIDATION_JSON = BANK_DIR / "validation_summary.json"
FACT_CHECK_JSON = BANK_DIR / "fact_check_report.json"
REFINEMENT_JSON = BANK_DIR / "content_refinement_report.json"
OUTPUT_TS = ROOT / "src" / "questionBank.generated.ts"
PUBLIC_IMAGE_DIR = ROOT / "public" / "question-bank" / "images"


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def clean_prompt(row: dict[str, str]) -> str:
    prefix = (
        f"{row['question_id']} [Level {row['difficulty_rank']}, "
        f"Node {row['level_question_number']}]: "
    )
    question = row["question"].strip()
    return question.removeprefix(prefix)


def career_context(topic: str) -> str:
    if topic == "Embedded Systems":
        return "Embedded engineers use this when sizing firmware-facing hardware interfaces."
    if topic in {"Communications", "RF and Antennas"}:
        return "Communications and RF engineers use this when reasoning about signals and links."
    if topic == "Control Systems":
        return "Controls engineers use this when predicting system response and stability."
    if topic == "Measurement and Instrumentation":
        return "Test engineers use this when interpreting measurements and instrument limits."
    if topic == "PCB Design and Signal Integrity":
        return "PCB and signal integrity engineers use this when checking board-level behavior."
    if topic in {
        "Power Systems",
        "Power Electronics",
        "Transformers and Electrical Machines",
    }:
        return "Power engineers use this when evaluating energy conversion and system behavior."
    return "Engineers use this concept when turning theory into practical design checks."


def main() -> None:
    validation = load_json(VALIDATION_JSON)
    fact_check = load_json(FACT_CHECK_JSON)
    refinement = load_json(REFINEMENT_JSON)
    image_rows = load_json(IMAGE_JSON)
    image_by_id = {row["image_id"]: row for row in image_rows}
    image_counts = Counter(row["topic"] for row in image_rows)

    topic_stats: OrderedDict[str, dict[str, int | str]] = OrderedDict()
    sample_rows: OrderedDict[str, dict[str, str]] = OrderedDict()
    total_questions = 0

    with QUESTION_CSV.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            total_questions += 1
            topic = row["topic"]
            difficulty = int(row["difficulty_rank"])
            stats = topic_stats.setdefault(
                topic,
                {
                    "sectionOrder": int(row["section_order"]),
                    "questions": 0,
                    "minLevel": difficulty,
                    "maxLevel": difficulty,
                },
            )
            stats["questions"] = int(stats["questions"]) + 1
            stats["minLevel"] = min(int(stats["minLevel"]), difficulty)
            stats["maxLevel"] = max(int(stats["maxLevel"]), difficulty)
            sample_rows.setdefault(topic, row)

    expected_questions = int(validation["canonical_database"]["questions"])
    expected_topics = int(validation["canonical_database"]["topics"])
    if total_questions != expected_questions:
        raise ValueError(f"Expected {expected_questions} questions, found {total_questions}")
    if len(topic_stats) != expected_topics:
        raise ValueError(f"Expected {expected_topics} topics, found {len(topic_stats)}")
    if validation["status"] != "PASS" or fact_check["status"] != "PASS":
        raise ValueError("Question bank validation is not PASS")

    generated_topics = []
    generated_questions = []
    PUBLIC_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    for topic, stats in topic_stats.items():
        row = sample_rows[topic]
        option_letter = row["correct_option"].strip().upper()
        correct_index = ord(option_letter) - ord("A")
        options = [row[f"option_{letter}"] for letter in "abcdef"]

        if not 0 <= correct_index < len(options):
            raise ValueError(f"Invalid answer key for {row['question_id']}: {option_letter}")
        if options[correct_index] != row["correct_answer"]:
            raise ValueError(f"Answer mismatch for {row['question_id']}")
        if row["fact_check_status"] != "Verified by deterministic recomputation":
            raise ValueError(f"Unverified sample row: {row['question_id']}")

        image_id = row["image_id"]
        image_meta = image_by_id.get(image_id)
        if not image_meta:
            raise ValueError(f"Missing image metadata for {row['question_id']}")

        source_image = BANK_DIR / image_meta["relative_path"]
        destination_image = PUBLIC_IMAGE_DIR / source_image.name
        if not source_image.exists():
            raise FileNotFoundError(source_image)
        shutil.copy2(source_image, destination_image)

        generated_topics.append(
            {
                "id": slugify(topic),
                "topic": topic,
                "questions": stats["questions"],
                "imageCount": image_counts[topic],
                "minLevel": stats["minLevel"],
                "maxLevel": stats["maxLevel"],
            }
        )
        generated_questions.append(
            {
                "id": row["question_id"],
                "topic": topic,
                "subtopic": row["subtopic"],
                "prompt": clean_prompt(row),
                "diagram": f"/question-bank/images/{source_image.name}",
                "diagramAlt": image_meta["alt_text"],
                "difficulty": int(row["difficulty_rank"]),
                "difficultyLabel": row["difficulty_label"],
                "xp": 10 + int(row["difficulty_rank"]) * 2,
                "options": options,
                "correctIndex": correct_index,
                "explanation": row["explanation"],
                "careerContext": career_context(topic),
                "imageId": image_id,
                "imageRole": image_meta["asset_role"],
                "treePath": row["tree_path"],
                "verificationStatus": "Verified",
                "verificationMethod": row["fact_check_status"],
                "factCheckedAt": row["fact_checked_at"],
                "contentVersion": row["content_version"],
                "difficultyCalibration": row["difficulty_calibration"],
                "roundingPolicy": row["rounding_policy"],
            }
        )

    canonical = validation["canonical_database"]
    image_validation = validation["image_validation"]
    generated_summary = {
        "totalQuestions": total_questions,
        "expectedQuestions": expected_questions,
        "topicCount": len(topic_stats),
        "levels": int(canonical["difficulty_levels"]),
        "questionsPerTopic": int(canonical["questions_per_topic"]),
        "questionsPerLevel": int(canonical["questions_per_topic_level"]),
        "templates": int(canonical["templates"]),
        "svgDiagrams": int(image_validation["svg_files"]),
        "latexSources": int(image_validation["latex_tikz_sources"]),
        "imageBackedQuestions": int(image_validation["image_records"]),
        "factCheckedQuestions": int(fact_check["questions_checked"]),
        "refinedQuestions": int(refinement["changes"]["questions_reworded"]),
        "reshuffledAnswerKeys": int(refinement["changes"]["answer_keys_reshuffled"]),
        "contentVersion": refinement["content_version"],
        "validationStatus": validation["status"],
        "updatedAt": fact_check["generated_at"],
    }
    generated_signals = [
        {
            "label": "Question rows",
            "value": f"{total_questions:,}",
            "detail": f"{len(topic_stats)} topics x {canonical['difficulty_levels']} levels",
        },
        {
            "label": "Fact checks",
            "value": f"{fact_check['questions_checked']:,}",
            "detail": "Deterministic recomputation with zero failures",
        },
        {
            "label": "SVG diagrams",
            "value": f"{image_validation['svg_files']:,}",
            "detail": "Version 2.0 instructional-hint assets",
        },
        {
            "label": "Content version",
            "value": f"v{refinement['content_version']}",
            "detail": f"{refinement['changes']['answer_keys_reshuffled']:,} answer keys reshuffled",
        },
    ]

    header = (
        "// Generated from electrical_engineering_question_bank_250000/question_database.csv.\n"
        "// Do not edit by hand; run `pnpm sync:bank` when the source database changes.\n\n"
    )

    def export(name: str, value) -> str:
        payload = json.dumps(value, ensure_ascii=True, indent=2)
        return f"export const {name} = {payload} as const;\n\n"

    output = (
        header
        + export("generatedBankSummary", generated_summary)
        + export("generatedBankSignals", generated_signals)
        + export("generatedTopicSignals", generated_topics)
        + export("generatedLessonQuestions", generated_questions)
    )
    OUTPUT_TS.write_text(output, encoding="utf-8")

    print(
        f"Synced {total_questions:,} questions, {len(generated_questions)} app samples, "
        f"and {len(generated_questions)} representative diagrams (content v{refinement['content_version']})."
    )


if __name__ == "__main__":
    main()
