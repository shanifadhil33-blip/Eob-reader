import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { pageHasText, textFromItems } from "./text-layer";

export interface PdfTextLayer {
  text: string;
  pageCount: number;
  textPages: number;
}

/**
 * Read the PDF text layer on the server. A file is text when any page has a
 * meaningful amount of extractable text. Worker failures throw; callers must
 * not describe those as scans.
 */
export async function readPdfTextLayer(data: Uint8Array): Promise<PdfTextLayer> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const workerPath = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const pdf = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const parts: string[] = [];
  let textPages = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = textFromItems(content.items);
    if (pageHasText(pageText)) textPages += 1;
    parts.push(pageText);
  }

  return {
    text: parts.join("\n"),
    pageCount: pdf.numPages,
    textPages,
  };
}
