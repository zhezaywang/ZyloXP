# ZyloXP Electrical Engineering Question Bank

Generated package for app ingestion.

## Contents

- electrical_engineering_question_bank_250000.xlsx: full workbook with 250,000 verified electrical engineering multiple-choice questions.
- question_database.csv: flat import-friendly question database with the same fields as the Question Bank sheet. This generated 111 MB export is excluded from Git because it exceeds GitHub's per-file size limit; the complete dataset remains available in the workbook.
- images/: app-facing SVG circuit, waveform, block, PCB, RF, safety, and concept diagrams generated from LaTeX/TikZ-authored templates.
- latex_sources/: editable LaTeX/TikZ source files, one per image_id.
- image_database.csv and image_database.json: image metadata that can be joined to questions by image_id.
- latex_image_manifest.csv: image_id to SVG and LaTeX source cross-reference.
- latex_image_validation.json: validation for the LaTeX/TikZ image generation pass.
- validation_summary.json: generator validation checks and counts.
- image_contact_sheet_250000.png: representative visual QA sheet sampled across all electrical engineering topics.
- latex_image_contact_sheet.png and latex_image_contact_sheet.svg: representative visual QA sheets for the LaTeX/TikZ-generated image set.
- tools/generate_latex_diagrams.py: repeatable generator for rebuilding the LaTeX source files and SVG outputs.

## Import Notes

- Use question_id as the primary key for questions.
- Use section_order, topic, difficulty_rank, level_question_number, and tree_path for curriculum-tree ordering.
- Use difficulty_rank for progression, where 1 is easy and 25 is super advanced.
- Each of the 20 topics has 25 levels with 500 questions per level.
- Each question has six similar answer choices: option_a through option_f.
- correct_option stores the A-F key; correct_answer stores the exact matching option text.
- If image_required is Yes, display the SVG at image_path and/or join image_id to the Image Assets sheet.
- For editable diagram source, join image_id to latex_image_manifest.csv and open latex_source_path.
- The Image Assets sheet mirrors image_database.csv/json.
- Keep the relative image paths rooted at this package directory.
- The current machine did not have pdflatex/lualatex installed, so the SVGs were rendered by the project generator from the same LaTeX/TikZ geometry. The .tex files are standalone/circuitikz-compatible for future TeX-based rendering.

## Suggested App Tables

- topics(topic_id, topic, section_order)
- curriculum_levels(topic_id, difficulty_rank, difficulty_label, question_count)
- questions(question_id, section_order, topic, subtopic, difficulty_rank, difficulty_label, level_question_number, tree_path, question, explanation, verification_method, tags, image_id)
- answer_options(question_id, option_letter, option_text, is_correct)
- image_assets(image_id, question_id, relative_path, alt_text, tags, use_notes)
- validation_runs(run_id, generated_at, rows, image_assets, status)
