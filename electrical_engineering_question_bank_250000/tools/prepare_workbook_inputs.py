#!/usr/bin/env python3
"""Split the verified bank into manageable topic CSVs for artifact-tool import."""

from __future__ import annotations

import csv
import json
from pathlib import Path


PACKAGE_DIR = Path(__file__).resolve().parents[1]
WORK_DIR = Path("/Users/zhewang/Desktop/ZyloXP/.codex-work/ee-refinement-20260723")
INPUT_DIR = WORK_DIR / "inputs"
SAMPLE_PER_LEVEL = 100

TOPIC_SHEETS = [
    ("DC Circuit Analysis", "01 DC Circuits"),
    ("AC Phasors and Impedance", "02 AC Phasors"),
    ("Network Theorems and Two-Port Networks", "03 Network Theorems"),
    ("Transient Circuit Analysis", "04 Transients"),
    ("Electromagnetics", "05 Electromagnetics"),
    ("Transmission Lines", "06 Transmission Lines"),
    ("Power Systems", "07 Power Systems"),
    ("Transformers and Electrical Machines", "08 Transformers Machines"),
    ("Power Electronics", "09 Power Electronics"),
    ("Analog Electronics and Op-Amps", "10 Analog Op-Amps"),
    ("Semiconductor Devices", "11 Semiconductors"),
    ("Digital Logic", "12 Digital Logic"),
    ("Signals and Systems", "13 Signals Systems"),
    ("Control Systems", "14 Control Systems"),
    ("Communications", "15 Communications"),
    ("Measurement and Instrumentation", "16 Measurement"),
    ("PCB Design and Signal Integrity", "17 PCB Signal Integrity"),
    ("Embedded Systems", "18 Embedded Systems"),
    ("RF and Antennas", "19 RF Antennas"),
    ("Electrical Safety and Protection", "20 Safety Protection"),
]

QUESTION_FIELDS = [
    "question_id",
    "difficulty_rank",
    "subtopic",
    "template_id",
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "option_e",
    "option_f",
    "correct_option",
    "correct_answer",
    "image_id",
]


def main() -> None:
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    topic_lookup = {topic: (index + 1, sheet) for index, (topic, sheet) in enumerate(TOPIC_SHEETS)}
    handles: dict[str, object] = {}
    writers: dict[str, csv.DictWriter] = {}
    counts = {topic: 0 for topic, _ in TOPIC_SHEETS}

    try:
        for topic, (index, sheet_name) in topic_lookup.items():
            path = INPUT_DIR / f"{index:02d}.csv"
            handle = path.open("w", newline="", encoding="utf-8")
            writer = csv.DictWriter(handle, fieldnames=QUESTION_FIELDS, extrasaction="ignore")
            writer.writeheader()
            handles[topic] = handle
            writers[topic] = writer

        with (PACKAGE_DIR / "question_database.csv").open(newline="", encoding="utf-8-sig") as source:
            for row in csv.DictReader(source):
                topic = row["topic"]
                if int(row["level_question_number"]) <= SAMPLE_PER_LEVEL:
                    writers[topic].writerow(row)
                    counts[topic] += 1
    finally:
        for handle in handles.values():
            handle.close()

    expected_topic_rows = 25 * SAMPLE_PER_LEVEL
    if set(counts.values()) != {expected_topic_rows}:
        raise RuntimeError(f"Unexpected topic counts: {counts}")

    manifest = {
        "question_fields": QUESTION_FIELDS,
        "source_question_rows": 250000,
        "sample_per_topic_level": SAMPLE_PER_LEVEL,
        "workbook_question_rows": sum(counts.values()),
        "topics": [
            {
                "section_order": index + 1,
                "topic": topic,
                "sheet_name": sheet_name,
                "csv_path": str(INPUT_DIR / f"{index + 1:02d}.csv"),
                "rows": counts[topic],
            }
            for index, (topic, sheet_name) in enumerate(TOPIC_SHEETS)
        ],
    }
    (WORK_DIR / "workbook_input_manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )
    print(f"Prepared {len(TOPIC_SHEETS)} topic CSVs in {INPUT_DIR}")


if __name__ == "__main__":
    main()
