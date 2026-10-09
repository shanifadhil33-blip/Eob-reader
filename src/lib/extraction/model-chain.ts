import type { EOBExtraction, EOBLineItem } from "./types";

/** One- or two-page EOBs fit well under this. OpenRouter bills the requested cap. */
export const OUTPUT_TOKEN_CAP = 4000;

export const READER_BUSY_MESSAGE =
  "The reader is busy right now. Please try again in a minute.";

/** Reclaim's text path waits 60 seconds before it tries the next model. */
export const OPENROUTER_TIMEOUT_MS = 60_000;

export const TEXT_EXTRACTION_PROMPT = `You are an expert US insurance EOB (Explanation of Benefits) data extraction AI.

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

The user message is the raw EOB text. Extract every line, including paid and denied lines. Return one JSON object.
`;

export function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function buildExtractionRequest(model: string, pdfText: string) {
  const request: {
    model: string;
    temperature: number;
    max_tokens: number;
    messages: Array<{ role: "system" | "user"; content: string }>;
    response_format?: { type: "json_object" };
  } = {
    model,
    temperature: 0.1,
    max_tokens: OUTPUT_TOKEN_CAP,
    messages: [
      { role: "system", content: TEXT_EXTRACTION_PROMPT },
      {
        role: "user",
        content: `Here is the text of an EOB. Extract every line, including paid and denied lines. Return one JSON object.\n\n${pdfText}`,
      },
    ],
  };
  if (JSON_MODE_MODELS.has(model)) {
    request.response_format = { type: "json_object" };
  }
  return request;
}

export function buildHealthProbeRequest(model: string) {
  return {
    model,
    max_tokens: 5,
    messages: [{ role: "user" as const, content: "Reply OK" }],
  };
}

/**
 * Same order as Reclaim's text-PDF chain (master, src/app/api/extract/route.ts).
 * These are the models that succeed on the shared OpenRouter account.
 * The :free ids tried previously return 404 under that account's data policy.
 */
export const EXTRACTION_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "meta-llama/llama-3.3-70b-instruct",
] as const;

/** Reclaim only sends response_format to these two. Other models reject it. */
export const JSON_MODE_MODELS = new Set<string>([
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
]);

export type ModelCompletion = {
  status: number;
  content: string | null;
  /** Provider error text. Logged and returned to the signed-in health check. Never an API key. */
  errorSnippet?: string | null;
};

export type HealthProbe = {
  model: string;
  status: number;
  ok: boolean;
  error_snippet: string | null;
};

const SNIPPET_LIMIT = 200;

/** Drop tokens and keys before anything is logged or sent back to the browser. */
export function publicErrorSnippet(value: string | null | undefined): string {
  const raw = (value ?? "").replace(/\s+/g, " ").trim();
  const key = process.env.OPENROUTER_API_KEY;
  let safe = raw.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  safe = safe.replace(/sk-or-[A-Za-z0-9_-]+/g, "[redacted]");
  if (key) safe = safe.split(key).join("[redacted]");
  return safe.slice(0, SNIPPET_LIMIT);
}

export function logModelFailure(model: string, status: number, snippet: string | null | undefined): void {
  console.error(`[extract] model=${model} status=${status} error=${publicErrorSnippet(snippet)}`);
}

