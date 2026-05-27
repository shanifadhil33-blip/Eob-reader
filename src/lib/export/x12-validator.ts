// ============================================
// X12 835 Validator — Pre-Export Balancing Rules
// ANSI X12 005010X221A1
// ============================================
//
// This module enforces the strict mathematical balancing rules required
// by the 835 standard before any EDI string is ever generated. If the
// math doesn't tie out to the penny, PMS systems will throw fatal errors.

export interface ValidationError {
  level: "transaction" | "claim" | "service_line";
  claimIndex?: number;
  serviceLineIndex?: number;
  patientName?: string;
  procedureCode?: string;
  message: string;
  expected: number;
  actual: number;
  difference: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface X12ServiceLine {
  procedureCode: string; // CDT code, e.g. "D0120"
  procedureDescription?: string;
  dateOfService: string; // YYYY-MM-DD
  toothNumber?: string | null;
  billedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  patientResponsibility: number;
  adjustments: X12Adjustment[];
  remarkCodes?: string[];
}

export interface X12Adjustment {
  groupCode: string; // CO, PR, OA, PI, CR
  reasonCode: string; // 1, 2, 3, 45, etc.
  amount: number;
}

export interface X12Claim {
  claimNumber: string;
  patientName: string;
  patientId?: string;
  subscriberName?: string;
  subscriberId?: string;
  patientDob?: string;
  claimStatusCode: string; // "1" = processed as primary, "2" = processed as secondary, etc.
  totalBilled: number;
  totalPaid: number;
  patientResponsibility: number;
  serviceLines: X12ServiceLine[];
}

export interface X12RemittanceData {
  // Payer
  payerName: string;
  payerId: string;
  payerAddress?: string;
  payerCity?: string;
  payerState?: string;
  payerZip?: string;

  // Payee (Provider)
  providerName: string;
  providerNpi: string;
  providerTaxId?: string;
  providerAddress?: string;
  providerCity?: string;
  providerState?: string;
  providerZip?: string;

  // Payment Info
  checkNumber: string;
  checkDate: string; // YYYY-MM-DD
  totalPaymentAmount: number;
  paymentMethodCode: string; // "CHK" = check, "ACH" = EFT

