import {
  buildGroqExtractionBody,
  buildGroqHealthBody,
  interpretHealthProbe,
  OPENROUTER_TIMEOUT_MS,
  publicErrorSnippet,
  type HealthProbe,
  type ModelCompletion,
} from "./model-chain";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function groqHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function readGroqContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return null;
  const content = (choices[0] as { message?: { content?: unknown } }).message?.content;
  if (typeof content === "string") return content.trim() ? content : null;
  if (!Array.isArray(content)) return null;
  const text = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .join("");
  return text.trim() ? text : null;
}

export async function completeWithGroq(apiKey: string, model: string, pdfText: string): Promise<ModelCompletion> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: groqHeaders(apiKey),
    body: JSON.stringify(buildGroqExtractionBody(model, pdfText)),
    signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    return { status: response.status, content: null, errorSnippet: publicErrorSnippet(errorBody) };
  }
  const payload: unknown = await response.json();
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    const error = payload.error;
    const message =
      typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "provider error";
    return { status: response.status, content: null, errorSnippet: publicErrorSnippet(message) };
  }
  return { status: response.status, content: readGroqContent(payload) };
}

export async function probeGroqModel(apiKey: string, model: string): Promise<HealthProbe> {
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: groqHeaders(apiKey),
      body: JSON.stringify(buildGroqHealthBody(model)),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.text();
    const result = interpretHealthProbe("groq", model, response.status, body);
    if (!result.ok) {
      console.error(`[ai-health] provider=${result.provider} model=${result.model} status=${result.status} error=${result.error_snippet ?? ""}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    const result = interpretHealthProbe("groq", model, 0, message);
    console.error(`[ai-health] provider=${result.provider} model=${result.model} status=${result.status} error=${result.error_snippet ?? ""}`);
    return result;
  }
}
