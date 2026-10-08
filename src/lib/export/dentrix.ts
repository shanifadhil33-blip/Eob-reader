import { EOBExtractionRecord } from "../extraction/types";

// Format date for Dentrix (MM/DD/YYYY)
function formatDateDentrix(dateStr: string | null): string {
  if (!dateStr) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) return `${match[2]}/${match[3]}/${match[1]}`;
  return dateStr;
}

export function generateDentrixCSV(extractions: EOBExtractionRecord[]): string {
  const headers = [
    "Patient Name",
    "Patient ID",
    "Claim Number",
    "Date of Service",
    "Procedure Code",
    "Billed Amount",
    "Allowed Amount",
    "Insurance Paid",
    "Patient Responsibility",
    "Adjustment Code",
    "Adjustment Amount",
    "Check Number",
    "Check Date",
  ];

  const rows: string[][] = [];

  for (const eob of extractions) {
    const lineItems = eob.line_items || [];
    if (lineItems.length === 0) {
      // Single row for EOB with no line items
      rows.push([
        `"${eob.patient_name || ""}"`,
        `"${eob.patient_id || ""}"`,
        `"${eob.claim_number || ""}"`,
        `"${formatDateDentrix(eob.date_of_service)}"`,
        "",
        String(eob.total_billed || 0),
        String(eob.total_allowed || 0),
        String(eob.total_insurance_paid || 0),
        String(eob.total_patient_responsibility || 0),
        "",
        String(eob.total_adjustments || 0),
        `"${eob.check_number || ""}"`,
        `"${formatDateDentrix(eob.check_date)}"`,
      ]);
    } else {
      for (const item of lineItems) {
        rows.push([
          `"${eob.patient_name || ""}"`,
          `"${eob.patient_id || ""}"`,
          `"${eob.claim_number || ""}"`,
          `"${formatDateDentrix(item.date_of_service || eob.date_of_service)}"`,
          `"${item.procedure_code || ""}"`,
          String(item.billed_amount ?? 0),
          String(item.allowed_amount ?? 0),
          String(item.insurance_paid ?? 0),
          String(item.patient_responsibility ?? 0),
          `"${item.adjustment_code || ""}"`,
          String(item.adjustment_amount ?? 0),
          `"${eob.check_number || ""}"`,
          `"${formatDateDentrix(eob.check_date)}"`,
        ]);
      }
    }
  }

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateOpenDentalCSV(extractions: EOBExtractionRecord[]): string {
  const headers = [
    "PatNum",
    "ClaimNum",
    "ProcCode",
    "DateService",
    "FeeBilled",
    "InsPayAmt",
    "WriteOff",
    "DedApplied",
    "PatPortion",
    "CheckNum",
    "CheckDate",
    "CarrierName",
  ];

  const rows: string[][] = [];

  for (const eob of extractions) {
    const lineItems = eob.line_items || [];
    for (const item of lineItems) {
      rows.push([
        eob.patient_id || "",
        eob.claim_number || "",
        item.procedure_code || "",
        item.date_of_service || eob.date_of_service || "",
        String(item.billed_amount ?? 0),
        String(item.insurance_paid ?? 0),
        String(item.adjustment_amount ?? 0),
        String(item.deductible_applied ?? 0),
        String(item.patient_responsibility ?? 0),
        eob.check_number || "",
        eob.check_date || "",
        `"${eob.payer_name || ""}"`,
      ]);
    }
  }

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateEaglesoftCSV(extractions: EOBExtractionRecord[]): string {
  const headers = [
    "Patient",
    "Account",
    "Service Date",
    "Code",
    "Description",
    "Charge",
    "Payment",
    "Adjustment",
    "Check#",
    "Insurance",
  ];

  const rows: string[][] = [];

  for (const eob of extractions) {
    const lineItems = eob.line_items || [];
    // Eaglesoft uses "Last, First" format
    const nameParts = (eob.patient_name || "").split(" ");
    const eaglesoftName =
      nameParts.length >= 2
        ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(" ")}`
        : eob.patient_name || "";

    for (const item of lineItems) {
      rows.push([
        `"${eaglesoftName}"`,
        `"${eob.patient_id || ""}"`,
        `"${formatDateDentrix(item.date_of_service || eob.date_of_service)}"`,
        `"${item.procedure_code || ""}"`,
        `"${item.procedure_description || ""}"`,
        String(item.billed_amount ?? 0),
        String(item.insurance_paid ?? 0),
        String(item.adjustment_amount ?? 0),
        `"${eob.check_number || ""}"`,
        `"${eob.payer_name || ""}"`,
      ]);
    }
  }

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateCSV(
  extractions: EOBExtractionRecord[],
  pmsFormat: "dentrix" | "eaglesoft" | "open_dental"
): string {
  switch (pmsFormat) {
    case "dentrix":
      return generateDentrixCSV(extractions);
    case "open_dental":
      return generateOpenDentalCSV(extractions);
    case "eaglesoft":
      return generateEaglesoftCSV(extractions);
    default:
      return generateDentrixCSV(extractions);
  }
}
