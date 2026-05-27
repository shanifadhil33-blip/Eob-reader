import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: practice } = await supabase
    .from("practices")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("eob_extractions")
    .update({
      review_status: "flagged",
      reviewed_by: practice?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, batch_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update the approved_eobs count on the parent batch
  if (data?.batch_id) {
    const { count } = await supabase
      .from("eob_extractions")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", data.batch_id)
      .eq("review_status", "approved");

    await supabase
      .from("batches")
      .update({ approved_eobs: count ?? 0, updated_at: new Date().toISOString() })
      .eq("id", data.batch_id);
  }

  return NextResponse.json(data);
}
