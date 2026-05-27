import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Verify the EOB belongs to this practice
  const { data: eob } = await supabase
    .from("eob_extractions")
    .select("id, practice_id, batch_id, pdf_storage_path")
    .eq("id", id)
    .eq("practice_id", practice.id)
    .single();

  if (!eob)
    return NextResponse.json({ error: "EOB not found" }, { status: 404 });

  // Delete the PDF from storage
  if (eob.pdf_storage_path) {
    await supabase.storage.from("eob-pdfs").remove([eob.pdf_storage_path]);
  }

  // Delete the EOB (cascades to eob_line_items)
  const { error } = await supabase
    .from("eob_extractions")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Update the parent batch counts
  if (eob.batch_id) {
    const { count: totalCount } = await supabase
      .from("eob_extractions")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", eob.batch_id);

    const { count: approvedCount } = await supabase
      .from("eob_extractions")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", eob.batch_id)
      .eq("review_status", "approved");

    await supabase
      .from("batches")
      .update({
        total_eobs: totalCount ?? 0,
        processed_eobs: totalCount ?? 0,
        approved_eobs: approvedCount ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eob.batch_id);
  }

  return NextResponse.json({ success: true });
}
