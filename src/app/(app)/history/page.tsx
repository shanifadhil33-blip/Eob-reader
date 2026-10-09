"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BackLink } from "@/components/back-link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { OptionMenu } from "@/components/option-menu";
import { formatBatchTitle } from "@/lib/format-batch";

interface EOBHistoryItem {
  id: string;
  patient_name: string | null;
  payer_name: string | null;
  claim_number: string | null;
  date_of_service: string | null;
  check_amount: number | null;
  review_status: string;
  created_at: string;
  batch_id: string;
}

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Patient A–Z" },
  { value: "amount", label: "Amount, high to low" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "flagged", label: "Flagged" },
  { value: "rejected", label: "Rejected" },
];

function sortItems(items: EOBHistoryItem[], sort: string) {
  const copy = [...items];
  copy.sort((a, b) => {
    const nameA = a.patient_name || "";
    const nameB = b.patient_name || "";
    if (sort === "oldest") return a.created_at.localeCompare(b.created_at) || nameA.localeCompare(nameB);
    if (sort === "name") return nameA.localeCompare(nameB) || a.created_at.localeCompare(b.created_at);
    if (sort === "amount") {
      return (b.check_amount || 0) - (a.check_amount || 0) || nameA.localeCompare(nameB);
    }
    return b.created_at.localeCompare(a.created_at) || nameA.localeCompare(nameB);
  });
  return copy;
}

function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "newest";
  const status = searchParams.get("status") || "all";
  const query = searchParams.get("q") || "";
  const [eobs, setEobs] = useState<EOBHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<EOBHistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/eobs/history");
        if (res.ok) {
          const data: unknown = await res.json();
          if (Array.isArray(data)) setEobs(data as EOBHistoryItem[]);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadHistory();
  }, []);

  function replaceParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) params.set(key, value);
    router.replace(`/history?${params.toString()}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    let items = eobs;
    if (status !== "all") items = items.filter((item) => item.review_status === status);
    if (query.trim()) {
      const needle = query.toLowerCase();
      items = items.filter((item) =>
        [item.patient_name, item.payer_name, item.claim_number]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle))
      );
    }
    return sortItems(items, sort);
  }, [eobs, status, query, sort]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/eobs/${pendingDelete.id}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setEobs((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      toast.error("Could not delete that EOB.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard" />
      <div>
        <h1 className="font-display text-4xl">History</h1>
        <p className="mt-2 text-[#614f38]">Every extraction on this account.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block sm:min-w-56 sm:flex-1">
          <span className="mb-1 block text-xs font-medium text-[#614f38]">Search</span>
          <input
            value={query}
            onChange={(event) => replaceParams({ q: event.target.value })}
            placeholder="Patient, payer, or claim"
            className="h-11 w-full rounded-xl border border-[#d1b996] bg-[#f2efe9] px-3 text-sm"
          />
        </label>
        <OptionMenu
          label="Sort"
          value={sortOptions.some((option) => option.value === sort) ? sort : "newest"}
          options={sortOptions}
          onChange={(value) => replaceParams({ sort: value })}
        />
        <OptionMenu
          label="Status"
          value={statusOptions.some((option) => option.value === status) ? status : "all"}
          options={statusOptions}
          onChange={(value) => replaceParams({ status: value })}
        />
      </div>
      <p className="text-sm text-[#614f38]">
        {loading
          ? "Loading…"
          : filtered.length === 0
            ? "Nothing matches."
            : `${filtered.length} shown: ${filtered
                .map((item) => item.patient_name || "Unnamed")
                .slice(0, 8)
                .join(", ")}`}
      </p>
      {!loading && filtered.length > 0 ? (
        <ul className="divide-y divide-[#d1b996] rounded-2xl bg-[#eee0c7]">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/batch/${item.batch_id}`} className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {item.patient_name || "Unnamed patient"}
                </span>
                <span className="block truncate text-sm text-[#614f38]">
                  {item.payer_name || "Unknown payer"} · {item.review_status}
                  {item.check_amount != null ? ` · $${item.check_amount.toFixed(2)}` : ""}
                </span>
                <span className="block truncate text-sm text-[#614f38]">
                  {formatBatchTitle(item.created_at)}
                </span>
              </Link>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center text-[#8c3a2f]"
                aria-label={`Delete ${item.patient_name || "EOB"}`}
                onClick={() => setPendingDelete(item)}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this EOB?"
        body="The extracted row is removed. This cannot be undone."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function HistoryRoute() {
  return (
    <Suspense fallback={<p className="text-sm text-[#614f38]">Loading history…</p>}>
      <HistoryPage />
    </Suspense>
  );
}
