import fs from "node:fs/promises";
import {
  SpreadsheetFile,
  Workbook,
} from "@oai/artifact-tool";

const reportBuildError = (error) => {
  console.error(`WORKBOOK_BUILD_ERROR: ${error?.name ?? "Error"}: ${error?.message ?? error}`);
  if (error?.stack) {
    console.error(error.stack.split("\n").slice(-8).join("\n"));
  }
  process.exit(1);
};
process.on("uncaughtException", reportBuildError);
process.on("unhandledRejection", reportBuildError);

const packageDir =
  "/Users/zhewang/Documents/ZyloXP/electrical_engineering_question_bank_250000";
const workDir =
  "/Users/zhewang/Desktop/ZyloXP/.codex-work/ee-refinement-20260723";
const outputDir = `${workDir}/output`;
const manifest = JSON.parse(
  await fs.readFile(`${workDir}/workbook_input_manifest.json`, "utf8"),
);
const factReport = JSON.parse(
  await fs.readFile(`${packageDir}/fact_check_report.json`, "utf8"),
);
const imageReport = JSON.parse(
  await fs.readFile(`${packageDir}/latex_image_validation.json`, "utf8"),
);

const topicLimit = Number.parseInt(
  process.env.ZYLOXP_TOPIC_LIMIT ?? `${manifest.topics.length}`,
  10,
);
const topicList = manifest.topics.slice(0, topicLimit);
const [firstTopic, ...remainingTopics] = topicList;
const workbook = await Workbook.fromCSV(
  await fs.readFile(firstTopic.csv_path, "utf8"),
  { sheetName: firstTopic.sheet_name },
);
for (const topic of remainingTopics) {
  const csvText = await fs.readFile(topic.csv_path, "utf8");
  await workbook.fromCSV(csvText, { sheetName: topic.sheet_name });
}
const summary = workbook.worksheets.add("Summary");

await workbook.fromCSV(
  await fs.readFile(`${packageDir}/image_database.csv`, "utf8"),
  { sheetName: "Image Assets" },
);
await workbook.fromCSV(
  await fs.readFile(`${packageDir}/formula_catalog.csv`, "utf8"),
  { sheetName: "Formula Catalog" },
);

const validation = workbook.worksheets.add("Validation");
const dictionary = workbook.worksheets.add("Field Dictionary");
const instructions = workbook.worksheets.add("Instructions");

const colors = {
  teal: "#174A5B",
  teal2: "#246B7A",
  pale: "#EAF4F4",
  paper: "#F8FAFB",
  ink: "#1F2933",
  muted: "#52616B",
  line: "#D9E2E7",
  orange: "#D97706",
  orangePale: "#FDECC8",
  green: "#166534",
  greenPale: "#DCFCE7",
  red: "#991B1B",
  redPale: "#FEE2E2",
};

function styleHeader(sheet, rangeAddress) {
  const range = sheet.getRange(rangeAddress);
  range.format = {
    fill: colors.teal,
    font: { bold: true, color: "#FFFFFF" },
    verticalAlignment: "center",
    wrapText: true,
    borders: {
      bottom: { style: "medium", color: colors.teal2 },
    },
  };
  range.format.rowHeight = 30;
}

function setColumnWidth(sheet, columnRange, _lastRow, width) {
  const [start, end = start] = columnRange.split(":");
  sheet.getRange(`${start}1:${end}1`).format.columnWidth = width;
}

function styleTopicSheet(sheet, lastRow) {
  sheet.showGridLines = true;
  sheet.freezePanes.freezeRows(1);
  sheet.freezePanes.freezeColumns(1);
  styleHeader(sheet, "A1:N1");
  setColumnWidth(sheet, "A", lastRow, 15);
  setColumnWidth(sheet, "B", lastRow, 9);
  setColumnWidth(sheet, "C", lastRow, 28);
  setColumnWidth(sheet, "D", lastRow, 11);
  setColumnWidth(sheet, "E", lastRow, 74);
  setColumnWidth(sheet, "F:K", lastRow, 22);
  setColumnWidth(sheet, "L", lastRow, 10);
  setColumnWidth(sheet, "M", lastRow, 19);
  setColumnWidth(sheet, "N", lastRow, 14);
  sheet.getRange(`B2:B${lastRow}`).conditionalFormats.add("colorScale", {
    criteria: [
      { type: "lowestValue", color: "#DCFCE7" },
      { type: "percentile", value: 50, color: "#FEF3C7" },
      { type: "highestValue", color: "#FECACA" },
    ],
  });
  sheet.getRange(`N2:N${lastRow}`).conditionalFormats.add("containsText", {
    text: "IMG-",
    format: {
      fill: colors.orangePale,
      font: { bold: true, color: "#92400E" },
    },
  });
}

