"use client";

import { useState, use } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

type ExportFormat = "835" | "dentrix" | "eaglesoft" | "open_dental";

const exportOptions = [
  {
    id: "835" as const,
    name: "X12 835 (ERA)",
    description: "ANSI X12 005010X221A1 — auto-posts in all PMS",
    detail: "Recommended. Works with Dentrix, Open Dental, and Eaglesoft ERA import.",
    icon: Shield,
    color: "from-blue-500 to-cyan-500 text-white shadow-blue-500/20",
    recommended: true,
  },
  {
    id: "dentrix" as const,
    name: "Dentrix CSV",
    description: "Legacy CSV format for manual import",
    detail: "Fallback if your Dentrix version doesn't support ERA.",
    icon: FileSpreadsheet,
    color: "from-gray-100 to-gray-200 text-gray-700",
    recommended: false,
  },
  {
    id: "eaglesoft" as const,
    name: "Eaglesoft CSV",
    description: "Patterson Eaglesoft CSV format",
    detail: "Fallback if your Eaglesoft version doesn't support ERA.",
    icon: FileSpreadsheet,
    color: "from-gray-100 to-gray-200 text-gray-700",
    recommended: false,
  },
  {
    id: "open_dental" as const,
    name: "Open Dental CSV",
    description: "Open Dental CSV format",
    detail: "Fallback if you prefer CSV over automatic ERA processing.",
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

export default function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("835");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationReport, setValidationReport] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setValidationErrors([]);
    setValidationReport(null);

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
        setValidationReport(data.validationReport || null);
        toast.error("Export blocked: fix balancing errors first");
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
        selectedFormat === "835"
          ? "835 ERA file exported — ready for PMS import!"
          : "CSV exported successfully!"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  const selectedOption = exportOptions.find((o) => o.id === selectedFormat)!;

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/batch/${id}`}>
          <Button
            variant="outline"
            size="icon"
            className="border-black/5 text-black hover:bg-gray-50 shadow-sm rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 text-black/60" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Export to PMS</h1>
          <p className="text-black/50 font-medium text-sm mt-1">
            Generate an 835 ERA file or legacy CSV for your PMS.
          </p>
        </div>
      </div>

      {/* Primary: 835 ERA */}
      <div>
        <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">
          Recommended Format
        </h2>
        <button
          onClick={() => {
            setSelectedFormat("835");
            setExported(false);
            setValidationErrors([]);
          }}
          className={`w-full p-6 bg-white rounded-3xl border text-left transition-all shadow-sm ${
            selectedFormat === "835"
              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/5"
              : "border-black/5 hover:border-black/15 hover:shadow-md"
          }`}
        >
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-400">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 pt-1.5">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-black text-lg">
                  X12 835 (ERA)
                </h3>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold px-3 py-1">
                  Industry Standard
                </Badge>
              </div>
              <p className="text-sm font-semibold text-black/60 mt-2">
                ANSI X12 005010X221A1 Electronic Remittance Advice
              </p>
              <p className="text-sm font-medium text-black/50 mt-3 leading-relaxed max-w-xl">
                Auto-posts in Dentrix, Open Dental, and Eaglesoft. Includes
                full CLP/SVC/CAS segments with mathematically balanced
                adjustment codes. Ingests exactly like a clearinghouse-generated ERA.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Legacy CSV Options */}
      <div>
        <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">
          Legacy CSV (Fallback Options)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportOptions
            .filter((o) => o.id !== "835")
            .map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedFormat(opt.id);
                  setExported(false);
                  setValidationErrors([]);
                }}
                className={`p-5 rounded-2xl border bg-white text-left transition-all shadow-sm ${
                  selectedFormat === opt.id
                    ? "border-black ring-1 ring-black shadow-md"
                    : "border-black/5 hover:border-black/15 hover:shadow-md"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 border border-black/5">
                  <FileSpreadsheet className="w-5 h-5 text-black/40" />
                </div>
                <h3 className="font-bold text-black text-sm mb-1">
                  {opt.name}
                </h3>
                <p className="text-xs font-medium text-black/50 leading-relaxed">{opt.description}</p>
              </button>
            ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="bg-red-50 border-red-200 shadow-sm rounded-3xl overflow-hidden mt-8">
          <CardHeader className="pb-4 pt-6 border-b border-red-100 bg-red-100/50">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base font-bold">
              <XCircle className="w-5 h-5" />
              Export Blocked — Balancing Errors
            </CardTitle>
            <CardDescription className="text-red-600/80 text-sm font-medium mt-1">
              The following mathematical discrepancies must be fixed before the
              835 can be generated. Go back to the review screen and correct the
              flagged values.
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
                {selectedFormat === "835"
                  ? ".835 file for PMS ERA import"
                  : ".csv file for manual import"}
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
            <div className="flex items-start gap-3 p-5 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
              <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-blue-800/80 leading-relaxed">
                <strong className="font-bold text-blue-900">Pre-export validation</strong> will verify: BPR total = Σ(CLP paid),
                each CLP = Σ(SVC paid), and each SVC line balances as Billed −
                Adjustments = Paid. If any number is off by even $0.01, export
                will be blocked to ensure PMS compatibility.
              </p>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-black hover:bg-black/80 text-white rounded-xl py-7 font-bold text-lg shadow-xl shadow-black/10 transition-all border border-black group"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
            ) : (
              <Download className="w-5 h-5 mr-3 text-white/70 group-hover:text-white transition-colors" />
            )}
            {exporting
              ? "Validating & Generating..."
              : `Export ${selectedOption.name}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