export function interpretHealthProbe(model: string, status: number, body: string): HealthProbe {
  let ok = status >= 200 && status < 300;
  let snippetSource = body;
  if (ok && body.trim().startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(body);
      if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
        ok = false;
        const error = parsed.error;
        if (typeof error === "string") snippetSource = error;
        else if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
          snippetSource = error.message;
        }
      }
    } catch {
      ok = false;
      snippetSource = "unparseable health response";
    }
  }
  const errorSnippet = ok ? "" : publicErrorSnippet(snippetSource);
  return {
    model,
    status,
    ok,
    error_snippet: errorSnippet.length > 0 ? errorSnippet : null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeLine(value: unknown): EOBLineItem {
  const record = asRecord(value) ?? {};
  return {
    procedure_code:
      text(record.procedure_code) ?? text(record.code) ?? text(record.cpt) ?? text(record.cdt),
    procedure_description: text(record.procedure_description) ?? text(record.description),
    tooth_number: text(record.tooth_number),
    date_of_service: text(record.date_of_service),
    billed_amount: num(record.billed_amount) ?? num(record.billed),
    allowed_amount: num(record.allowed_amount) ?? num(record.allowed),
    insurance_paid: num(record.insurance_paid) ?? num(record.paid),
    patient_responsibility: num(record.patient_responsibility),
    deductible_applied: num(record.deductible_applied),
    copay: num(record.copay),
    coinsurance: num(record.coinsurance),
    adjustment_amount: num(record.adjustment_amount) ?? num(record.adjustment),
    adjustment_code: text(record.adjustment_code) ?? text(record.adj_code),
    adjustment_description: text(record.adjustment_description),
    remark_codes: Array.isArray(record.remark_codes) ? strings(record.remark_codes) : null,
    remark_description: text(record.remark_description),
    confidence_score: num(record.confidence_score),
  };
}

function hasExtractionFields(record: Record<string, unknown>): boolean {
  return (
    "patient_name" in record ||
    "payer_name" in record ||
    "line_items" in record ||
    "lineItems" in record
  );
}

function wrappedValue(record: Record<string, unknown>): unknown | null {
  if (hasExtractionFields(record)) return null;
  for (const key of ["claims", "extractions", "eobs", "eob", "data", "result"]) {
    if (key in record) return record[key];
  }
  return null;
}

function normalizeExtraction(value: unknown): EOBExtraction {
  if (Array.isArray(value)) {
    if (value.length === 0) throw new Error("empty extraction");
    return normalizeExtraction(value[0]);
  }

  const record = asRecord(value);
  if (!record) throw new Error("extraction was not an object");

  const wrapped = wrappedValue(record);
  if (wrapped !== null) return normalizeExtraction(wrapped);

  const lines = record.line_items ?? record.lineItems ?? record.procedures ?? record.services;
  const extraction: EOBExtraction = {
    payer_name: text(record.payer_name),
    payer_id: text(record.payer_id),
    patient_name: text(record.patient_name),
    patient_dob: text(record.patient_dob),
    patient_id: text(record.patient_id),
    subscriber_name: text(record.subscriber_name),
    subscriber_id: text(record.subscriber_id),
    group_number: text(record.group_number),
    claim_number: text(record.claim_number),
    date_of_service: text(record.date_of_service),
    provider_name: text(record.provider_name),
    provider_npi: text(record.provider_npi),
    check_number: text(record.check_number),
    check_date: text(record.check_date),
    check_amount: num(record.check_amount),
    line_items: Array.isArray(lines) ? lines.map(normalizeLine) : [],
    total_billed: num(record.total_billed),
    total_allowed: num(record.total_allowed),
    total_insurance_paid: num(record.total_insurance_paid),
    total_patient_responsibility: num(record.total_patient_responsibility),
    total_adjustments: num(record.total_adjustments),
    remarks: text(record.remarks),
    denial_flags: strings(record.denial_flags),
    confidence_score: num(record.confidence_score) ?? 0,
  };

  if (!extraction.patient_name && !extraction.payer_name && extraction.line_items.length === 0) {
    throw new Error("extraction had no patient, payer, or lines");
  }

  return extraction;
}

function sliceJson(raw: string): string {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) text = fenced[1].trim();

  const objectAt = text.indexOf("{");
  const arrayAt = text.indexOf("[");
  const useObject = objectAt >= 0 && (arrayAt < 0 || objectAt < arrayAt);
  const start = useObject ? objectAt : arrayAt;
  if (start < 0) throw new Error("no json in model output");
  const end = text.lastIndexOf(useObject ? "}" : "]");
  if (end <= start) throw new Error("no json in model output");
  return text.slice(start, end + 1);
}

export function parseExtractionJson(raw: string): EOBExtraction {
  return normalizeExtraction(JSON.parse(sliceJson(raw)));
}

export function shouldTryNextModel(status: number): boolean {
  return status === 402 || status === 429 || status === 404 || status >= 500;
}

function failureSnippet(completion: ModelCompletion): string {
  if (completion.errorSnippet) return completion.errorSnippet;
  if (completion.status !== 200 && completion.content) return completion.content;
  if (!completion.content) return "empty response";
  return "unparseable JSON";
}

export async function extractWithFallback(
  complete: (model: string) => Promise<ModelCompletion>,
  models: readonly string[] = EXTRACTION_MODELS
): Promise<EOBExtraction> {
  for (const model of models) {
    let completion: ModelCompletion;
    try {
      completion = await complete(model);
    } catch (error) {
      const message = error instanceof Error ? error.message : "request failed";
      logModelFailure(model, 0, message);
      continue;
    }

    // 402, 429, 404 (including "no endpoints for your data policy"), and 5xx move on.
    // So does any other failed call, and JSON this model could not shape.
    if (completion.status !== 200 || !completion.content || shouldTryNextModel(completion.status)) {
      logModelFailure(model, completion.status, failureSnippet(completion));
      continue;
    }

    try {
      return parseExtractionJson(completion.content);
    } catch {
      logModelFailure(model, completion.status, "unparseable JSON");
      continue;
    }
  }

  throw new Error(READER_BUSY_MESSAGE);
}