for (const topic of topicList) {
  styleTopicSheet(
    workbook.worksheets.getItem(topic.sheet_name),
    topic.rows + 1,
  );
}

const imageSheet = workbook.worksheets.getItem("Image Assets");
imageSheet.freezePanes.freezeRows(1);
styleHeader(imageSheet, "A1:S1");
setColumnWidth(imageSheet, "A", 12501, 14);
setColumnWidth(imageSheet, "B", 12501, 15);
setColumnWidth(imageSheet, "C", 12501, 10);
setColumnWidth(imageSheet, "D:E", 12501, 28);
setColumnWidth(imageSheet, "F", 12501, 11);
setColumnWidth(imageSheet, "G:H", 12501, 15);
setColumnWidth(imageSheet, "I", 12501, 11);
setColumnWidth(imageSheet, "J", 12501, 42);
setColumnWidth(imageSheet, "K:L", 12501, 20);
setColumnWidth(imageSheet, "M", 12501, 28);
setColumnWidth(imageSheet, "N", 12501, 48);
setColumnWidth(imageSheet, "O", 12501, 28);
setColumnWidth(imageSheet, "P", 12501, 62);
setColumnWidth(imageSheet, "Q:S", 12501, 22);
imageSheet.getRange("S2:S12501").conditionalFormats.add("containsText", {
  text: "validated",
  format: { fill: colors.greenPale, font: { color: colors.green } },
});

const formulaSheet = workbook.worksheets.getItem("Formula Catalog");
formulaSheet.freezePanes.freezeRows(1);
styleHeader(formulaSheet, "A1:E1");
setColumnWidth(formulaSheet, "A", 101, 12);
setColumnWidth(formulaSheet, "B", 101, 46);
setColumnWidth(formulaSheet, "C", 101, 72);
setColumnWidth(formulaSheet, "D", 101, 16);
setColumnWidth(formulaSheet, "E", 101, 56);
formulaSheet.getRange("A2:E101").format = {
  verticalAlignment: "top",
  wrapText: true,
};

const validationRows = [
  ["Check", "Result", "Details", "Source"],
  ...factReport.checks.map((check) => [
    check.name,
    check.result,
    check.details,
    "fact_check_report.json",
  ]),
  ...imageReport.checks.map((check) => [
    check.name,
    check.result,
    check.details,
    "latex_image_validation.json",
  ]),
  [
    "Difficulty calibration disclosure",
    "NOTICE",
    factReport.known_content_risk.difficulty_progression,
    "fact_check_report.json",
  ],
];
validation.getRangeByIndexes(0, 0, validationRows.length, 4).values = validationRows;
validation.freezePanes.freezeRows(1);
styleHeader(validation, `A1:D1`);
setColumnWidth(validation, "A", validationRows.length, 38);
setColumnWidth(validation, "B", validationRows.length, 14);
setColumnWidth(validation, "C", validationRows.length, 100);
setColumnWidth(validation, "D", validationRows.length, 30);
validation.getRange(`A2:D${validationRows.length}`).format = {
  verticalAlignment: "top",
  wrapText: true,
};
validation
  .getRange(`B2:B${validationRows.length}`)
  .conditionalFormats.add("containsText", {
    text: "PASS",
    format: { fill: colors.greenPale, font: { bold: true, color: colors.green } },
  });
validation
  .getRange(`B2:B${validationRows.length}`)
  .conditionalFormats.add("containsText", {
    text: "FAIL",
    format: { fill: colors.redPale, font: { bold: true, color: colors.red } },
  });
validation
  .getRange(`B2:B${validationRows.length}`)
  .conditionalFormats.add("containsText", {
    text: "NOTICE",
    format: {
      fill: colors.orangePale,
      font: { bold: true, color: "#92400E" },
    },
  });

const fieldDescriptions = {
  question_id: "Stable unique question identifier.",
  difficulty_rank: "Organizational level from 1 to 25.",
  difficulty_label: "Legacy display label associated with the organizational level.",
  level_question_number: "Question node number within the topic and level.",
  tree_path: "Section > topic > level > node hierarchy.",
  subtopic: "Specific electrical-engineering concept tested.",
  template_id: "Reusable governing-formula template identifier.",
  question: "Question stem, including required assumptions.",
  option_a: "Answer choice A.",
  option_b: "Answer choice B.",
  option_c: "Answer choice C.",
  option_d: "Answer choice D.",
  option_e: "Answer choice E.",
  option_f: "Answer choice F.",
  correct_option: "Letter of the keyed correct choice.",
  correct_answer: "Text of the independently recomputed correct answer.",
  explanation: "Formula, assumptions, and solution rationale.",
  tags: "Comma-separated retrieval tags.",
  image_required: "Yes when the question has a linked instructional visual.",
  image_id: "Foreign key into Image Assets.",
  fact_check_status: "Independent deterministic recomputation status.",
  difficulty_calibration:
    "Disclosure distinguishing numeric variant level from validated cognitive difficulty.",
};
const dictionaryRows = [
  ["Field", "Description", "App Use"],
  ...manifest.question_fields.map((field) => [
    field,
    fieldDescriptions[field] ?? "",
    ["question_id", "template_id", "image_id"].includes(field)
      ? "Identifier / join key"
      : "Question content / metadata",
  ]),
];
dictionary.getRangeByIndexes(0, 0, dictionaryRows.length, 3).values =
  dictionaryRows;
