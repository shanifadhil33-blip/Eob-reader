import { completeWithGemini } from "./gemini";
import { completeWithGroq } from "./groq";
import {
  buildExtractionRequest,
  buildHealthProbeRequest,
  EXTRACTION_MODELS,
  extractAcrossProviders,
  groqModelName,
  interpretHealthProbe,
  openRouterHeaders,
  OPENROUTER_TIMEOUT_MS,
  parseExtractionJson,
  parseGeminiModels,
  providerKey,
  publicErrorSnippet,
  READER_BUSY_MESSAGE,
  TEXT_EXTRACTION_PROMPT,
  type HealthProbe,
  type ModelCompletion,
} from "./model-chain";
import type { EOBExtraction } from "./types";

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
    headers: openRouterHeaders(process.env.OPENROUTER_API_KEY || ""),
    body: JSON.stringify(buildExtractionRequest(model, pdfText)),
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
  return { status: response.status, content: readMessageContent(payload) };
}

export async function probeOpenRouterModel(model: string): Promise<HealthProbe> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: openRouterHeaders(process.env.OPENROUTER_API_KEY || ""),
      body: JSON.stringify(buildHealthProbeRequest(model)),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.text();
    const result = interpretHealthProbe("openrouter", model, response.status, body);
    if (!result.ok) {
      console.error(`[ai-health] provider=${result.provider} model=${result.model} status=${result.status} error=${result.error_snippet ?? ""}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    const result = interpretHealthProbe("openrouter", model, 0, message);
    console.error(`[ai-health] provider=${result.provider} model=${result.model} status=${result.status} error=${result.error_snippet ?? ""}`);
    return result;
  }
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

  const geminiKey = providerKey(process.env.GEMINI_API_KEY);
  const groqKey = providerKey(process.env.GROQ_API_KEY);
  const openRouterKey = providerKey(process.env.OPENROUTER_API_KEY);

  return extractAcrossProviders({
    gemini: geminiKey
      ? {
          models: parseGeminiModels(process.env.GEMINI_MODELS),
          complete: (model) => completeWithGemini(geminiKey, model, pdfText),
        }
      : undefined,
    groq: groqKey
      ? {
          model: groqModelName(process.env.GROQ_MODEL),
          complete: (model) => completeWithGroq(groqKey, model, pdfText),
        }
      : undefined,
    openRouter: openRouterKey
      ? { models: EXTRACTION_MODELS, complete: (model) => completeWithOpenRouter(model, pdfText) }
      : undefined,
  });
}
