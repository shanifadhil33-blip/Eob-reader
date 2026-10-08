import type { EOBExtraction, EOBLineItem } from "./types";

/** One- or two-page EOBs fit well under this. OpenRouter bills the requested cap. */
export const OUTPUT_TOKEN_CAP = 4000;

export const READER_BUSY_MESSAGE =
  "The reader is busy right now. Please try again in a minute.";

/**
 * Free ids returned by https://openrouter.ai/api/v1/models on 2026-10-08.
 * Instruction and extraction models first. Coding-only and safety models are omitted.
 */
export const FREE_EXTRACTION_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "liquid/lfm-2.5-2.6b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-31b-it:free",
] as const;

export type ModelCompletion = {
  status: number;
  content: string | null;
};

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

export async function extractWithFallback(
  complete: (model: string) => Promise<ModelCompletion>,
  models: readonly string[] = FREE_EXTRACTION_MODELS
): Promise<EOBExtraction> {
  for (const model of models) {
    let completion: ModelCompletion;
    try {
      completion = await complete(model);
    } catch {
      continue;
    }

    // 402, 429, 404, and 5xx move on. So does any other failed call, and JSON this model could not shape.
    if (completion.status !== 200 || !completion.content || shouldTryNextModel(completion.status)) {
      continue;
    }

    try {
      return parseExtractionJson(completion.content);
    } catch {
      continue;
    }
  }

  throw new Error(READER_BUSY_MESSAGE);
}
