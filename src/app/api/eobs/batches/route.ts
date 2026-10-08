import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: practice } = await supabase
    .from("practices")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!practice) {
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });
  }

  const { data: batches, error } = await supabase
    .from("batches")
    .select("*")
    .eq("practice_id", practice.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!batches) {
    return NextResponse.json([]);
  }

  // Sync every batch with its real extraction count and fix stale statuses
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const emptyBatchIds: string[] = [];

  for (const batch of batches) {
    // Count actual extractions for this batch
    const { count } = await supabase
      .from("eob_extractions")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batch.id);

    const { count: approvedCount } = await supabase
      .from("eob_extractions")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batch.id)
      .eq("review_status", "approved");

    const actualCount = count ?? 0;
    const approved = approvedCount ?? 0;

    // Counts on the batch row are a cache of the extraction rows.
    // The dashboard and the batch page both read this cache.
    if (
      batch.total_eobs !== actualCount ||
      batch.processed_eobs !== actualCount ||
      batch.approved_eobs !== approved ||
      (batch.status === "processing" && batch.created_at < fiveMinutesAgo)
    ) {
      const newStatus =
        batch.status === "processing" && batch.created_at < fiveMinutesAgo
          ? "ready"
          : batch.status;

      await supabase
        .from("batches")
        .update({
          total_eobs: actualCount,
          processed_eobs: actualCount,
          approved_eobs: approved,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", batch.id);

      batch.total_eobs = actualCount;
      batch.processed_eobs = actualCount;
      batch.approved_eobs = approved;
      batch.status = newStatus;
    }

    // Track empty batches for cleanup
    if (actualCount === 0) {
      emptyBatchIds.push(batch.id);
    }
  }

  // Auto-delete empty batches (no extractions = failed upload, nothing to review)
  if (emptyBatchIds.length > 0) {
    // Clean up storage files first
    for (const batchId of emptyBatchIds) {
      const { data: eobs } = await supabase
        .from("eob_extractions")
        .select("pdf_storage_path")
        .eq("batch_id", batchId);

      if (eobs && eobs.length > 0) {
        const paths = eobs.map((e) => e.pdf_storage_path).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from("eob-pdfs").remove(paths);
        }
      }
    }

    await supabase
      .from("batches")
      .delete()
      .in("id", emptyBatchIds);
  }

  // Return only non-empty batches
  const validBatches = batches.filter((b) => !emptyBatchIds.includes(b.id));

  return NextResponse.json(validBatches);
}
