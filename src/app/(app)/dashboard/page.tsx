"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Files,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface BatchSummary {
  id: string;
  name: string;
  total_eobs: number;
  processed_eobs: number;
  approved_eobs: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    pendingReview: 0,
    totalExported: 0,
  });
  const router = useRouter();

  // Load recent batches when dashboard mounts
  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/eobs/batches");
        if (res.ok) {
          const data = await res.json();
          setBatches(data);
          
          // Calculate quick stats
          if (Array.isArray(data)) {
            const processed = data.reduce((acc, b) => acc + (b.processed_eobs || 0), 0);
            const pending = data.reduce((acc, b) => acc + ((b.total_eobs || 0) - (b.approved_eobs || 0)), 0);
            setStats(s => ({ ...s, totalProcessed: processed, pendingReview: pending }));
          }
        }
      } catch {
        // Failed to load batches — silently handled
      }
    }
    loadBatches();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      (f) => f.type === "application/pdf"
    );
    if (pdfFiles.length !== acceptedFiles.length) {
      toast.warning("Some files were skipped — only PDFs are accepted.");
    }
    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 200,
  });

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one PDF file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      // Extract text from PDFs completely in parallel on the client-side
      const pdfjsLib = await import("pdfjs-dist");
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }

      await Promise.all(
        selectedFiles.map(async (file) => {
          formData.append("files", file);
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              text += content.items.map((item: any) => item.str).join(" ") + "\n";
            }
            formData.append("texts", text);
          } catch {
            formData.append("texts", ""); 
          }
        })
      );

      const response = await fetch("/api/eobs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      toast.success(
        `Uploaded ${selectedFiles.length} files! Processing started.`
      );
      setSelectedFiles([]);
      router.push(`/batch/${data.batchId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function deleteBatch(batchId: string) {
    if (!confirm("Delete this batch and all its EOBs? This cannot be undone.")) return;
    setDeletingBatch(batchId);
    try {
      const res = await fetch(`/api/eobs/batches/${batchId}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete batch");
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      toast.success("Batch deleted successfully");
    } catch {
      toast.error("Failed to delete batch");
    } finally {
      setDeletingBatch(null);
    }
  }

  const statusColors: Record<string, string> = {
    processing: "bg-yellow-50 text-yellow-600 border-yellow-200",
    ready: "bg-blue-50 text-blue-600 border-blue-200",
    exported: "bg-emerald-50 text-emerald-600 border-emerald-200",
    archived: "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">
          Dashboard
        </h1>
        <p className="text-black/50 mt-1 font-medium">
          Upload EOB PDFs and manage your extractions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-black/5 shadow-sm shadow-black/5 rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black/50">Total Processed</p>
                <p className="text-4xl font-black text-black mt-1">
                  {stats.totalProcessed}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-black/5 shadow-sm shadow-black/5 rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black/50">Pending Review</p>
                <p className="text-4xl font-black text-black mt-1">
                  {stats.pendingReview}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-black/5 shadow-sm shadow-black/5 rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black/50">Total Exported</p>
                <p className="text-4xl font-black text-black mt-1">
                  {stats.totalExported}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Zone */}
      <Card className="bg-white border-black/5 shadow-sm shadow-black/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-black/5 bg-gray-50/50">
          <CardTitle className="text-black flex items-center gap-2 text-xl font-bold">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload EOB PDFs
          </CardTitle>
          <CardDescription className="text-black/50 font-medium">
            Drag and drop up to 200 PDF files at once, or click to browse.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer overflow-hidden
              transition-all duration-300 ease-out bg-gray-50/30
              ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-black/10 hover:border-black/30 hover:bg-gray-50"
              }
            `}
          >
            <input {...getInputProps()} />

            {selectedFiles.length === 0 ? (
              <div className="py-6 pointer-events-none">
                <div
                  className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center transition-all shadow-sm ${
                    isDragActive ? "bg-blue-100 scale-110" : "bg-white border border-black/5"
                  }`}
                >
                  <Upload
                    className={`w-10 h-10 transition-colors ${
                      isDragActive ? "text-blue-500" : "text-black/30"
                    }`}
                  />
                </div>
                <p className="text-black font-bold text-xl mb-2">
                  {isDragActive
                    ? "Drop your PDFs here..."
                    : "Drag & drop EOB PDFs here"}
                </p>
                <p className="text-black/40 text-sm font-medium">
                  or click to browse files (PDF only, max 200 files)
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mini Drop Area Header */}
                <div className="flex flex-col items-center justify-center pb-6 border-b border-dashed border-black/10">
                  <Upload className="w-8 h-8 mb-3 text-black/30" />
                  <p className="text-black/50 text-sm font-medium">
                    Drag & drop more PDFs here to add them to your batch
                  </p>
                </div>

                {/* Selected Files List (Click events stopped so they don't open the file browser) */}
                <div
                  className="space-y-4 cursor-default text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-black/50 font-medium">
                      <span className="font-bold text-black text-lg">
                        {selectedFiles.length}
                      </span>{" "}
                      file{selectedFiles.length !== 1 ? "s" : ""} selected
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-black/50 hover:text-black hover:bg-black/5 rounded-xl font-semibold"
                      onClick={() => setSelectedFiles([])}
                    >
                      Clear all
                    </Button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {selectedFiles.map((file, i) => (
                      <div
                         key={i}
                         className="flex items-center justify-between py-3 px-4 rounded-xl bg-white group border border-black/5 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <span className="text-sm font-semibold text-black truncate">
                            {file.name}
                          </span>
                          <span className="text-xs font-medium text-black/40 shrink-0">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-black/5 text-black/40 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-black hover:bg-black/80 text-white py-6 rounded-2xl shadow-xl shadow-black/10 border border-black transition-all hover:-translate-y-1 mt-6 text-lg font-bold"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-3" />
                        Upload & Extract ({selectedFiles.length} file
                        {selectedFiles.length !== 1 ? "s" : ""})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Batches */}
      <Card className="bg-white border-black/5 shadow-sm shadow-black/5 rounded-3xl">
        <CardHeader className="border-b border-black/5 bg-gray-50/50">
          <CardTitle className="text-black flex items-center gap-2 text-lg font-bold">
            <Files className="w-5 h-5 text-blue-500" />
            Recent Batches
          </CardTitle>
          <CardDescription className="text-black/50 font-medium">
            Your most recent EOB upload batches.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {batches.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-black/5 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-black/20" />
              </div>
              <p className="text-black/50 font-bold text-lg mb-1">No batches yet</p>
              <p className="text-black/40 text-sm font-medium">
                Upload your first EOB PDFs to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-6 hover:bg-gray-50 transition-all group"
                >
                  <Link
                    href={`/batch/${batch.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center shrink-0">
                      <Files className="w-6 h-6 text-black/60" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-black truncate">
                        {batch.name}
                      </p>
                      <p className="text-sm font-medium text-black/50 mt-1">
                        <span className="font-semibold text-black/70">{batch.total_eobs} EOBs</span> •{" "}
                        {new Date(batch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[batch.status]}`}
                    >
                      {batch.status}
                    </Badge>
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      disabled={deletingBatch === batch.id}
                      className="p-2 rounded-xl text-black/20 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                      title="Delete batch"
                    >
                      {deletingBatch === batch.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <Link href={`/batch/${batch.id}`} className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-sm group-hover:bg-black group-hover:text-white transition-all group-hover:border-black">
                      <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-white transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
