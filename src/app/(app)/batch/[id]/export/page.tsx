"use client";

import { Suspense, useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { BackLink } from "@/components/back-link";
import { OptionMenu } from "@/components/option-menu";
import { carryQuery } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/client";

type ExportFormat = "835" | "dentrix" | "eaglesoft" | "open_dental";

const exportOptions = [
  {
    id: "835" as const,
    name: "X12 835 (ERA)",
    description: "Download an X12 835 file. This app does not post it into practice software.",
    icon: Shield,
    color: "bg-[#416c6f]",
    recommended: true,
  },
  {
    id: "dentrix" as const,
    name: "Dentrix CSV",
    description: "Download a CSV formatted for your practice software's import.",
    icon: FileSpreadsheet,
    color: "from-gray-100 to-gray-200 text-gray-700",
    recommended: false,
  },
  {
    id: "eaglesoft" as const,
    name: "Eaglesoft CSV",
    description: "Download a CSV formatted for your practice software's import.",
    icon: FileSpreadsheet,
    color: "from-gray-100 to-gray-200 text-gray-700",
    recommended: false,
  },
  {
    id: "open_dental" as const,
    name: "Open Dental CSV",
    description: "Download a CSV formatted for your practice software's import.",
    icon: FileSpreadsheet,
    color: "from-gray-100 to-gray-200 text-gray-700",
    recommended: false,
  },
];

interface ValidationError {
  level: string;
  message: string;
  expected: number;
  actual: number;
  difference: number;
  patientName?: string;
  procedureCode?: string;
}

const plainExportErrors = new Set([
  "No approved EOBs found in this batch",
  "Couldn't export. Try again.",
  "Couldn't build the 835 file. Try again.",
]);

const csvLabels: Record<string, string> = {
  dentrix: "Dentrix",
  eaglesoft: "Eaglesoft",
  open_dental: "Open Dental",
};

function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const carried = carryQuery(searchParams.get("from"), searchParams.get("back"));
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("835");
  const [preferredCsv, setPreferredCsv] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        const { data: practice } = await supabase
          .from("practices")
          .select("default_pms")
          .eq("auth_id", data.user.id)
          .single();
        const label = practice?.default_pms ? csvLabels[practice.default_pms] : undefined;
        if (label) setPreferredCsv(label);
      } catch {
        // The export still works if the saved CSV preference cannot be read.
      }
    })();
  }, []);

  async function handleExport() {
    setExporting(true);
    setValidationErrors([]);

    try {
      const res = await fetch(`/api/export/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selectedFormat }),
      });

      // Handle validation failure (422)
      if (res.status === 422) {
        const data = await res.json();
        setValidationErrors(data.validationErrors || []);
        setExporting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const ext = selectedFormat === "835" ? ".835" : ".csv";
      const prefix = selectedFormat === "835" ? "ERA" : `eob-${selectedFormat}`;
      a.download = `${prefix}-${new Date().toISOString().split("T")[0]}${ext}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExported(true);
      toast.success(
        selectedFormat === "835" ? "835 file downloaded." : "CSV downloaded."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(plainExportErrors.has(message) ? message : "Couldn't export. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const selectedOption = exportOptions.find((o) => o.id === selectedFormat)!;

  return (
    <div className="max-w-3xl space-y-6">
      <BackLink href={`/batch/${id}${carried}`} label="Review" />
      <div>
        <h1 className="font-display text-4xl">Export</h1>
        <p className="mt-2 text-sm text-[#614f38]">
          Approved claims only. An 835 can add CO-45 or OA-23 so the file balances.
          These layouts are a starting point, not a promise that a practice-management system will post them.
          {preferredCsv ? ` Settings lists ${preferredCsv} as your default CSV.` : ""}
        </p>
      </div>
      <OptionMenu
        label="File"
        value={selectedFormat}
        options={exportOptions.map((option) => ({ value: option.id, label: option.name }))}
        onChange={(value) => {
          setSelectedFormat(value as ExportFormat);
          setExported(false);
          setValidationErrors([]);
        }}
        widthClass="w-56"
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="bg-red-50 border-red-200 shadow-sm rounded-3xl overflow-hidden mt-8">
          <CardHeader className="pb-4 pt-6 border-b border-red-100 bg-red-100/50">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base font-bold">
              <XCircle className="w-5 h-5" />
              Export Blocked — Balancing Errors
            </CardTitle>
            <CardDescription className="text-red-600/80 text-sm font-medium mt-1">
              The totals do not balance, so the file was not downloaded. This
              screen cannot edit the draft. Go back and reject the claim if the
              numbers look wrong.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6 p-6">
            {validationErrors.map((err, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-red-100 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-900 mb-1">{err.message}</p>
                    <p className="text-sm font-medium text-red-600/80 font-mono bg-red-50 px-2 py-1 rounded inline-block mt-1">
                      Expected: ${err.expected.toFixed(2)} | Actual: $
                      {err.actual.toFixed(2)} | Difference: $
                      {Math.abs(err.difference).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden mt-8">
        <CardHeader className="p-6 pb-4 border-b border-black/5 bg-gray-50/50">
          <CardTitle className="text-black text-lg font-bold">Ready to Export</CardTitle>
          <CardDescription className="text-black/50 font-medium">
            Only approved EOBs will be included.
            {selectedFormat === "835" &&
              " The 835 file will be validated for mathematical accuracy before export."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-black/5 bg-white shadow-sm">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedOption.color} flex items-center justify-center shrink-0 border border-black/5 shadow-sm`}
            >
              <selectedOption.icon className={`w-6 h-6 ${selectedFormat === '835' ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-black mb-1">
                {selectedOption.name}
              </p>
              <p className="text-sm font-medium text-black/50">
                {selectedOption.description}
              </p>
            </div>
            {exported && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-bold">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Downloaded
              </Badge>
            )}
          </div>

          {selectedFormat === "835" && (
            <div className="rounded-2xl bg-[#b9cecf] p-4 text-sm leading-relaxed text-[#281a0d]">
              Before the file downloads, the totals are checked: the payment
              equals the sum of claims, and each line is billed minus
              adjustments. If a number is off, the export stops and the reason
              is shown here.
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="h-11 w-full rounded-xl bg-[#416c6f] text-[#f2efe9]"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
            ) : (
              <Download className="w-5 h-5 mr-3 text-white/70 group-hover:text-white transition-colors" />
            )}
            {exporting ? "Preparing the file…" : `Export ${selectedOption.name}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExportRoute(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-40 rounded-2xl bg-[#eee0c7]" aria-busy="true" />}>
      <ExportPage {...props} />
    </Suspense>
  );
}
