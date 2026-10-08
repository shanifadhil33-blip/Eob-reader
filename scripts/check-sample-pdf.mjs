import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { pageHasText, textFromItems } from "../src/lib/pdf/text-layer.ts";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: node --experimental-strip-types scripts/check-sample-pdf.mjs <file.pdf>");
  process.exit(1);
}

const require = createRequire(path.join(process.cwd(), "package.json"));
GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/build/pdf.worker.min.mjs")
).href;

const data = new Uint8Array(readFileSync(pdfPath));
const pdf = await getDocument({ data, useSystemFonts: true }).promise;
const parts = [];
let textPages = 0;
for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  const pageText = textFromItems(content.items);
  if (pageHasText(pageText)) textPages += 1;
  parts.push(pageText);
}
const text = parts.join("\n");
const codes = [...text.matchAll(/D\d{4}/g)].map((match) => match[0]);
const result = {
  pageCount: pdf.numPages,
  textPages,
  accepted: textPages > 0,
  patient: text.includes("Tamsin Fernleaf"),
  payer: /birchwood dental mutual/i.test(text),
  codes,
};
console.log(JSON.stringify(result, null, 2));
if (!result.accepted || !result.patient || !result.payer) process.exit(1);
for (const code of ["D0120", "D1110", "D0274"]) {
  if (!codes.includes(code)) process.exit(1);
}