  // Claims
  claims: X12Claim[];
}

// Round to 2 decimal places — critical for financial math
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Validates the complete remittance data against X12 835 balancing rules.
 *
 * Rule 1: BPR total == SUM of all CLP paid amounts
 * Rule 2: CLP paid == SUM of all SVC paid amounts within that claim
 * Rule 3: For each SVC: Billed - SUM(CAS adjustments) == Paid
 *
 * Returns a ValidationResult. If valid is false, the 835 MUST NOT be generated.
 */
export function validateRemittance(data: X12RemittanceData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // ==============================================
  // Basic data validation
  // ==============================================
  if (!data.checkNumber) {
    warnings.push("Check number is missing. TRN segment will use placeholder.");
  }
  if (!data.providerNpi || data.providerNpi.length !== 10) {
    warnings.push(
      `Provider NPI "${data.providerNpi}" may be invalid (expected 10 digits).`
    );
  }
  if (!data.payerName) {
    warnings.push("Payer name is missing.");
  }
  if (data.claims.length === 0) {
    errors.push({
      level: "transaction",
      message: "No claims found in remittance data.",
      expected: 1,
      actual: 0,
      difference: 1,
    });
    return { valid: false, errors, warnings };
  }

  // ==============================================
  // RULE 1: Transaction Balance
  // BPR amount (Total Check) MUST EQUAL SUM of all CLP paid amounts
  // ==============================================
  const sumClaimPaid = round2(
    data.claims.reduce((sum, claim) => sum + claim.totalPaid, 0)
  );
  const bprAmount = round2(data.totalPaymentAmount);

  if (Math.abs(bprAmount - sumClaimPaid) > 0.001) {
    errors.push({
      level: "transaction",
      message: `Transaction balance failed: BPR amount ($${bprAmount.toFixed(2)}) does not equal sum of all CLP paid amounts ($${sumClaimPaid.toFixed(2)}).`,
      expected: bprAmount,
      actual: sumClaimPaid,
      difference: round2(bprAmount - sumClaimPaid),
    });
  }

  // ==============================================
  // Per-Claim Validation
  // ==============================================
  data.claims.forEach((claim, claimIdx) => {
    // Basic claim validation
    if (!claim.claimNumber) {
      warnings.push(
        `Claim #${claimIdx + 1} (${claim.patientName}): Missing claim number.`
      );
    }
    if (claim.serviceLines.length === 0) {
      errors.push({
        level: "claim",
        claimIndex: claimIdx,
        patientName: claim.patientName,
        message: `Claim "${claim.claimNumber}" for ${claim.patientName} has no service lines.`,
        expected: 1,
        actual: 0,
        difference: 1,
      });
      return;
    }

    // ==============================================
    // RULE 2: Claim Balance
    // CLP paid == SUM of all SVC paid amounts
    // ==============================================
    const sumSvcPaid = round2(
      claim.serviceLines.reduce((sum, svc) => sum + svc.paidAmount, 0)
    );
    const clpPaid = round2(claim.totalPaid);

    if (Math.abs(clpPaid - sumSvcPaid) > 0.001) {
      errors.push({
        level: "claim",
        claimIndex: claimIdx,
        patientName: claim.patientName,
        message: `Claim balance failed for "${claim.claimNumber}" (${claim.patientName}): CLP paid ($${clpPaid.toFixed(2)}) does not equal sum of SVC paid ($${sumSvcPaid.toFixed(2)}).`,
        expected: clpPaid,
        actual: sumSvcPaid,
        difference: round2(clpPaid - sumSvcPaid),
      });
    }

    // ==============================================
    // RULE 3: Line-Item Balance (per SVC)
    // Billed - SUM(CAS adjustments) == Paid
    // ==============================================
    claim.serviceLines.forEach((svc, svcIdx) => {
      const sumAdjustments = round2(
        svc.adjustments.reduce((sum, adj) => sum + adj.amount, 0)
      );
      const expectedPaid = round2(svc.billedAmount - sumAdjustments);
      const actualPaid = round2(svc.paidAmount);

      if (Math.abs(expectedPaid - actualPaid) > 0.001) {
        errors.push({
          level: "service_line",
          claimIndex: claimIdx,
          serviceLineIndex: svcIdx,
          patientName: claim.patientName,
          procedureCode: svc.procedureCode,
          message: `Line-item balance failed: ${svc.procedureCode} for ${claim.patientName} — Billed ($${svc.billedAmount.toFixed(2)}) - Adjustments ($${sumAdjustments.toFixed(2)}) = $${expectedPaid.toFixed(2)}, but Paid is $${actualPaid.toFixed(2)}.`,
          expected: expectedPaid,
          actual: actualPaid,
          difference: round2(expectedPaid - actualPaid),
        });
      }

      // Validate adjustment group codes
      svc.adjustments.forEach((adj) => {
        const validGroups = ["CO", "PR", "OA", "PI", "CR"];
        if (!validGroups.includes(adj.groupCode)) {
          warnings.push(
            `${svc.procedureCode} (${claim.patientName}): Unknown adjustment group code "${adj.groupCode}". Valid codes: ${validGroups.join(", ")}.`
          );
        }
        if (adj.amount < 0) {
          warnings.push(
            `${svc.procedureCode} (${claim.patientName}): Negative adjustment amount ($${adj.amount.toFixed(2)}) for ${adj.groupCode}-${adj.reasonCode}. This is unusual.`
          );
        }
      });

      // Warn if no adjustments but billed != paid
      if (
        svc.adjustments.length === 0 &&
        Math.abs(svc.billedAmount - svc.paidAmount) > 0.001
      ) {
        warnings.push(
          `${svc.procedureCode} (${claim.patientName}): Billed ($${svc.billedAmount.toFixed(2)}) != Paid ($${svc.paidAmount.toFixed(2)}) but no adjustment segments exist. This will produce an unbalanced SVC line.`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors into a human-readable report for the UI
 */
export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push("✅ All balancing rules passed. 835 file is ready for export.");
  } else {
    lines.push(
      `❌ EXPORT BLOCKED: ${result.errors.length} balancing error(s) found.\n`
    );
    result.errors.forEach((err, i) => {
      lines.push(`  Error ${i + 1} [${err.level.toUpperCase()}]:`);
      lines.push(`    ${err.message}`);
      lines.push(
        `    Difference: $${Math.abs(err.difference).toFixed(2)}\n`
      );
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`\n⚠️ ${result.warnings.length} warning(s):`);
    result.warnings.forEach((w) => lines.push(`  • ${w}`));
  }

  return lines.join("\n");
}