styleHeader(dictionary, "A1:C1");
dictionary.freezePanes.freezeRows(1);
setColumnWidth(dictionary, "A", dictionaryRows.length, 30);
setColumnWidth(dictionary, "B", dictionaryRows.length, 82);
setColumnWidth(dictionary, "C", dictionaryRows.length, 30);
dictionary.getRange(`A2:C${dictionaryRows.length}`).format = {
  verticalAlignment: "top",
  wrapText: true,
};

const instructionRows = [
  ["ZyloXP Electrical Engineering Question Bank", ""],
  ["Purpose", "Review workbook for the complete 250,000-question app database, with six answer choices and optional instructional visuals."],
  ["Canonical data", "question_database.csv contains the complete row schema and is the recommended bulk-import source."],
  ["Workbook layout", "The 20 topic sheets contain 50,000 stratified review rows: 100 questions from every topic and level. Full questions and metadata remain in question_database.csv."],
  ["Answer verification", "Every row is independently recomputed from its stem givens using one of 100 cataloged formula rules."],
  ["Rounding", "Nearest displayed precision using decimal ROUND_HALF_UP."],
  ["Images", "Join image_id to Image Assets. SVGs live in images/ and editable LaTeX/TikZ sources in latex_sources/."],
  ["Image role", "Assets are instructional hints; relation diagrams intentionally provide the governing relation."],
  ["Difficulty", "Levels 1-25 are preserved for compatibility. Review difficulty_calibration before using high levels as ability claims."],
  ["App import", "Use question_id as the primary key, image_id as an optional foreign key, and correct_option as the keyed response."],
  ["Content version", "2.0, fact-checked 2026-07-23."],
];
instructions.getRangeByIndexes(0, 0, instructionRows.length, 2).values =
  instructionRows;
instructions.mergeCells("A1:B1");
instructions.getRange("A1:B1").format = {
  fill: colors.teal,
  font: { bold: true, color: "#FFFFFF", size: 18 },
  verticalAlignment: "center",
};
instructions.getRange("A1:B1").format.rowHeight = 38;
instructions.getRange("A2:A11").format = {
  fill: colors.pale,
  font: { bold: true, color: colors.teal },
  verticalAlignment: "top",
};
instructions.getRange("B2:B11").format = {
  wrapText: true,
  verticalAlignment: "top",
};
setColumnWidth(instructions, "A", instructionRows.length, 25);
setColumnWidth(instructions, "B", instructionRows.length, 105);
instructions.getRange("A2:B11").format.rowHeight = 36;
instructions.showGridLines = false;

summary.showGridLines = false;
summary.mergeCells("A1:H2");
summary.getRange("A1").values = [["ZyloXP Electrical Engineering Question Bank"]];
summary.getRange("A1:H2").format = {
  fill: colors.teal,
  font: { bold: true, color: "#FFFFFF", size: 20 },
  verticalAlignment: "center",
  horizontalAlignment: "left",
};
summary.mergeCells("A3:H3");
summary.getRange("A3").values = [[
  "50,000 review rows from 250,000 fact-checked questions | 20 topics | 25 levels | 100 templates",
]];
summary.getRange("A3:H3").format = {
  fill: colors.pale,
  font: { color: colors.teal, italic: true },
  verticalAlignment: "center",
};

