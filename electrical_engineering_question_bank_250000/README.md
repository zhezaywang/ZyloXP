# ZyloXP Electrical Engineering Question Bank

App-ready question and image database containing 250,000 electrical engineering
multiple-choice questions.

## Package Contents

- `electrical_engineering_question_bank_250000.xlsx`: stratified review
  workbook with 50,000 question rows, a summary, 20 topic sheets, all image
  assets, formula catalog, validation results, field dictionary, and import
  instructions. The complete app database is the CSV below.
- `question_database.csv`: canonical full-schema source for bulk app ingestion.
- `image_database.csv` and `image_database.json`: image metadata joined to
  questions by `image_id`.
- `images/`: 12,500 app-facing SVG circuit, waveform, block, PCB, RF, safety,
  and concept diagrams.
- `latex_sources/`: 12,500 editable LaTeX/TikZ sources, one per image.
- `latex_image_manifest.csv`: SVG/LaTeX cross-reference and semantic render
  metadata.
- `latex_image_validation.json`: structural and coverage validation for the
  complete image set.
- `latex_image_contact_sheet.png` and `latex_image_contact_sheet.svg`: one
  visually reviewed sample from each of the 100 question templates.
- `formula_catalog.csv`: governing formula and explicit assumptions for all
  100 templates.
- `fact_check_report.json` and `fact_check_failures.csv`: deterministic
  recomputation results for all 250,000 answers.
- `content_refinement_report.json`: wording, option, answer-key, and image
  reassignment summary.
- `tools/`: repeatable refinement, verification, image, and workbook builders.

## Verified Structure

- 20 electrical engineering topics.
- 25 organizational levels per topic.
- 500 questions per topic and level.
- 12,500 questions per topic and 250,000 questions total.
- Six distinct, same-unit choices per question with uniform displayed precision.
- 100 formula templates, each used by 2,500 numeric variants.
- 12,500 linked images: 125 per template and 625 per topic.
- Decimal `ROUND_HALF_UP` answer generation, including an exact midpoint fixture.

## Import Notes

- Use `question_id` as the question primary key.
- Use `image_id` as an optional foreign key into the image asset table.
- Use `correct_option` as the keyed A-F response and `correct_answer` as the
  matching display value.
- Order the curriculum tree with `section_order`, `topic`, `difficulty_rank`,
  `level_question_number`, and `tree_path`.
- Display an image when `image_required` is `Yes`; resolve its relative SVG
  path through `image_database.csv` or `image_database.json`.
- Treat linked images as `instructional_hint` assets. Many relation diagrams
  intentionally expose the governing relation and should be shown only when
  that is appropriate for the app mode.
- Levels 1-25 are preserved for app compatibility. The current bank is made
  primarily from one-step numeric variants and is not psychometrically
  calibrated; read `difficulty_calibration` before making ability claims.
- The package machine did not include `pdflatex` or `lualatex`. SVGs are
  deterministic mirrors of the same geometry stored in the standalone
  LaTeX/TikZ source files.

## Suggested App Tables

- `topics(topic_id, topic, section_order)`
- `curriculum_levels(topic_id, difficulty_rank, difficulty_label, question_count)`
- `questions(question_id, topic, subtopic, difficulty_rank, question, explanation, image_id)`
- `answer_options(question_id, option_letter, option_text, is_correct)`
- `image_assets(image_id, question_id, relative_path, latex_source_path, asset_role)`
- `validation_runs(run_id, generated_at, questions_checked, failures, status)`

## Rebuild Order

Run the tools from this package directory:

```bash
python3 tools/refine_question_bank.py
python3 tools/verify_question_bank.py
python3 tools/generate_latex_diagrams.py
python3 tools/build_image_contact_sheet.py
python3 tools/prepare_workbook_inputs.py
```

The workbook builder uses the bundled `@oai/artifact-tool` runtime and reads
the prepared inputs from the `.codex-work` directory on the Desktop.
