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
import { sortOrderedItems } from "@/lib/list-order";

interface HistoryBatch {
  id: string;
  created_at: string;
}

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
  batches: HistoryBatch | HistoryBatch[] | null;
}

function batchTimestamp(item: EOBHistoryItem) {
  const batch = Array.isArray(item.batches) ? item.batches[0] : item.batches;
  return batch?.created_at || item.created_at;
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

function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "newest";
  const status = searchParams.get("status") || "all";
  const query = searchParams.get("q") || "";
  const [eobs, setEobs] = useState<EOBHistoryItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EOBHistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/eobs/history");
        if (!res.ok) throw new Error("load");
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("load");
        setEobs(data as EOBHistoryItem[]);
        setLoadError(false);
      } catch {
        setLoadError(true);
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
    let items = eobs ?? [];
    if (status !== "all") items = items.filter((item) => item.review_status === status);
    if (query.trim()) {
      const needle = query.toLowerCase();
      items = items.filter((item) =>
        [item.patient_name, item.payer_name, item.claim_number]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle))
      );
    }
    return sortOrderedItems(items, sort);
  }, [eobs, status, query, sort]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/eobs/${pendingDelete.id}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setEobs((prev) => prev?.filter((item) => item.id !== pendingDelete.id) ?? prev);
      setPendingDelete(null);
    } catch {
      toast.error("Could not delete that EOB.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard" label="Dashboard" />
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
          widthClass="w-56"
        />
        <OptionMenu
          label="Status"
          value={statusOptions.some((option) => option.value === status) ? status : "all"}
          options={statusOptions}
          onChange={(value) => replaceParams({ status: value })}
        />
      </div>
      {eobs === null && !loadError ? (
        <div className="space-y-3 rounded-2xl bg-[#eee0c7] p-4" aria-busy="true" aria-label="Loading history">
          <div className="h-4 w-40 rounded bg-[#d1b996]" />
          <div className="h-4 w-64 rounded bg-[#d1b996]" />
          <div className="h-4 w-52 rounded bg-[#d1b996]" />
        </div>
      ) : loadError && eobs === null ? (
        <div className="rounded-2xl bg-[#eee0c7] p-4">
          <p className="text-sm text-[#8c3a2f]">Could not load history.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
          >
            Try again
          </button>
        </div>
      ) : (
      <p className="text-sm text-[#614f38]">
        {eobs?.length === 0
          ? "No extractions yet. They show up here after you upload from the dashboard."
          : filtered.length === 0
            ? "Nothing matches."
            : `${filtered.length} shown: ${filtered
                .map((item) => item.patient_name || "Unnamed")
                .slice(0, 8)
                .join(", ")}`}
      </p>
      )}
      {eobs !== null && eobs.length > 0 && filtered.length === 0 ? (
        <button
          type="button"
          onClick={() => replaceParams({ status: "all", q: "" })}
          className="inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
        >
          Clear filters
        </button>
      ) : null}
      {eobs !== null && filtered.length > 0 ? (
        <ul className="divide-y divide-[#d1b996] rounded-2xl bg-[#eee0c7]">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/batch/${item.batch_id}?from=history${searchParams.toString() ? `&back=${encodeURIComponent(searchParams.toString())}` : ""}`} className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {item.patient_name || "Unnamed patient"}
                </span>
                <span className="block truncate text-sm text-[#614f38]">
                  {item.payer_name || "Unknown payer"} · {item.review_status}
                  {item.check_amount != null ? ` · $${item.check_amount.toFixed(2)}` : ""}
                </span>
                <span className="block truncate text-sm text-[#614f38]">
                  {formatBatchTitle(batchTimestamp(item))}
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
        destructive
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
    <Suspense
      fallback={
        <div className="space-y-3 rounded-2xl bg-[#eee0c7] p-4" aria-busy="true" aria-label="Loading history">
          <div className="h-4 w-40 rounded bg-[#d1b996]" />
          <div className="h-4 w-64 rounded bg-[#d1b996]" />
          <div className="h-4 w-52 rounded bg-[#d1b996]" />
        </div>
      }
    >
      <HistoryPage />
    </Suspense>
  );
}
