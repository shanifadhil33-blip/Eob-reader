import OpenAI from "openai";
import type { EOBExtraction } from "./types";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const TEXT_EXTRACTION_PROMPT = `You are an expert US dental insurance EOB (Explanation of Benefits) data extraction AI.

Your task: Extract ALL structured data from the following raw text extracted from a dental EOB document with maximum accuracy.

Rules:
1. Output ONLY valid JSON matching the provided schema. No markdown, no explanation.
2. Extract EVERY line item — do not skip any procedure.
3. Use standard dental CDT codes (D0120, D1110, D2740, etc.).
4. Adjustment codes follow ANSI X12 standards (CO-45, PR-1, PR-2, PR-3, OA-23, etc.).
5. All dollar amounts as numbers with 2 decimal places.
6. Dates in YYYY-MM-DD format.
7. If a field is not visible or not applicable, use null.
8. Include a confidence_score (0.0 to 1.0) for the overall extraction quality.
9. If multiple patients appear on one EOB, return an array of extraction objects.
10. For per-field confidence, flag any field below 0.80 confidence.

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

export async function extractEOBFromText(
  pdfText: string

): Promise<EOBExtraction> {
  const aiProvider = process.env.AI_PROVIDER || "openrouter";

  if (aiProvider === "ollama") {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2-vision"; // Recommend a vision model for images

    // Send the prompt and the raw parsed PDF text
    const promptWithText = `${TEXT_EXTRACTION_PROMPT}\n\n${pdfText}`;

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          {
            role: "user",
            content: promptWithText,
          },
        ],
        stream: false,
        format: "json", // Ask Ollama to output standard JSON
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonText = data.message?.content || "{}";

    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) return parsed[0] as EOBExtraction;
      return parsed as EOBExtraction;
    } catch {
      throw new Error("Failed to parse AI extraction response from Ollama");
    }
  }

  // Fallback to OpenRouter (default for text)
  const response = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `${TEXT_EXTRACTION_PROMPT}\n\n${pdfText}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const jsonText = response.choices[0].message.content || "{}";

  try {
    const parsed = JSON.parse(jsonText);

    // If the API returns an array (multi-patient EOB), take the first for now
    if (Array.isArray(parsed)) {
      return parsed[0] as EOBExtraction;
    }

    return parsed as EOBExtraction;
  } catch {
    throw new Error("Failed to parse AI extraction response from OpenRouter");
  }
}
