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

  // Verify the batch belongs to this practice
  const { data: batch } = await supabase
    .from("batches")
    .select("id, practice_id")
    .eq("id", id)
    .eq("practice_id", practice.id)
    .single();

  if (!batch)
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  // Delete storage files for all EOBs in this batch
  const { data: eobs } = await supabase
    .from("eob_extractions")
    .select("pdf_storage_path")
    .eq("batch_id", id);

  if (eobs && eobs.length > 0) {
    const paths = eobs
      .map((e) => e.pdf_storage_path)
      .filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from("eob-pdfs").remove(paths);
    }
  }

  // Delete the batch (cascades to eob_extractions → eob_line_items)
  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
