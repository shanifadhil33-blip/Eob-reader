import {
  buildGeminiExtractionBody,
  buildGeminiHealthBody,
  interpretHealthProbe,
  OPENROUTER_TIMEOUT_MS,
  publicErrorSnippet,
  type HealthProbe,
  type ModelCompletion,
} from "./model-chain";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

function readGeminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== "object") return null;
  const content = (candidates[0] as { content?: { parts?: unknown } }).content;
  if (!content || !Array.isArray(content.parts)) return null;
  const text = content.parts
    .map((part) => {
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("");
  return text.trim() ? text : null;
}

async function postGemini(apiKey: string, model: string, body: unknown, timeoutMs: number): Promise<Response> {
  return fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: geminiHeaders(apiKey),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function completeWithGemini(apiKey: string, model: string, pdfText: string): Promise<ModelCompletion> {
  const response = await postGemini(apiKey, model, buildGeminiExtractionBody(pdfText), OPENROUTER_TIMEOUT_MS);
  if (!response.ok) {
    const errorBody = await response.text();
    return { status: response.status, content: null, errorSnippet: publicErrorSnippet(errorBody) };
  }
  const payload: unknown = await response.json();
  return { status: response.status, content: readGeminiText(payload) };
}

export async function probeGeminiModel(apiKey: string, model: string): Promise<HealthProbe> {
  try {
    const response = await postGemini(apiKey, model, buildGeminiHealthBody(), 20_000);
    const body = await response.text();
    const result = interpretHealthProbe("gemini", model, response.status, body);
    if (!result.ok) {
      console.error(`[ai-health] provider=${result.provider} model=${result.model} status=${result.status} error=${result.error_snippet ?? ""}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    const result = interpretHealthProbe("gemini", model, 0, message);
    console.error(`[ai-health] provider=${result.provider} model=${result.model} status=${result.status} error=${result.error_snippet ?? ""}`);
    return result;
  }
}
