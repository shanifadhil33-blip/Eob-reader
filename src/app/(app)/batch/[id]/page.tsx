"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Flag,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LineItem {
  id: string;
  procedure_code: string | null;
  procedure_description: string | null;
  tooth_number: string | null;
  date_of_service: string | null;
  billed_amount: number | null;
  allowed_amount: number | null;
  insurance_paid: number | null;
  patient_responsibility: number | null;
  deductible_applied: number | null;
  adjustment_amount: number | null;
  adjustment_code: string | null;
  confidence_score: number | null;
}

interface EOBRecord {
  id: string;
  patient_name: string | null;
  patient_id: string | null;
  payer_name: string | null;
  claim_number: string | null;
  date_of_service: string | null;
  provider_name: string | null;
  check_number: string | null;
  check_date: string | null;
  check_amount: number | null;
  total_billed: number | null;
  total_allowed: number | null;
  total_insurance_paid: number | null;
  total_patient_responsibility: number | null;
  total_adjustments: number | null;
  confidence_score: number | null;
  review_status: string;
  pdf_storage_path: string;
  eob_line_items: LineItem[];
}

interface BatchData {
  id: string;
  name: string;
  total_eobs: number;
  processed_eobs: number;
  approved_eobs: number;
  status: string;
  eob_extractions: EOBRecord[];
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (!score) return <Badge variant="outline" className="text-black/30 border-black/10">N/A</Badge>;
  
  const pct = Math.round(score * 100);
  if (pct >= 95) {
    return (
      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border">
        {pct}%
      </Badge>
    );
  } else if (pct >= 80) {
    return (
      <Badge className="bg-amber-50 text-amber-600 border-amber-200 border">
        {pct}%
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-50 text-red-600 border-red-200 border">
        {pct}%
      </Badge>
    );
  }
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-blue-50 text-blue-600 border-blue-200",
    approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    flagged: "bg-amber-50 text-amber-600 border-amber-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <Badge variant="outline" className={styles[status] || "text-black/40 border-black/20"}>
      {status}
    </Badge>
  );
}

