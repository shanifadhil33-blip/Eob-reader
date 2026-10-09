import { NextResponse } from "next/server";
import { EXTRACTION_MODELS } from "@/lib/extraction/model-chain";
import { probeOpenRouterModel } from "@/lib/extraction/openrouter";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];
  for (const model of EXTRACTION_MODELS) {
    results.push(await probeOpenRouterModel(model));
  }

  return NextResponse.json(results);
}
