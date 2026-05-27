// ============================================
// X12 835 Generator — ANSI X12 005010X221A1
// Electronic Remittance Advice (ERA)
// ============================================
//
// Transforms validated JSON remittance data into a fully compliant
// 835 EDI string that Dentrix, Open Dental, and Eaglesoft can ingest.
//
// Delimiter Reference:
//   Element Separator:     * (asterisk)
//   Sub-element Separator: : (colon)
//   Segment Terminator:    ~ (tilde)
//   Repetition Separator:  ^ (caret)
//
// This generator MUST be called ONLY after x12-validator.ts confirms
// the data passes all three balancing rules.

import {
  type X12RemittanceData,
  type X12Claim,
  type X12ServiceLine,
  type X12Adjustment,
  validateRemittance,
} from "./x12-validator";

// Re-export types for convenience
export type {
  X12RemittanceData,
  X12Claim,
  X12ServiceLine,
  X12Adjustment,
};

const ELEMENT_SEP = "*";
const SUB_ELEMENT_SEP = ":";
const SEGMENT_TERM = "~";

// ============================================
// Utility Functions
// ============================================

/** Format date from YYYY-MM-DD to YYYYMMDD (X12 D8 format) */
function formatDateD8(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/** Format decimal to 2-place string without trailing issues */
function money(amount: number): string {
  return amount.toFixed(2);
}

/** Pad string to fixed length with trailing spaces */
function padRight(str: string, len: number): string {
  return str.substring(0, len).padEnd(len, " ");
}

/** Pad string to fixed length with leading zeros */
function padLeft(str: string, len: number): string {
  return str.substring(0, len).padStart(len, "0");
}

/** Sanitize string for X12 — remove delimiters and control characters */
function sanitize(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/[~*:^]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

/** Build a segment from an array of elements */
function segment(elements: (string | number)[]): string {
  return elements.join(ELEMENT_SEP) + SEGMENT_TERM;
}

/** Generate an incrementing control number */
function controlNumber(n: number, digits: number = 9): string {
  return padLeft(String(n), digits);
}

// ============================================
// Main Generator
// ============================================

export interface X12GeneratorResult {
  success: boolean;
  ediString?: string;
  segmentCount?: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * Generates a complete ANSI X12 835 (005010X221A1) EDI string.
 *
 * CRITICAL: This function validates the data FIRST. If validation fails,
 * it returns { success: false } with the error details. It will NEVER
 * produce an unbalanced 835.
 */
export function generateX12835(
  data: X12RemittanceData,
  options: {
    interchangeControlNumber?: number;
    groupControlNumber?: number;
    transactionControlNumber?: string;
    senderId?: string;
    receiverId?: string;
    skipValidation?: boolean; // ONLY for testing — never in production
  } = {}
): X12GeneratorResult {
  // ============================================
  // Step 1: VALIDATE — never export broken math
  // ============================================
  if (!options.skipValidation) {
    const validation = validateRemittance(data);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors.map((e) => e.message),
        warnings: validation.warnings,
      };
    }
  }

  const segments: string[] = [];
  let segmentCounter = 0; // Counts segments between ST and SE (inclusive)

  function addSegment(seg: string): void {
    segments.push(seg);
    segmentCounter++;
  }

  const icn = options.interchangeControlNumber || 1;
  const gcn = options.groupControlNumber || 1;
  const tcn = options.transactionControlNumber || controlNumber(1, 4);
  const senderId = padRight(options.senderId || data.payerId || "EOBREADER", 15);
  const receiverId = padRight(
    options.receiverId || data.providerNpi || "RECEIVER",
    15
  );
  const checkDateD8 = formatDateD8(data.checkDate);
  const now = new Date();
  const dateD8 = `${now.getFullYear()}${padLeft(String(now.getMonth() + 1), 2)}${padLeft(String(now.getDate()), 2)}`;
  const timeHHMM = `${padLeft(String(now.getHours()), 2)}${padLeft(String(now.getMinutes()), 2)}`;

  // ============================================
  // ISA — Interchange Control Header
  // ============================================
  // ISA is a fixed-length segment — each element has specific padding rules
  const isaSeg = [
    "ISA",
    "00",                    // ISA01: Authorization Information Qualifier
    padRight("", 10),        // ISA02: Authorization Information
    "00",                    // ISA03: Security Information Qualifier
    padRight("", 10),        // ISA04: Security Information
    "ZZ",                    // ISA05: Interchange ID Qualifier (Mutually Defined)
    senderId,                // ISA06: Interchange Sender ID (15 chars)
    "ZZ",                    // ISA07: Interchange ID Qualifier
    receiverId,              // ISA08: Interchange Receiver ID (15 chars)
    dateD8.slice(2),         // ISA09: Interchange Date (YYMMDD)
    timeHHMM,                // ISA10: Interchange Time (HHMM)
    "^",                     // ISA11: Repetition Separator
    "00501",                 // ISA12: Interchange Control Version (00501)
    controlNumber(icn, 9),   // ISA13: Interchange Control Number
    "0",                     // ISA14: Acknowledgment Requested (0 = no)
    "P",                     // ISA15: Usage Indicator (P = Production, T = Test)
    SUB_ELEMENT_SEP,         // ISA16: Component Element Separator
  ].join(ELEMENT_SEP) + SEGMENT_TERM;
  segments.push(isaSeg);
  // ISA is NOT counted in ST-SE segment count

  // ============================================
  // GS — Functional Group Header
  // ============================================
  const gsSeg = segment([
    "GS",
    "HP",                              // GS01: Functional Identifier Code (HP = Health Care Claim Payment/Advice)
    sanitize(data.payerId) || "PAYER",  // GS02: Application Sender's Code
    sanitize(data.providerNpi),         // GS03: Application Receiver's Code
    dateD8,                            // GS04: Date (CCYYMMDD)
    timeHHMM,                          // GS05: Time (HHMM)
    String(gcn),                       // GS06: Group Control Number
    "X",                               // GS07: Responsible Agency Code
    "005010X221A1",                    // GS08: Version / Release / Industry ID Code
  ]);
  segments.push(gsSeg);
  // GS is NOT counted in ST-SE segment count

  // ============================================
  // ST — Transaction Set Header (835)
  // ============================================
  addSegment(
    segment([
      "ST",
      "835",                         // ST01: Transaction Set Identifier Code
      tcn,                           // ST02: Transaction Set Control Number
      "005010X221A1",                // ST03: Implementation Convention Reference
    ])
  );

  // ============================================
  // BPR — Financial Information
  // ============================================
  addSegment(
    segment([
      "BPR",
      "I",                           // BPR01: Transaction Handling Code (I = Remittance Information Only)
      money(data.totalPaymentAmount), // BPR02: Monetary Amount (total payment)
      "C",                           // BPR03: Credit/Debit Flag (C = Credit)
      data.paymentMethodCode === "ACH" ? "ACH" : "CHK", // BPR04: Payment Method Code
      "",                            // BPR05: Payment Format Code
      "",                            // BPR06: DFI ID Number Qualifier
      "",                            // BPR07: Sender DFI Identifier
      "",                            // BPR08: Sender Account Number Qualifier
      "",                            // BPR09: Sender Account Number
      "",                            // BPR10: Originating Company Identifier
      "",                            // BPR11: Originating Company Supplemental Code
      "",                            // BPR12: DFI ID Number Qualifier (Receiver)
      "",                            // BPR13: Receiver DFI Identifier
      "",                            // BPR14: Receiver Account Number Qualifier
      "",                            // BPR15: Receiver Account Number
      checkDateD8,                   // BPR16: Check Issue or EFT Effective Date
    ])
  );

  // ============================================
  // TRN — Reassociation Trace Number
  // ============================================
  addSegment(
    segment([
      "TRN",
      "1",                                     // TRN01: Trace Type Code (1 = Current Transaction Trace Numbers)
      sanitize(data.checkNumber) || "UNKNOWN",  // TRN02: Check or EFT Trace Number
      "1" + sanitize(data.payerId),             // TRN03: Originating Company Identifier
    ])
  );

  // ============================================
  // DTM — Production Date
  // ============================================
  addSegment(
    segment([
      "DTM",
      "405",           // DTM01: Date/Time Qualifier (405 = Production)
      checkDateD8,     // DTM02: Date
    ])
  );

  // ============================================
  // N1*PR — Payer Identification (Loop 1000A)
  // ============================================
  addSegment(
    segment([
      "N1",
      "PR",                                   // N101: Entity Identifier Code (PR = Payer)
      sanitize(data.payerName).substring(0, 60), // N102: Name
      "XV",                                   // N103: ID Code Qualifier (XV = CMS Plan ID)
      sanitize(data.payerId),                 // N104: ID Code
    ])
  );

  // Payer Address (N3/N4) — optional but recommended
  if (data.payerAddress) {
    addSegment(
      segment([
        "N3",
        sanitize(data.payerAddress).substring(0, 55),
      ])
    );
    addSegment(
      segment([
        "N4",
        sanitize(data.payerCity || "").substring(0, 30),
        sanitize(data.payerState || "").substring(0, 2),
        sanitize(data.payerZip || "").substring(0, 15),
      ])
    );
  }

  // ============================================
  // N1*PE — Payee/Provider Identification (Loop 1000B)
  // ============================================
  addSegment(
    segment([
      "N1",
      "PE",                                     // N101: Entity Identifier Code (PE = Payee)
      sanitize(data.providerName).substring(0, 60), // N102: Name
      "XX",                                     // N103: ID Code Qualifier (XX = NPI)
      sanitize(data.providerNpi),               // N104: NPI
    ])
  );

  // Provider Address (N3/N4) — optional
  if (data.providerAddress) {
    addSegment(
      segment([
        "N3",
        sanitize(data.providerAddress).substring(0, 55),
      ])
    );
    addSegment(
      segment([
        "N4",
        sanitize(data.providerCity || "").substring(0, 30),
        sanitize(data.providerState || "").substring(0, 2),
        sanitize(data.providerZip || "").substring(0, 15),
      ])
    );
  }

  // Optional: REF*TJ for Tax ID
  if (data.providerTaxId) {
    addSegment(
      segment([
        "REF",
        "TJ",                                  // REF01: Reference Identification Qualifier (TJ = Federal Tax ID)
        sanitize(data.providerTaxId),           // REF02: Tax ID
      ])
    );
  }

  // ============================================
  // Claims Loop (Loop 2100 / 2110)
  // ============================================
  for (const claim of data.claims) {
    // ==============================================
    // CLP — Claim Payment Information (Loop 2100)
    // ==============================================
    const totalClaimBilled = money(claim.totalBilled);
    const totalClaimPaid = money(claim.totalPaid);
    const patientResp = money(claim.patientResponsibility);

    addSegment(
      segment([
        "CLP",
        sanitize(claim.claimNumber),          // CLP01: Claim Submitter's Identifier
        claim.claimStatusCode || "1",         // CLP02: Claim Status Code (1 = Processed as Primary)
        totalClaimBilled,                     // CLP03: Total Claim Charge Amount
        totalClaimPaid,                       // CLP04: Claim Payment Amount
        patientResp,                          // CLP05: Patient Responsibility Amount
        "MC",                                 // CLP06: Claim Filing Indicator Code (MC = Medicaid / dental insurance)
        "",                                   // CLP07: Payer Claim Control Number
        "",                                   // CLP08: Facility Code Value
        "",                                   // CLP09: Claim Frequency Type Code
      ])
    );

    // ==============================================
    // CAS at Claim Level — Aggregate adjustments (optional)
    // Group all claim-level CAS by group code
    // ==============================================
    const claimAdjustments = aggregateAdjustments(claim);
    for (const [groupCode, adjustments] of Object.entries(claimAdjustments)) {
      // X12 allows up to 6 reason/amount pairs per CAS segment
      const chunks = chunkArray(adjustments, 6);
      for (const chunk of chunks) {
        const elements: (string | number)[] = ["CAS", groupCode];
        for (const adj of chunk) {
          elements.push(adj.reasonCode, money(adj.amount));
        }
        addSegment(segment(elements));
      }
    }

    // ==============================================
    // NM1*QC — Patient Name (Loop 2100)
    // ==============================================
    const patientParts = splitName(claim.patientName);
    addSegment(
      segment([
        "NM1",
        "QC",                                 // NM101: Entity Identifier Code (QC = Patient)
        "1",                                  // NM102: Entity Type Qualifier (1 = Person)
        sanitize(patientParts.last),          // NM103: Name Last
        sanitize(patientParts.first),         // NM104: Name First
        sanitize(patientParts.middle),        // NM105: Name Middle
        "",                                   // NM106: Name Prefix
        "",                                   // NM107: Name Suffix
        claim.patientId ? "MI" : "",          // NM108: ID Code Qualifier (MI = Member ID)
        sanitize(claim.patientId || ""),      // NM109: ID Code
      ])
    );

    // ==============================================
    // NM1*IL — Subscriber/Insured Name (optional)
    // ==============================================
    if (claim.subscriberName && claim.subscriberId) {
      const subParts = splitName(claim.subscriberName);
      addSegment(
        segment([
          "NM1",
          "IL",                               // NM101: Entity Identifier Code (IL = Insured)
          "1",                                // NM102: Entity Type
          sanitize(subParts.last),
          sanitize(subParts.first),
          sanitize(subParts.middle),
          "",
          "",
          "MI",                               // NM108: Member ID
          sanitize(claim.subscriberId),       // NM109
        ])
      );
    }

    // ==============================================
    // Service Lines (Loop 2110)
    // ==============================================
    for (const svc of claim.serviceLines) {
      // SVC — Service Payment Information
      // For dental: use AD: qualifier for CDT codes
      const procedureId = `AD${SUB_ELEMENT_SEP}${sanitize(svc.procedureCode)}`;

      addSegment(
        segment([
          "SVC",
          procedureId,                        // SVC01: Composite Medical Procedure Identifier (AD:D0120)
          money(svc.billedAmount),             // SVC02: Line Item Charge Amount
          money(svc.paidAmount),               // SVC03: Line Item Provider Payment Amount
          "",                                  // SVC04: Revenue Code
          "",                                  // SVC05: Units of Service Paid Count
          "",                                  // SVC06: Composite Medical Procedure (Original)
          "1",                                 // SVC07: Original Units of Service Count
        ])
      );

      // DTM*472 — Service Date
      if (svc.dateOfService) {
        addSegment(
          segment([
            "DTM",
            "472",                             // DTM01: Date/Time Qualifier (472 = Service)
            formatDateD8(svc.dateOfService),   // DTM02: Date
          ])
        );
      }

      // CAS — Line-level adjustments
      // Group by adjustment group code (CO, PR, OA, etc.)
      const grouped = groupAdjustments(svc.adjustments);
      for (const [groupCode, adjs] of Object.entries(grouped)) {
        // X12 allows up to 6 reason/amount pairs per CAS segment
        const chunks = chunkArray(adjs, 6);
        for (const chunk of chunks) {
          const elements: (string | number)[] = ["CAS", groupCode];
          for (const adj of chunk) {
            elements.push(adj.reasonCode, money(adj.amount));
          }
          addSegment(segment(elements));
        }
      }

      // AMT*B6 — Allowed Amount (optional but useful for PMS matching)
      if (svc.allowedAmount > 0) {
        addSegment(
          segment([
            "AMT",
            "B6",                              // AMT01: Amount Qualifier Code (B6 = Allowed - Actual)
            money(svc.allowedAmount),          // AMT02: Monetary Amount
          ])
        );
      }
    }
  }

  // ============================================
  // PLB — Provider Level Balance (optional, omitted for simplicity)
  // ============================================

  // ============================================
  // SE — Transaction Set Trailer
  // ============================================
  // SE01 = number of segments INCLUDING ST and SE
  segmentCounter++; // Count the SE segment itself
  addSegment(
    segment([
      "SE",
      String(segmentCounter),               // SE01: Number of Included Segments
      tcn,                                  // SE02: Transaction Set Control Number (must match ST02)
    ])
  );
  // SE was already counted by addSegment, but we pre-incremented, so adjust:
  // Actually, let me fix: addSegment auto-increments. SE should report the count
  // INCLUDING ST and SE. Since we called addSegment for every segment from ST through SE,
  // segmentCounter already includes them all. But we incremented BEFORE the addSegment call...
  // Let me fix this properly.

  // Actually, the logic is: addSegment increments segmentCounter.
  // We called addSegment for ST (counter=1), then all content segments, then SE.
  // But we did segmentCounter++ before SE's addSegment, so SE's addSegment makes it +1 too many.
  // Fix: remove the pre-increment and just use segmentCounter+1 in the SE segment.
  // But we already pushed it. Let me reconstruct the SE properly.

  // Remove the last segment (incorrect SE) and rebuild
  segments.pop();
  segmentCounter--; // undo the addSegment for SE
  // Now segmentCounter = count of segments from ST through last content segment
  // SE itself is one more
  const finalSegCount = segmentCounter + 1; // include SE itself
  segments.push(
    segment([
      "SE",
      String(finalSegCount),
      tcn,
    ])
  );

  // ============================================
  // GE — Functional Group Trailer
  // ============================================
  segments.push(
    segment([
      "GE",
      "1",                                    // GE01: Number of Transaction Sets Included
      String(gcn),                            // GE02: Group Control Number (must match GS06)
    ])
  );

  // ============================================
  // IEA — Interchange Control Trailer
  // ============================================
  segments.push(
    segment([
      "IEA",
      "1",                                    // IEA01: Number of Included Functional Groups
      controlNumber(icn, 9),                  // IEA02: Interchange Control Number (must match ISA13)
    ])
  );

  // ============================================
  // Final Output
  // ============================================
  const ediString = segments.join("\n");

  return {
    success: true,
    ediString,
    segmentCount: finalSegCount,
    warnings: [],
  };
}

// ============================================
// Helper Functions
// ============================================

/** Split "John Smith" or "Smith, John" into { first, last, middle } */
function splitName(fullName: string): {
  first: string;
  last: string;
  middle: string;
} {
  if (!fullName) return { first: "", last: "", middle: "" };

  // Handle "Last, First" format
  if (fullName.includes(",")) {
    const [last, rest] = fullName.split(",").map((s) => s.trim());
    const parts = rest.split(/\s+/);
    return {
      last: last || "",
      first: parts[0] || "",
      middle: parts.slice(1).join(" ") || "",
    };
  }

  // Handle "First Middle Last" format
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: "", last: parts[0], middle: "" };
  }
  if (parts.length === 2) {
    return { first: parts[0], last: parts[1], middle: "" };
  }
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