export default function BatchReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEobIndex, setCurrentEobIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBatch();
  }, [id]);

  useEffect(() => {
    async function fetchPdfUrl() {
      if (!batch) return;
      const eob = batch.eob_extractions[currentEobIndex];
      if (!eob || !eob.pdf_storage_path) return;

      setPdfUrl(null); // Clear while loading
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("eob-pdfs")
        .createSignedUrl(eob.pdf_storage_path, 3600);

      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl);
      }
    }
    fetchPdfUrl();
  }, [batch, currentEobIndex]);

  async function fetchBatch() {
    try {
      const res = await fetch(`/api/eobs/batches/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch batch");
      const data = await res.json();
      setBatch(data);
    } catch (error) {
      toast.error("Failed to load batch");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(eobId: string, action: "approve" | "reject" | "flag") {
    setActionLoading(action);

    // Optimistic update: immediately reflect the new status in the UI
    const statusMap = { approve: "approved", reject: "rejected", flag: "flagged" } as const;
    const newStatus = statusMap[action];

    setBatch((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        approved_eobs: prev.eob_extractions.filter((e) =>
          e.id === eobId ? newStatus === "approved" : e.review_status === "approved"
        ).length,
        eob_extractions: prev.eob_extractions.map((e) =>
          e.id === eobId ? { ...e, review_status: newStatus } : e
        ),
      };
    });

    try {
      const res = await fetch(`/api/eobs/${eobId}/${action}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      window.dispatchEvent(new Event("eob-batches-changed"));

      toast.success(`EOB ${action}ed successfully`);
    } catch {
      // Revert optimistic update on failure
      toast.error(`Failed to ${action} EOB`);
      await fetchBatch();
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#614f38]">Loading batch…</p>;
  }

  if (!batch) {
    return (
      <div>
        <BackLink href="/dashboard" />
        <p className="mt-4 text-[#614f38]">That batch was not found.</p>
      </div>
    );
  }

  if (batch.eob_extractions.length === 0) {
    return (
      <div>
        <BackLink href="/dashboard" />
        <h2 className="font-display mt-4 text-3xl">
          {batch.status === "processing" ? "Still reading" : "Nothing to review"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#614f38]">
          {batch.status === "processing"
            ? "The draft is still being written. You can leave and come back from the dashboard."
            : "No text could be turned into a claim. A scanned PDF is skipped. Try a digital EOB that already has a text layer."}
        </p>
      </div>
    );
  }

  const currentEob = batch.eob_extractions[currentEobIndex];
  const approvedCount = batch.eob_extractions.filter(
    (e) => e.review_status === "approved"
  ).length;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#eee0c7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <BackLink href="/dashboard" />
          <h1 className="font-display mt-2 truncate text-2xl" title={batch.name}>{batch.name}</h1>
            <p className="text-sm text-[#614f38]">
              {approvedCount}/{batch.eob_extractions.length} approved ·{" "}
              {batch.eob_extractions.filter((e) => e.review_status === "pending").length} pending
            </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Dialog>
            <DialogTrigger 
              render={
                <Button
                  variant="outline"
                  size="default"
                  className="border-black/10 text-black hover:bg-gray-50 shadow-sm font-bold rounded-xl px-3 sm:px-4"
                />
              }
            >
              <FileText className="mr-2 size-4 text-[#416c6f]" />
              PDF
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-black/10 flex flex-col rounded-3xl shadow-2xl">
              <DialogHeader className="p-5 border-b border-black/5 bg-gray-50/50 shrink-0 flex flex-row items-center justify-between pointer-events-none">
                <DialogTitle className="text-black flex items-center gap-2 text-lg font-bold">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {currentEob?.pdf_storage_path.split("/").pop()}
                </DialogTitle>
                <span className="sr-only">PDF</span>
              </DialogHeader>
              <div className="flex-1 relative w-full h-full bg-gray-100">
                {pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="absolute inset-0 w-full h-full border-0"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-black/40 pt-10">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                    <p className="text-base font-bold">Loading PDF securely...</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Link
            href={`/batch/${id}/export`}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "rounded-xl bg-[#416c6f] px-4 text-[#f2efe9]"
            )}
          >
            <Download className="mr-2 size-4" />
            Export
          </Link>
        </div>
      </div>

      {/* EOB Navigation Card */}
      <div className="flex items-center justify-between p-3 bg-white border border-black/5 rounded-3xl shadow-sm">
        <Button
          variant="outline"
          size="sm"
          className="text-black/60 hover:text-black border-black/5 rounded-xl font-bold shadow-sm px-2.5 sm:px-4"
          disabled={currentEobIndex === 0}
          onClick={() => setCurrentEobIndex((prev) => prev - 1)}
        >
          <ChevronLeft className="w-4 h-4 sm:mr-1" />
          Previous
        </Button>
            <div className="flex flex-wrap items-center justify-center gap-1.5 px-2">
          {batch.eob_extractions.map((eob, i) => (
            <button
              key={eob.id}
              onClick={() => setCurrentEobIndex(i)}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                i === currentEobIndex
                  ? eob.review_status === "approved"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border-emerald-600"
                    : eob.review_status === "rejected"
                    ? "bg-red-500 text-white shadow-md shadow-red-500/20 border-red-600"
                    : "bg-blue-600 text-white shadow-md shadow-blue-500/20 border-blue-700"
                  : eob.review_status === "approved"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : eob.review_status === "rejected"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : eob.review_status === "flagged"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-white border border-black/10 text-black/40 hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-black/60 hover:text-black border-black/5 rounded-xl font-bold shadow-sm px-2.5 sm:px-4"
          disabled={currentEobIndex === batch.eob_extractions.length - 1}
          onClick={() => setCurrentEobIndex((prev) => prev + 1)}
        >
          Next
          <ChevronRight className="w-4 h-4 sm:ml-1" />
        </Button>
      </div>

      {/* Active EOB Content Block */}
      {currentEob && (
        <div className="space-y-6 pb-32">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 bg-white p-4 sm:p-6 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-black/5 shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base sm:text-xl text-black font-extrabold truncate max-w-[180px] sm:max-w-none" title={currentEob.pdf_storage_path.split("/").pop()}>
                    {currentEob.pdf_storage_path.split("/").pop()}
                  </span>
                  {getStatusBadge(currentEob.review_status)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              <Button
                size="default"
                variant={currentEob.review_status === "flagged" ? "default" : "outline"}
                className={`rounded-xl font-bold shadow-sm border px-3 sm:px-4 py-2 text-xs sm:text-sm h-10 ${
                  currentEob.review_status === "flagged"
                    ? "bg-amber-500 text-white shadow-inner border-amber-600 hover:bg-amber-600"
                    : "border-black/5 text-amber-600 hover:bg-amber-50 bg-white"
                }`}
                disabled={actionLoading !== null}
                onClick={() => currentEob.review_status !== "flagged" && handleAction(currentEob.id, "flag")}
              >
                {actionLoading === "flag" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <Flag className="w-4 h-4 mr-1 sm:mr-2" />
                )}
                {currentEob.review_status === "flagged" ? "Flagged" : "Flag"}
              </Button>
              <Button
                size="default"
                variant={currentEob.review_status === "rejected" ? "default" : "outline"}
                className={`rounded-xl font-bold shadow-sm border px-3 sm:px-4 py-2 text-xs sm:text-sm h-10 ${
                  currentEob.review_status === "rejected"
                    ? "bg-red-500 text-white shadow-inner border-red-600 hover:bg-red-600"
                    : "border-black/5 text-red-600 hover:bg-red-50 bg-white"
                }`}
                disabled={actionLoading !== null}
                onClick={() => currentEob.review_status !== "rejected" && handleAction(currentEob.id, "reject")}
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1 sm:mr-2" />
                )}
                {currentEob.review_status === "rejected" ? "Rejected" : "Reject"}
              </Button>
              <Button
                size="default"
                className={`rounded-xl font-bold shadow-md border px-3 sm:px-4 py-2 text-xs sm:text-sm h-10 ${
                  currentEob.review_status === "approved"
                    ? "bg-emerald-600 text-white shadow-inner border-emerald-700 hover:bg-emerald-700"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                }`}
                disabled={actionLoading !== null}
                onClick={() => currentEob.review_status !== "approved" && handleAction(currentEob.id, "approve")}
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                )}
                {currentEob.review_status === "approved" ? "Approved" : "Approve"}
              </Button>
            </div>
          </div>

            {/* EOB Summary (Horizontal layout) */}
            <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-black/5 bg-gray-50/50">
                <CardTitle className="text-black text-base font-bold">EOB Summary Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Patient</span>
                  <span className="text-black font-bold text-base">{currentEob.patient_name || "—"}</span>
                </div>
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Payer</span>
                  <span className="text-black font-bold text-base">{currentEob.payer_name || "—"}</span>
                </div>
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Date of Service</span>
                  <span className="text-black font-bold text-base">{currentEob.date_of_service || "—"}</span>
                </div>
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Provider</span>
                  <span className="text-black font-bold text-base">{currentEob.provider_name || "—"}</span>
                </div>
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Claim #</span>
                  <span className="text-black font-mono font-bold text-sm bg-gray-50 px-2 py-1 rounded inline-block border border-black/5">{currentEob.claim_number || "—"}</span>
                </div>
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Check #</span>
                  <span className="text-black font-mono font-bold text-sm bg-gray-50 px-2 py-1 rounded inline-block border border-black/5">{currentEob.check_number || "—"}</span>
                </div>
                <div>
                  <span className="text-black/40 block mb-1 font-semibold text-xs uppercase tracking-wider">Check Amount</span>
                  <span className="text-emerald-600 font-black font-mono text-xl bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 inline-block">
                    ${currentEob.check_amount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-black/40 block mb-2 font-semibold text-xs uppercase tracking-wider">Confidence</span>
                  <div className="w-fit">
                    <ConfidenceBadge score={currentEob.confidence_score} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Line Items Section */}
            <h2 className="font-display text-2xl">Line items</h2>
            <ul className="space-y-2">
              {currentEob.eob_line_items.map((item, i) => (
                <li key={item.id || i} className="rounded-2xl bg-[#eee0c7] p-4 text-sm">
                  <p className="font-medium">
                    {item.procedure_code || "—"} · {item.procedure_description || "No description"}
                  </p>
                  <p className="mt-1 text-[#614f38]">
                    Billed ${item.billed_amount?.toFixed(2) || "0.00"} · Allowed ${item.allowed_amount?.toFixed(2) || "0.00"} · Paid ${item.insurance_paid?.toFixed(2) || "0.00"} · Patient ${item.patient_responsibility?.toFixed(2) || "0.00"}
                    {item.tooth_number ? ` · Tooth ${item.tooth_number}` : ""}
                    {item.adjustment_code ? ` · ${item.adjustment_code}` : ""}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#614f38]">
              Totals: billed ${currentEob.total_billed?.toFixed(2) || "0.00"} · paid ${currentEob.total_insurance_paid?.toFixed(2) || "0.00"} · patient ${currentEob.total_patient_responsibility?.toFixed(2) || "0.00"}
            </p>
          </div>
        )}
      </div>
  );
}
