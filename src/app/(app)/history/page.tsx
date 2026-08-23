"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  FileText,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Flag,
  ArrowRight,
  Filter,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface EOBHistoryItem {
  id: string;
  patient_name: string | null;
  payer_name: string | null;
  claim_number: string | null;
  date_of_service: string | null;
  check_amount: number | null;
  total_insurance_paid: number | null;
  review_status: string;
  reviewed_at: string | null;
  created_at: string;
  confidence_score: number | null;
  batch_id: string;
  batches: {
    id: string;
    name: string;
  } | null;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  approved: {
    icon: CheckCircle,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-50 text-red-600 border-red-200",
    label: "Rejected",
  },
  flagged: {
    icon: Flag,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    label: "Flagged",
  },
  pending: {
    icon: Clock,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    label: "Pending",
  },
};

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [eobs, setEobs] = useState<EOBHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deletingEob, setDeletingEob] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/eobs/history");
        if (res.ok) {
          const data = await res.json();
          setEobs(data);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    let items = eobs;

    if (statusFilter) {
      items = items.filter((e) => e.review_status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.patient_name?.toLowerCase().includes(q) ||
          e.payer_name?.toLowerCase().includes(q) ||
          e.claim_number?.toLowerCase().includes(q) ||
          e.batches?.name?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [eobs, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { approved: 0, rejected: 0, flagged: 0, pending: 0 };
    for (const e of eobs) {
      if (counts[e.review_status] !== undefined) {
        counts[e.review_status]++;
      }
    }
    return counts;
  }, [eobs]);

  async function deleteEob(eobId: string) {
    if (!confirm("Delete this EOB record? This cannot be undone.")) return;
    setDeletingEob(eobId);
    try {
      const res = await fetch(`/api/eobs/${eobId}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEobs((prev) => prev.filter((e) => e.id !== eobId));
      toast.success("EOB deleted successfully");
    } catch {
      toast.error("Failed to delete EOB");
    } finally {
      setDeletingEob(null);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">History</h1>
        <p className="text-black/50 mt-1 font-medium">
          Search and browse all EOB extractions.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
          <Input
            placeholder="Search by patient, payer, claim #, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 py-6 bg-white border border-black/10 rounded-2xl text-black placeholder:text-black/30 font-medium shadow-sm hover:border-black/20 focus:border-black/30 transition-all font-base text-base"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl px-4 py-5 text-sm font-bold shadow-sm transition-all border ${
              statusFilter === null
                ? "bg-black text-white border-black hover:bg-black/80"
                : "bg-white text-black/50 border-black/10 hover:border-black/20 hover:text-black"
            }`}
            onClick={() => setStatusFilter(null)}
          >
            <Filter className="w-4 h-4 mr-2" />
            All ({eobs.length})
          </Button>
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isActive = statusFilter === key;
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className={`rounded-xl px-4 py-5 text-sm font-bold shadow-sm transition-all border ${
                  isActive
                    ? "bg-black text-white border-black hover:bg-black/80"
                    : "bg-white text-black/50 border-black/10 hover:border-black/20 hover:text-black"
                }`}
                onClick={() => setStatusFilter(isActive ? null : key)}
              >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? "text-white" : ""}`} />
                {cfg.label} ({statusCounts[key] || 0})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <CardContent className="py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-black/5 mx-auto mb-6 flex items-center justify-center">
              {search || statusFilter ? (
                <Search className="w-10 h-10 text-black/20" />
              ) : (
                <Clock className="w-10 h-10 text-black/20" />
              )}
            </div>
            <p className="text-black font-bold text-xl mb-2">
              {search || statusFilter
                ? "No EOBs match your search"
                : "No history yet"}
            </p>
            <p className="text-black/40 text-sm font-medium">
              {search || statusFilter
                ? "Try adjusting your search or filters"
                : "Your processed EOBs will appear here"}
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-black/5">
            {filtered.map((eob) => {
              const cfg = statusConfig[eob.review_status] || statusConfig.pending;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={eob.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 transition-all group"
                >
                  <Link
                    href={`/batch/${eob.batch_id}`}
                    className="flex items-center gap-5 min-w-0 flex-1 mb-4 sm:mb-0"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-black truncate mb-1">
                        {eob.patient_name || "Unknown Patient"}
                      </p>
                      <p className="text-sm text-black/50 font-medium truncate">
                        <span className="text-black/70 font-semibold">{eob.payer_name || "Unknown Payer"}</span>
                        {eob.claim_number ? ` • ${eob.claim_number}` : ""}
                        {eob.date_of_service ? ` • ${eob.date_of_service}` : ""}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:ml-6">
                    {eob.check_amount != null && (
                      <span className="text-base font-mono text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                        ${eob.check_amount.toFixed(2)}
                      </span>
                    )}
                    <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                      {cfg.label}
                    </Badge>
                    <span className="text-sm font-medium text-black/40 hidden md:block w-24 text-right">
                      {new Date(eob.reviewed_at || eob.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteEob(eob.id)}
                      disabled={deletingEob === eob.id}
                      className="p-2.5 rounded-xl text-black/20 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                      title="Delete EOB"
                    >
                      {deletingEob === eob.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                    <Link href={`/batch/${eob.batch_id}`} className="w-10 h-10 rounded-full border border-black/5 bg-white shadow-sm flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5 text-black/40 group-hover:text-white transition-colors" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