summary.getRange("A5:B11").values = [
  ["Metric", "Value"],
  ["Source Rows", manifest.source_question_rows],
  ["Review Rows", null],
  ["Topics", null],
  ["Images", null],
  ["Templates", null],
  ["Failures", null],
];
summary.getRange("B7").formulas = [["=SUM(C14:C33)"]];
summary.getRange("B8").formulas = [["=COUNTA(B14:B33)"]];
summary.getRange("B9").formulas = [["=SUM(D14:D33)"]];
summary.getRange("B10").formulas = [["=COUNTA('Formula Catalog'!$A$2:$A$101)"]];
summary.getRange("B11").formulas = [[
  `=COUNTIF('Validation'!$B$2:$B$${validationRows.length},"FAIL")`,
]];
styleHeader(summary, "A5:B5");
summary.getRange("A6:A11").format = {
  fill: colors.paper,
  font: { bold: true, color: colors.ink },
};
summary.getRange("B6:B11").format = {
  fill: "#FFFFFF",
  font: { bold: true, color: colors.teal, size: 14 },
  horizontalAlignment: "right",
};
summary.getRange("A5:B11").format.borders = {
  preset: "outside",
  style: "thin",
  color: colors.line,
};

summary.getRange("A13:E13").values = [[
  "Section",
  "Topic",
  "Questions",
  "Images",
  "Worksheet",
]];
styleHeader(summary, "A13:E13");
const topicValues = topicList.map((topic) => [
  topic.section_order,
  topic.topic,
  null,
  imageReport.topics?.[topic.topic] ?? 0,
  topic.sheet_name,
]);
summary.getRangeByIndexes(13, 0, topicValues.length, 5).values = topicValues;
for (let index = 0; index < topicList.length; index += 1) {
  const row = 14 + index;
  const name = topicList[index].sheet_name;
  const lastRow = topicList[index].rows + 1;
  summary.getRange(`C${row}`).formulas = [[
    `=COUNTA('${name}'!$A$2:$A$${lastRow})`,
  ]];
}
summary.getRange("A14:A33").format.horizontalAlignment = "center";
summary.getRange("C14:D33").format.horizontalAlignment = "right";
summary.getRange("A14:E33").format.borders = {
  insideHorizontal: { style: "thin", color: colors.line },
};

summary.getRange("G13:H13").values = [["Level", "Questions"]];
styleHeader(summary, "G13:H13");
summary.getRange("G14:G38").values = Array.from({ length: 25 }, (_, index) => [
  index + 1,
]);
for (let level = 1; level <= 25; level += 1) {
  const row = 13 + level;
  const formula = topicList
    .map(
      (topic) =>
        `COUNTIF('${topic.sheet_name}'!$B$2:$B$${topic.rows + 1},G${row})`,
    )
    .join("+");
  summary.getRange(`H${row}`).formulas = [[`=${formula}`]];
}
summary.getRange("G14:H38").format.borders = {
  insideHorizontal: { style: "thin", color: colors.line },
};
summary.getRange("G14:H38").format.horizontalAlignment = "right";
setColumnWidth(summary, "A", 38, 11);
setColumnWidth(summary, "B", 38, 44);
setColumnWidth(summary, "C:D", 38, 14);
setColumnWidth(summary, "E", 38, 30);
setColumnWidth(summary, "F", 38, 3);
setColumnWidth(summary, "G:H", 38, 15);
summary.freezePanes.freezeRows(3);

await fs.mkdir(`${outputDir}/previews`, { recursive: true });
const previewRanges = new Map([
  ["Summary", "A1:H38"],
  ["Image Assets", "A1:S14"],
  ["Formula Catalog", "A1:E18"],
  ["Validation", `A1:D${validationRows.length}`],
  ["Field Dictionary", `A1:C${dictionaryRows.length}`],
  ["Instructions", "A1:B11"],
]);

for (const sheet of workbook.worksheets.items) {
  const range =
    previewRanges.get(sheet.name) ??
    "A1:N10";
  const preview = await workbook.render({
    sheetName: sheet.name,
    range,
    scale: sheet.name === "Summary" ? 1 : 0.75,
    format: "png",
  });
  const safeName = sheet.name.replace(/[^A-Za-z0-9_-]+/g, "_");
  await fs.writeFile(
    `${outputDir}/previews/${safeName}.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
}

console.log(
  (
    await workbook.inspect({
      kind: "table",
      range: "Summary!A1:H38",
      include: "values,formulas",
      tableMaxRows: 40,
      tableMaxCols: 8,
      maxChars: 12000,
    })
  ).ndjson,
);
console.log(
  (
    await workbook.inspect({
      kind: "table",
      range: "'01 DC Circuits'!A1:N6",
      include: "values,formulas",
      tableMaxRows: 6,
      tableMaxCols: 23,
      maxChars: 12000,
    })
  ).ndjson,
);
console.log(
  (
    await workbook.inspect({
      kind: "match",
      searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
      options: { useRegex: true, maxResults: 300 },
      summary: "final formula error scan",
      maxChars: 6000,
    })
  ).ndjson,
);

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
const outputPath = `${outputDir}/electrical_engineering_question_bank_250000.xlsx`;
await output.save(outputPath);
console.log(`EXPORTED\t${outputPath}`);
