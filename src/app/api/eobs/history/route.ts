import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
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

  if (!practice) {
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });
  }

  const { data: eobs, error } = await supabase
    .from("eob_extractions")
    .select(
      "id, patient_name, payer_name, claim_number, date_of_service, check_amount, total_insurance_paid, review_status, reviewed_at, created_at, confidence_score, batch_id, batches(id, created_at)"
    )
    .eq("practice_id", practice.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(eobs);
}
