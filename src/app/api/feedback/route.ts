import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: practice } = await supabase
    .from("practices")
    .select("id, email")
    .eq("auth_id", user.id)
    .single();

  if (!practice)
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });

  const body = await request.json();
  const { category, message, rating } = body;

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("feedback").insert({
    practice_id: practice.id,
    user_email: practice.email,
    category: category || "suggestion",
    message: message.trim(),
    rating: rating || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: practice } = await supabase
    .from("practices")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!practice)
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });

  const { data: feedbacks, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("practice_id", practice.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(feedbacks);
}
