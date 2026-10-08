"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { pageHasText, textFromItems } from "@/lib/pdf/text-layer";

interface BatchSummary {
  id: string;
  name: string;
  total_eobs: number;
  processed_eobs: number;
  approved_eobs: number;
  status: string;
  created_at: string;
}

async function readPdfText(file: File) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts: string[] = [];
  let textPages = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = textFromItems(content.items);
    if (pageHasText(pageText)) textPages += 1;
    parts.push(pageText);
  }
  return { text: parts.join("\n"), textPages };
}

export default function DashboardPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BatchSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/eobs/batches", { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (Array.isArray(data)) setBatches(data as BatchSummary[]);
      } catch {
        // The empty list stays visible.
      }
    }
    void loadBatches();
    const onChange = () => {
      void loadBatches();
    };
    window.addEventListener("eob-batches-changed", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener("eob-batches-changed", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length !== acceptedFiles.length) {
      toast.message("Only PDF files were kept.");
    }
    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
    setScanMessage(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 200,
    noClick: false,
  });

  async function handleUpload() {
    if (selectedFiles.length === 0 || uploading) return;
    setUploading(true);
    setScanMessage(null);

    try {
      const formData = new FormData();
      const scanned: string[] = [];
      for (const file of selectedFiles) {
        try {
          const layer = await readPdfText(file);
          if (layer.textPages === 0) {
            scanned.push(file.name);
            continue;
          }
          formData.append("files", file);
          formData.append("texts", layer.text);
        } catch {
          // A worker or parse error is not a scan. The server reads the file itself.
          formData.append("files", file);
          formData.append("texts", "");
        }
      }

      if (scanned.length > 0) {
        setScanMessage(
          `${scanned.join(", ")} ${scanned.length === 1 ? "looks" : "look"} scanned. EOB Reader can only read PDFs that already have text. Use a digital EOB, not a photo or scan.`
        );
      }

      if (!formData.has("files")) {
        setSelectedFiles([]);
        return;
      }

      const response = await fetch("/api/eobs/upload", {
        method: "POST",
        body: formData,
      });
      const payload: { error?: string; batchId?: string; errors?: string[]; processed?: number } =
        await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Upload failed");
      }
      if (payload.errors?.length) {
        toast.message(payload.errors[0]);
      }
      setSelectedFiles([]);
      if (payload.batchId && (payload.processed ?? 0) > 0) {
        router.push(`/batch/${payload.batchId}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/eobs/batches/${pendingDelete.id}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setBatches((prev) => prev.filter((batch) => batch.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      toast.error("Could not delete that batch.");
    } finally {
      setDeleting(false);
    }
  }

  const processed = batches.reduce((sum, batch) => sum + (batch.processed_eobs || 0), 0);
  const exported = batches.filter((batch) => batch.status === "exported").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="mt-2 text-[#614f38]">
          Your uploads only. The public sample stays on the demo page.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Batches", String(batches.length)],
          ["EOBs read", String(processed)],
          ["Exported batches", String(exported)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-[#eee0c7] p-4">
            <p className="text-sm text-[#614f38]">{label}</p>
            <p className="font-display mt-1 text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-[#eee0c7] p-4 sm:p-6">
        <h2 className="font-display text-2xl">Upload</h2>
        <p className="mt-1 text-sm text-[#614f38]">
          Text-based PDFs only. Drop them in the box.
        </p>
        <div
          {...getRootProps()}
          className={`mt-4 rounded-2xl border border-dashed p-8 text-center ${
            isDragActive ? "border-[#416c6f] bg-[#b9cecf]" : "border-[#b28c62] bg-[#f2efe9]"
          }`}
        >
          <input {...getInputProps()} />
          {selectedFiles.length === 0 ? (
            <p className="text-[#614f38]">
              {isDragActive ? "Drop the PDFs here." : "Drop EOB PDFs here, or tap to choose files."}
            </p>
          ) : (
            <div className="space-y-3 text-left" onClick={(event) => event.stopPropagation()}>
              <p className="text-sm text-[#614f38]">
                {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} ready
              </p>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-[#eee0c7] px-3"
                  >
                    <span className="truncate text-sm">{file.name}</span>
                    <button
                      type="button"
                      className="h-11 shrink-0 px-2 text-sm text-[#8c3a2f]"
                      onClick={() =>
                        setSelectedFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="h-11 w-full rounded-xl bg-[#416c6f] text-sm font-medium text-[#f2efe9] disabled:opacity-70"
              >
                {uploading ? "Reading…" : "Extract"}
              </button>
            </div>
          )}
        </div>
        {scanMessage ? (
          <p className="mt-3 text-sm leading-relaxed text-[#8c3a2f]" role="status">
            {scanMessage}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-2xl">Recent batches</h2>
        {batches.length === 0 ? (
          <p className="mt-3 text-sm text-[#614f38]">
            No batches yet. Drop a text-based EOB PDF in the box above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#d1b996] rounded-2xl bg-[#eee0c7]">
            {batches.map((batch) => (
              <li key={batch.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/batch/${batch.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{batch.name}</span>
                  <span className="block text-sm text-[#614f38]">
                    {batch.processed_eobs} read · {batch.approved_eobs} approved · {batch.status}
                  </span>
                </Link>
                <button
                  type="button"
                  className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm text-[#8c3a2f]"
                  aria-label={`Delete ${batch.name}`}
                  onClick={() => setPendingDelete(batch)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this batch?"
        body="The batch and its extracted rows are removed. This cannot be undone."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
      {uploading ? <Loader2 className="sr-only animate-spin" /> : null}
    </div>
  );
}
