// ============================================
// EOB Extraction Types
// ============================================

export interface EOBLineItem {
  id?: string;
  procedure_code: string | null;
  procedure_description: string | null;
  tooth_number: string | null;
  date_of_service: string | null;
  billed_amount: number | null;
  allowed_amount: number | null;
  insurance_paid: number | null;
  patient_responsibility: number | null;
  deductible_applied: number | null;
  copay: number | null;
  coinsurance: number | null;
  adjustment_amount: number | null;
  adjustment_code: string | null;
  adjustment_description: string | null;
  remark_codes: string[] | null;
  remark_description: string | null;
  confidence_score: number | null;
}

export interface EOBExtraction {
  payer_name: string | null;
  payer_id: string | null;
  patient_name: string | null;
  patient_dob: string | null;
  patient_id: string | null;
  subscriber_name: string | null;
  subscriber_id: string | null;
  group_number: string | null;
  claim_number: string | null;
  date_of_service: string | null;
  provider_name: string | null;
  provider_npi: string | null;
  check_number: string | null;
  check_date: string | null;
  check_amount: number | null;
  line_items: EOBLineItem[];
  total_billed: number | null;
  total_allowed: number | null;
  total_insurance_paid: number | null;
  total_patient_responsibility: number | null;
  total_adjustments: number | null;
  remarks: string | null;
  denial_flags: string[];
  confidence_score: number;
}

export interface EOBExtractionRecord extends EOBExtraction {
  id: string;
  batch_id: string;
  practice_id: string;
  pdf_storage_path: string;
  raw_extraction: EOBExtraction;
  review_status: "pending" | "approved" | "flagged" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  practice_id: string;
  name: string;
  total_eobs: number;
  processed_eobs: number;
  approved_eobs: number;
  status: "processing" | "ready" | "exported" | "archived";
  created_at: string;
  updated_at: string;
  eob_extractions?: EOBExtractionRecord[];
}

export interface Practice {
  id: string;
  name: string;
  email: string;
  auth_id: string;
  default_pms: "dentrix" | "eaglesoft" | "open_dental";
  created_at: string;
  updated_at: string;
}
