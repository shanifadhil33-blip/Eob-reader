import { NextResponse } from "next/server";
import { probeGeminiModel } from "@/lib/extraction/gemini";
import { configuredHealthTargets, providerKey, selectHealthTargets } from "@/lib/extraction/model-chain";
import { probeGroqModel } from "@/lib/extraction/groq";
import { probeOpenRouterModel } from "@/lib/extraction/openrouter";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = new URL(request.url).searchParams.get("all") === "1";
  const targets = selectHealthTargets(
    configuredHealthTargets({
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODELS: process.env.GEMINI_MODELS,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GROQ_MODEL: process.env.GROQ_MODEL,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    }),
    all
  );

  const geminiKey = providerKey(process.env.GEMINI_API_KEY);
  const groqKey = providerKey(process.env.GROQ_API_KEY);
  const results = [];
  for (const target of targets) {
    if (target.provider === "gemini" && geminiKey) {
      results.push(await probeGeminiModel(geminiKey, target.model));
    } else if (target.provider === "groq" && groqKey) {
      results.push(await probeGroqModel(groqKey, target.model));
    } else if (target.provider === "openrouter") {
      results.push(await probeOpenRouterModel(target.model));
    }
  }

  return NextResponse.json(results);
}
