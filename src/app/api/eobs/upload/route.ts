import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractEOBFromText } from "@/lib/extraction/openrouter";
import type { EOBLineItem } from "@/lib/extraction/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get practice
    const { data: practice } = await supabase
      .from("practices")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!practice) {
      return NextResponse.json(
        { error: "Practice not found" },
        { status: 404 }
      );
    }

    // ─── Subscription-based upload limits ───
    const isPro = practice.subscription_status === "pro";
    const isActiveTrial =
      practice.subscription_status === "trial" &&
      new Date(practice.trial_end_date) > new Date();
    const isExpiredTrial =
      practice.subscription_status === "trial" &&
      new Date(practice.trial_end_date) <= new Date();
    const isCanceled = practice.subscription_status === "canceled";
    const isExpired = practice.subscription_status === "expired";

    // Determine daily limit based on subscription status
    let dailyLimit: number;
    let planLabel: string;

    if (isPro) {
      dailyLimit = Infinity; // unlimited
      planLabel = "Pro";
    } else if (isActiveTrial) {
      dailyLimit = 100;
      planLabel = "Free Trial";
    } else {
      // Expired trial, canceled, or expired subscription → 1 PDF/day
      dailyLimit = 1;
      planLabel = isExpiredTrial
        ? "Expired Trial"
        : isCanceled
          ? "Canceled"
          : "Expired";
    }

    // Parse multipart form
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const texts = formData.getAll("texts") as string[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate file types and sizes (server-side — don't trust frontend)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    for (const file of files) {
      // Check MIME type
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `Invalid file type for "${file.name}". Only PDF files are accepted.` },
          { status: 400 }
        );
      }
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 50MB limit.` },
          { status: 400 }
        );
      }
      // Validate PDF magic bytes (first 5 bytes should be %PDF-)
      const headerSlice = await file.slice(0, 5).text();
      if (!headerSlice.startsWith("%PDF-")) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a valid PDF.` },
          { status: 400 }
        );
      }
    }

    // Verify lengths match logically
    if (texts.length > 0 && texts.length !== files.length) {
      return NextResponse.json(
        { error: "Mismatch between files and extracted texts" },
        { status: 400 }
      );
    }

    if (files.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 files per upload" },
        { status: 400 }
      );
    }

    // Enforce daily upload limit (skip for Pro — unlimited)
    if (!isPro) {
      const today = new Date().toISOString().split("T")[0];
      let dailyCount = practice.daily_upload_count;

      if (practice.daily_upload_reset_date !== today) {
        dailyCount = 0;
      }

      if (dailyCount + files.length > dailyLimit) {
        const remaining = Math.max(0, dailyLimit - dailyCount);
        const upgradeMsg =
          dailyLimit === 1
            ? " Upgrade to Pro for unlimited uploads."
            : "";
        return NextResponse.json(
          {
            error: `Daily limit exceeded. ${planLabel} allows ${dailyLimit} PDF${dailyLimit === 1 ? "" : "s"}/day. You have ${remaining} remaining today.${upgradeMsg}`,
          },
          { status: 429 }
        );
      }
    }

    // Create batch
    const batchName = `Batch ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .insert({
        practice_id: practice.id,
        name: batchName,
        total_eobs: files.length,
        status: "processing",
      })
      .select()
      .single();

    if (batchError) {
      return NextResponse.json(
        { error: "Failed to create batch" },
        { status: 500 }
      );
    }

    // Process files with concurrency limit
    const CONCURRENCY_LIMIT = 5;
    let processedCount = 0;
    const fileErrors: string[] = [];

    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(chunk.map(async (file, chunkIndex) => {
        const originalIndex = i + chunkIndex;
        const pdfText = texts[originalIndex] || "";
        
        try {
          // Upload to Supabase Storage
          const filePath = `${practice.id}/${batch.id}/${file.name}`;
          const arrayBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from("eob-pdfs")
            .upload(filePath, buffer, {
              contentType: "application/pdf",
            });

          if (uploadError) {
            fileErrors.push(`${file.name}: storage upload failed`);
            return; // Skip this file
          }

          if (!pdfText.trim()) {
            fileErrors.push(`${file.name}: no text could be extracted (scanned PDF?)`);
            return; // Skip this file gracefully
          }

          // Send text to our extraction utility (which routes to Ollama or OpenRouter)
          const extraction = await extractEOBFromText(pdfText);

          // Store extraction
          const { data: eobRecord, error: eobError } = await supabase
            .from("eob_extractions")
            .insert({
              batch_id: batch.id,
              practice_id: practice.id,
              pdf_storage_path: filePath,
              payer_name: extraction.payer_name,
              payer_id: extraction.payer_id,
              patient_name: extraction.patient_name,
              patient_dob: extraction.patient_dob,
              patient_id: extraction.patient_id,
              subscriber_id: extraction.subscriber_id,
              group_number: extraction.group_number,
              claim_number: extraction.claim_number,
              date_of_service: extraction.date_of_service,
              provider_name: extraction.provider_name,
              provider_npi: extraction.provider_npi,
              check_number: extraction.check_number,
              check_date: extraction.check_date,
              check_amount: extraction.check_amount,
              total_billed: extraction.total_billed,
              total_allowed: extraction.total_allowed,
              total_insurance_paid: extraction.total_insurance_paid,
              total_patient_responsibility: extraction.total_patient_responsibility,
              total_adjustments: extraction.total_adjustments,
              remarks: extraction.remarks,
              raw_extraction: extraction,
              confidence_score: extraction.confidence_score,
              review_status: "pending",
            })
            .select()
            .single();

          if (eobError) {
            fileErrors.push(`${file.name}: failed to store extraction`);
            return; // Skip this file gracefully
          }

          // Store line items
          if (extraction.line_items && extraction.line_items.length > 0) {
            const lineItems = extraction.line_items.map((item: EOBLineItem) => ({
              eob_extraction_id: eobRecord.id,
              procedure_code: item.procedure_code,
              procedure_description: item.procedure_description,
              tooth_number: item.tooth_number,
              date_of_service: item.date_of_service,
              billed_amount: item.billed_amount,
              allowed_amount: item.allowed_amount,
              insurance_paid: item.insurance_paid,
              patient_responsibility: item.patient_responsibility,
              deductible_applied: item.deductible_applied,
              copay: item.copay,
              coinsurance: item.coinsurance,
              adjustment_amount: item.adjustment_amount,
              adjustment_code: item.adjustment_code,
              adjustment_description: item.adjustment_description,
              remark_codes: item.remark_codes,
              remark_description: item.remark_description,
              confidence_score: item.confidence_score,
            }));

            const { error: linesError } = await supabase
              .from("eob_line_items")
              .insert(lineItems);

            if (linesError) {
              fileErrors.push(`${file.name}: failed to store line items`);
            }
          }

          processedCount++;
        } catch (fileError: unknown) {
          const message =
            fileError instanceof Error ? fileError.message : "processing failed";
          fileErrors.push(`${file.name}: ${message}`);
          // Don't rethrow — allow other files to continue and batch status to update
        }
      }));
    }

    // Always update batch status — never leave it stuck at "processing"
    await supabase
      .from("batches")
      .update({
        processed_eobs: processedCount,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    // Update daily upload count (for all non-pro users)
    if (!isPro) {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("practices")
        .update({
          daily_upload_count:
            practice.daily_upload_reset_date === today
              ? practice.daily_upload_count + files.length
              : files.length,
          daily_upload_reset_date: today,
        })
        .eq("id", practice.id);
    }

    return NextResponse.json({
      batchId: batch.id,
      totalFiles: files.length,
      processed: processedCount,
      errors: fileErrors.length > 0 ? fileErrors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
