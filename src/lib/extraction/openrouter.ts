import {
  extractWithFallback,
  FREE_EXTRACTION_MODELS,
  OUTPUT_TOKEN_CAP,
  parseExtractionJson,
  READER_BUSY_MESSAGE,
  type ModelCompletion,
} from "./model-chain";
import type { EOBExtraction } from "./types";

const TEXT_EXTRACTION_PROMPT = `You are an expert US insurance EOB (Explanation of Benefits) data extraction AI.

Your task: Extract ALL structured data from the following raw text extracted from an EOB document with maximum accuracy.

Rules:
1. Output ONLY valid JSON matching the provided schema. No markdown, no explanation.
2. Extract EVERY line item — do not skip any procedure, including denied lines.
3. Copy the procedure code as printed. Dental lines use CDT codes such as D0120. Other lines may use CPT codes such as 93000 or 80053.
4. Adjustment codes follow ANSI X12 standards (CO-45, CO-50, CO-197, PR-1, PR-2, OA-23, etc.).
5. If a line is denied, set insurance_paid to 0 and keep the adjustment code and amount.
6. All dollar amounts as numbers with 2 decimal places.
7. Dates in YYYY-MM-DD format.
8. If a field is not visible or not applicable, use null.
9. Include a confidence_score (0.0 to 1.0) for the overall extraction quality.
10. If multiple patients appear on one EOB, return an array of extraction objects.

Required JSON schema:
{
  "payer_name": "string|null",
  "payer_id": "string|null",
  "patient_name": "string|null",
  "patient_dob": "YYYY-MM-DD|null",
  "patient_id": "string|null",
  "subscriber_name": "string|null",
  "subscriber_id": "string|null",
  "group_number": "string|null",
  "claim_number": "string|null",
  "date_of_service": "YYYY-MM-DD|null",
  "provider_name": "string|null",
  "provider_npi": "string|null",
  "check_number": "string|null",
  "check_date": "YYYY-MM-DD|null",
  "check_amount": "number|null",
  "line_items": [
    {
      "procedure_code": "string|null",
      "procedure_description": "string|null",
      "tooth_number": "string|null",
      "date_of_service": "YYYY-MM-DD|null",
      "billed_amount": "number|null",
      "allowed_amount": "number|null",
      "insurance_paid": "number|null",
      "patient_responsibility": "number|null",
      "deductible_applied": "number|null",
      "copay": "number|null",
      "coinsurance": "number|null",
      "adjustment_amount": "number|null",
      "adjustment_code": "string|null",
      "adjustment_description": "string|null",
      "remark_codes": ["string"],
      "remark_description": "string|null",
      "confidence_score": "number"
    }
  ],
  "total_billed": "number|null",
  "total_allowed": "number|null",
  "total_insurance_paid": "number|null",
  "total_patient_responsibility": "number|null",
  "total_adjustments": "number|null",
  "remarks": "string|null",
  "denial_flags": ["string"],
  "confidence_score": "number (0.0-1.0)"
}

[RAW EOB TEXT BEGINS BELOW]
`;

function readMessageContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return null;
  const content = (choices[0] as { message?: { content?: unknown } }).message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  const text = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("");
  return text.trim() ? text : null;
}

async function completeWithOpenRouter(model: string, pdfText: string): Promise<ModelCompletion> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: OUTPUT_TOKEN_CAP,
      messages: [
        {
          role: "user",
          content: `${TEXT_EXTRACTION_PROMPT}\n\n${pdfText}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) return { status: response.status, content: null };
  return { status: response.status, content: readMessageContent(await response.json()) };
}

export async function extractEOBFromText(pdfText: string): Promise<EOBExtraction> {
  const aiProvider = process.env.AI_PROVIDER || "openrouter";

  if (aiProvider === "ollama") {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2-vision";
    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [{ role: "user", content: `${TEXT_EXTRACTION_PROMPT}\n\n${pdfText}` }],
          stream: false,
          format: "json",
        }),
      });
      if (!response.ok) throw new Error(READER_BUSY_MESSAGE);
      const data: unknown = await response.json();
      const jsonText =
        data && typeof data === "object" && "message" in data
          ? (data as { message?: { content?: unknown } }).message?.content
          : null;
      if (typeof jsonText !== "string") throw new Error(READER_BUSY_MESSAGE);
      return parseExtractionJson(jsonText);
    } catch (error) {
      if (error instanceof Error && error.message === READER_BUSY_MESSAGE) throw error;
      throw new Error(READER_BUSY_MESSAGE);
    }
  }

  return extractWithFallback((model) => completeWithOpenRouter(model, pdfText), FREE_EXTRACTION_MODELS);
}
