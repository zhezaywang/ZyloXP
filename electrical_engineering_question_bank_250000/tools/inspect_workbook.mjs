import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const packageDir =
  "/Users/zhewang/Documents/ZyloXP/electrical_engineering_question_bank_250000";
const workDir =
  "/Users/zhewang/Desktop/ZyloXP/.codex-work/ee-refinement-20260723";
const workbookPath = `${packageDir}/electrical_engineering_question_bank_250000.xlsx`;

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 6,
  tableMaxCols: 10,
  tableMaxCellChars: 100,
});
console.log(overview.ndjson);

const sheetInfo = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 6000,
});
console.log(sheetInfo.ndjson);

await fs.mkdir(`${workDir}/existing-previews`, { recursive: true });
for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange(true);
  const address = used?.address ?? "A1:J20";
  console.log(`SHEET\t${sheet.name}\t${address}`);
  const preview = await workbook.render({
    sheetName: sheet.name,
    range: address,
    scale: 0.8,
    format: "png",
  });
  const safeName = sheet.name.replace(/[^A-Za-z0-9_-]+/g, "_");
  await fs.writeFile(
    `${workDir}/existing-previews/${safeName}.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
}
