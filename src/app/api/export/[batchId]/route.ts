import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/dentrix";
import {
  generateX12835,
  eobExtractionsToX12Data,
} from "@/lib/export/x12-generator";
import { validateRemittance, formatValidationReport } from "@/lib/export/x12-validator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const format = body.format || "835"; // Default to 835

  // Get approved EOBs with line items
  const { data: eobs, error } = await supabase
    .from("eob_extractions")
    .select("*, eob_line_items(*)")
    .eq("batch_id", batchId)
    .eq("review_status", "approved");

  if (error) {
    console.error("export read failed", error.message);
    return NextResponse.json({ error: "Couldn't export. Try again." }, { status: 500 });
  }

  if (!eobs || eobs.length === 0) {
    return NextResponse.json(
      { error: "No approved EOBs found in this batch" },
      { status: 400 }
    );
  }

  // Map the data to include line_items field expected by generators
  const mappedEobs = eobs.map((eob) => ({
    ...eob,
    line_items: eob.eob_line_items || [],
  }));

  // ============================================
  // X12 835 Export (Primary)
  // ============================================
  if (format === "835") {
    // Convert EOB extractions to X12 remittance data
    const x12Data = eobExtractionsToX12Data(eobs);

    // Validate first
    const validation = validateRemittance(x12Data);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Export blocked: balancing errors found",
          validationReport: formatValidationReport(validation),
          validationErrors: validation.errors,
          validationWarnings: validation.warnings,
        },
        { status: 422 }
      );
    }

    // Generate 835
    const result = generateX12835(x12Data);
    if (!result.success || !result.ediString) {
      console.error("835 generation failed", result.errors);
      return NextResponse.json(
        { error: "Couldn't build the 835 file. Try again." },
        { status: 500 }
      );
    }

    // Update batch status
    await supabase
      .from("batches")
      .update({ status: "exported", updated_at: new Date().toISOString() })
      .eq("id", batchId);

    return new NextResponse(result.ediString, {
      headers: {
        "Content-Type": "application/edi-x12",
        "Content-Disposition": `attachment; filename="ERA-${x12Data.checkNumber}-${new Date().toISOString().split("T")[0]}.835"`,
      },
    });
  }

  // ============================================
  // Legacy CSV Export (Fallback)
  // ============================================
  const csv = generateCSV(
    mappedEobs,
    format as "dentrix" | "eaglesoft" | "open_dental"
  );

  await supabase
    .from("batches")
    .update({ status: "exported", updated_at: new Date().toISOString() })
    .eq("id", batchId);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="eob-export-${format}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