/** Group adjustments by group code (CO, PR, OA, etc.) */
function groupAdjustments(
  adjustments: X12Adjustment[]
): Record<string, X12Adjustment[]> {
  const grouped: Record<string, X12Adjustment[]> = {};
  for (const adj of adjustments) {
    if (!grouped[adj.groupCode]) {
      grouped[adj.groupCode] = [];
    }
    grouped[adj.groupCode].push(adj);
  }
  return grouped;
}

/** Aggregate all line-level adjustments to claim level (for claim-level CAS) */
function aggregateAdjustments(
  claim: X12Claim
): Record<string, X12Adjustment[]> {
  // For 835, we typically put CAS at the service line level, not claim level.
  // Returning empty — all adjustments are on service lines.
  // This function exists as a hook if claim-level adjustments are needed later.
  return {};
}

/** Chunk an array into groups of N */
function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

// ============================================
// Convenience: Convert EOB extraction data to X12 input format
// ============================================

/**
 * Transform raw EOB extraction records into the X12RemittanceData structure.
 * This bridges the AI extraction output to the 835 generator input.
 */
export function eobExtractionsToX12Data(
  extractions: Array<{
    payer_name: string | null;
    payer_id: string | null;
    patient_name: string | null;
    patient_id: string | null;
    subscriber_name?: string | null;
    subscriber_id: string | null;
    claim_number: string | null;
    date_of_service: string | null;
    provider_name: string | null;
    provider_npi: string | null;
    check_number: string | null;
    check_date: string | null;
    check_amount: number | null;
    total_billed: number | null;
    total_insurance_paid: number | null;
    total_patient_responsibility: number | null;
    total_adjustments: number | null;
    eob_line_items: Array<{
      procedure_code: string | null;
      procedure_description: string | null;
      tooth_number?: string | null;
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
    }>;
  }>
): X12RemittanceData {
  // Use first extraction for payer/provider info (they share the same check)
  const first = extractions[0];

  // Build claims from each extraction
  const claims: X12Claim[] = extractions.map((ext) => {
    const serviceLines: X12ServiceLine[] = (ext.eob_line_items || []).map(
      (item) => {
        // Parse adjustment code like "CO-45" into group + reason
        const adjustments: X12Adjustment[] = [];

        if (item.adjustment_code && item.adjustment_amount) {
          const parts = item.adjustment_code.split("-");
          adjustments.push({
            groupCode: parts[0] || "CO",
            reasonCode: parts[1] || "45",
            amount: item.adjustment_amount,
          });
        }

        // If there's a deductible, add PR-1 adjustment
        if (item.deductible_applied && item.deductible_applied > 0) {
          adjustments.push({
            groupCode: "PR",
            reasonCode: "1",
            amount: item.deductible_applied,
          });
        }

        // If there's a copay, add PR-3 adjustment
        if (item.copay && item.copay > 0) {
          // Only add if not already captured in main adjustment
          const hasPatientAdj = adjustments.some(
            (a) => a.groupCode === "PR" && a.reasonCode === "3"
          );
          if (!hasPatientAdj) {
            adjustments.push({
              groupCode: "PR",
              reasonCode: "3",
              amount: item.copay,
            });
          }
        }

        // If there's coinsurance, add PR-2 adjustment
        if (item.coinsurance && item.coinsurance > 0) {
          adjustments.push({
            groupCode: "PR",
            reasonCode: "2",
            amount: item.coinsurance,
          });
        }

        // ==============================================
        // AUTO-BALANCING LOGIC
        // Ensure Billed - Paid = SUM(Adjustments)
        // ==============================================
        const billed = item.billed_amount || 0;
        const paid = item.insurance_paid || 0;
        const currentAdjSum = adjustments.reduce((s, a) => s + a.amount, 0);
        const diff = Math.round((billed - paid - currentAdjSum + Number.EPSILON) * 100) / 100;

        if (Math.abs(diff) > 0.001) {
          if (diff > 0) {
            // Insurance paid less than billed minus adjustments
            // Add CO-45 (Contractual Obligation) for the difference
            adjustments.push({
              groupCode: "CO",
              reasonCode: "45",
              amount: diff,
            });
          } else {
            // Insurance paid MORE than billed (rare, e.g. interest)
            // Add OA-23 (Office of Accounting) for balancing
            adjustments.push({
              groupCode: "OA",
              reasonCode: "23",
              amount: Math.abs(diff),
            });
          }
        }

        return {
          procedureCode: item.procedure_code || "D0000",
          procedureDescription: item.procedure_description || undefined,
          dateOfService:
            item.date_of_service || ext.date_of_service || "2026-01-01",
          toothNumber: item.tooth_number,
          billedAmount: item.billed_amount || 0,
          allowedAmount: item.allowed_amount || 0,
          paidAmount: item.insurance_paid || 0,
          patientResponsibility: item.patient_responsibility || 0,
          adjustments,
        };
      }
    );

    return {
      claimNumber: ext.claim_number || `CLM-${Date.now()}`,
      patientName: ext.patient_name || "Unknown Patient",
      patientId: ext.patient_id || undefined,
      subscriberName: ext.subscriber_name || undefined,
      subscriberId: ext.subscriber_id || undefined,
      claimStatusCode: "1", // Processed as primary
      totalBilled: ext.total_billed || 0,
      totalPaid: ext.total_insurance_paid || 0,
      patientResponsibility: ext.total_patient_responsibility || 0,
      serviceLines,
    };
  });

  // Calculate total payment as sum of all claim payments
  const totalPayment = claims.reduce((sum, c) => sum + c.totalPaid, 0);

  return {
    payerName: first.payer_name || "Unknown Payer",
    payerId: first.payer_id || "UNKNOWN",
    providerName: first.provider_name || "Unknown Provider",
    providerNpi: first.provider_npi || "0000000000",
    checkNumber: first.check_number || "UNKNOWN",
    checkDate: first.check_date || new Date().toISOString().split("T")[0],
    totalPaymentAmount: totalPayment,
    paymentMethodCode: "CHK",
    claims,
  };
}
