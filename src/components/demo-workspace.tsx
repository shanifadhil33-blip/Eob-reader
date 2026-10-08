"use client";

import { useMemo, useState } from "react";
import { OptionMenu } from "@/components/option-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DEMO_BATCH_NAME,
  claimToRecord,
  initialDemoClaims,
  type DemoClaim,
  type ReviewStatus,
} from "@/lib/demo/sample-batch";
import { generateCSV } from "@/lib/export/dentrix";
import {
  eobExtractionsToX12Data,
  generateX12835,
} from "@/lib/export/x12-generator";

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

const formatOptions = [
  { value: "835", label: "X12 835" },
  { value: "dentrix", label: "Dentrix CSV" },
  { value: "eaglesoft", label: "Eaglesoft CSV" },
  { value: "open_dental", label: "Open Dental CSV" },
];

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function sortClaims(claims: DemoClaim[], sort: string) {
  const copy = [...claims];
  copy.sort((a, b) => {
    if (sort === "oldest") {
      const byDate = a.created_at.localeCompare(b.created_at);
      return byDate || a.patient_name.localeCompare(b.patient_name);
    }
    if (sort === "name") {
      const byName = a.patient_name.localeCompare(b.patient_name);
      return byName || a.created_at.localeCompare(b.created_at);
    }
    if (sort === "amount") {
      const byAmount = b.check_amount - a.check_amount;
      return byAmount || a.patient_name.localeCompare(b.patient_name);
    }
    const byDate = b.created_at.localeCompare(a.created_at);
    return byDate || a.patient_name.localeCompare(b.patient_name);
  });
  return copy;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DemoWorkspace() {
  const [claims, setClaims] = useState<DemoClaim[]>(initialDemoClaims);
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState("juniper");
  const [format, setFormat] = useState("835");
  const [resetOpen, setResetOpen] = useState(false);

  const visible = useMemo(() => {
    const filtered =
      status === "all" ? claims : claims.filter((claim) => claim.review_status === status);
    return sortClaims(filtered, sort);
  }, [claims, sort, status]);

  const selected = visible.find((claim) => claim.id === selectedId) ?? visible[0] ?? null;
  const approved = claims.filter((claim) => claim.review_status === "approved");

  const preview = useMemo(() => {
    if (approved.length === 0) return { text: "", error: "" };
    const records = approved.map((claim) => ({
      ...claimToRecord(claim),
      eob_line_items: claim.line_items,
    }));
    if (format === "835") {
      const result = generateX12835(eobExtractionsToX12Data(records));
      if (!result.success || !result.ediString) {
        return { text: "", error: result.errors?.join(" ") || "Could not build the 835." };
      }
      return { text: result.ediString, error: "" };
    }
    const csv = generateCSV(
      approved.map(claimToRecord),
      format as "dentrix" | "eaglesoft" | "open_dental"
    );
    return { text: csv, error: "" };
  }, [approved, format]);

  function setStatusFor(id: string, review_status: ReviewStatus) {
    setClaims((current) =>
      current.map((claim) => (claim.id === id ? { ...claim, review_status } : claim))
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#c69753] bg-[#eee0c7] p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#614f38]">
          Fictional sample
        </p>
        <h1 className="font-display mt-1 text-3xl text-[#281a0d] sm:text-4xl">
          {DEMO_BATCH_NAME}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#614f38]">
          Maple Quill, Cedar Brook, Rowan Pebble, and Juniper Moss are made-up
          patients. Nothing on this page is saved, and it never appears in a
          signed-in account. Approve a claim, then preview the 835 or CSV.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <OptionMenu label="Sort" value={sort} options={sortOptions} onChange={setSort} />
        <OptionMenu
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(next) => {
            setStatus(next);
            setSelectedId("");
          }}
        />
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="h-11 rounded-xl px-3 text-sm text-[#614f38] sm:ml-auto"
        >
          Reset sample
        </button>
      </div>

      <p className="text-sm text-[#614f38]">
        Showing {visible.length} {visible.length === 1 ? "claim" : "claims"}
        {visible.length > 0 ? `: ${visible.map((claim) => claim.patient_name).join(", ")}` : "."}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-[#eee0c7] p-6 text-sm text-[#614f38]">
          No sample claims match that status. Choose All statuses to see the batch again.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((claim) => {
            const active = selected?.id === claim.id;
            return (
              <li key={claim.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(claim.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left ${
                    active
                      ? "border-[#416c6f] bg-[#b9cecf]"
                      : "border-[#d1b996] bg-[#eee0c7]"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{claim.patient_name}</span>
                    <span className="block text-sm text-[#614f38]">
                      {claim.payer_name} · {claim.date_of_service}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-medium">{money(claim.check_amount)}</span>
                    <span className="block text-sm capitalize text-[#614f38]">
                      {claim.review_status}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <section className="rounded-2xl border border-[#d1b996] bg-[#eee0c7] p-4 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[#614f38]">Review</p>
          <h2 className="font-display mt-1 text-2xl">{selected.patient_name}</h2>
          <p className="mt-2 text-sm text-[#614f38]">{selected.note}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[#614f38]">Payer</dt>
              <dd>{selected.payer_name}</dd>
            </div>
            <div>
              <dt className="text-[#614f38]">Claim</dt>
              <dd>{selected.claim_number}</dd>
            </div>
            <div>
              <dt className="text-[#614f38]">Service date</dt>
              <dd>{selected.date_of_service}</dd>
            </div>
            <div>
              <dt className="text-[#614f38]">Paid</dt>
              <dd>{money(selected.total_insurance_paid)}</dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2">
            {selected.line_items.map((item) => (
              <li
                key={item.procedure_code}
                className="rounded-xl bg-[#f2efe9] p-3 text-sm"
              >
                <p className="font-medium">
                  {item.procedure_code} · {item.procedure_description}
                </p>
                <p className="mt-1 text-[#614f38]">
                  Billed {money(item.billed_amount || 0)} · Paid{" "}
                  {money(item.insurance_paid || 0)} · Patient{" "}
                  {money(item.patient_responsibility || 0)}
                  {item.tooth_number ? ` · Tooth ${item.tooth_number}` : ""}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                ["flag", "Flag"],
                ["reject", "Reject"],
                ["approve", "Approve"],
              ] as const
            ).map(([action, label]) => {
              const next =
                action === "flag" ? "flagged" : action === "reject" ? "rejected" : "approved";
              const current = selected.review_status === next;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => setStatusFor(selected.id, next)}
                  className={`h-11 rounded-xl text-sm font-medium ${
                    current
                      ? "bg-[#416c6f] text-[#f2efe9]"
                      : "border border-[#d1b996] bg-[#f2efe9] text-[#281a0d]"
                  }`}
                >
                  {current ? label : label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#d1b996] bg-[#f2efe9] p-4 sm:p-6">
        <h2 className="font-display text-2xl">Export preview</h2>
        <p className="mt-2 text-sm text-[#614f38]">
          Only approved claims are included. The 835 file can add a CO-45 or
          OA-23 line so the totals balance. Check it before you rely on it.
          This download is generated in the browser from the sample.
        </p>
        <div className="mt-4">
          <OptionMenu
            label="File"
            value={format}
            options={formatOptions}
            onChange={setFormat}
            widthClass="w-52"
          />
        </div>
        {approved.length === 0 ? (
          <p className="mt-4 text-sm text-[#614f38]">
            Approve at least one claim to preview an export.
          </p>
        ) : preview.error ? (
          <p className="mt-4 text-sm text-[#8c3a2f]">{preview.error}</p>
        ) : (
          <>
            <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-[#eee0c7] p-3 text-xs leading-relaxed">
              {preview.text}
            </pre>
            <button
              type="button"
              className="mt-4 h-11 rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
              onClick={() =>
                downloadText(
                  format === "835" ? "sample-era.835" : `sample-${format}.csv`,
                  preview.text
                )
              }
            >
              Download {format === "835" ? "835" : "CSV"}
            </button>
          </>
        )}
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Reset the sample?"
        body="Statuses go back to the original fictional batch. Nothing was saved."
        confirmLabel="Reset"
        busyLabel="Resetting…"
        busy={false}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setClaims(initialDemoClaims);
          setSort("newest");
          setStatus("all");
          setSelectedId("juniper");
          setFormat("835");
          setResetOpen(false);
        }}
      />
    </div>
  );
}
