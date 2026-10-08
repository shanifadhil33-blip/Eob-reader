"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BackLink } from "@/components/back-link";
import { OptionMenu } from "@/components/option-menu";

interface PracticeData {
  id: string;
  name: string | null;
  email: string;
  default_pms: string;
}

const pmsOptions = [
  { value: "dentrix", label: "Dentrix" },
  { value: "eaglesoft", label: "Eaglesoft" },
  { value: "open_dental", label: "Open Dental" },
];

export default function SettingsPage() {
  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [defaultPms, setDefaultPms] = useState("dentrix");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchPractice() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("practices")
        .select("id, name, email, default_pms")
        .eq("auth_id", user.id)
        .single();
      if (data) {
        setPractice(data);
        setName(data.name || "");
        setDefaultPms(data.default_pms || "dentrix");
      }
      setLoading(false);
    }
    void fetchPractice();
  }, []);

  async function handleSave() {
    if (!practice) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("practices")
      .update({
        name,
        default_pms: defaultPms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", practice.id);
    setSaving(false);
    if (error) toast.error("Could not save settings.");
    else toast.success("Saved.");
  }

  async function submitFeedback() {
    if (!feedbackMessage.trim()) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "suggestion", message: feedbackMessage }),
      });
      if (!res.ok) throw new Error("Failed");
      setFeedbackMessage("");
      toast.success("Thanks. The note was sent.");
    } catch {
      toast.error("Could not send that note.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#614f38]">Loading settings…</p>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <BackLink href="/dashboard" />
      <div>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-2 text-[#614f38]">Practice name and the CSV you prefer.</p>
      </div>

      <section className="space-y-4 rounded-2xl bg-[#eee0c7] p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#614f38]">Practice name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#d1b996] bg-[#f2efe9] px-3 text-sm"
          />
        </label>
        <p className="text-sm text-[#614f38]">Signed in as {practice?.email}</p>
        <OptionMenu
          label="Default CSV"
          value={defaultPms}
          options={pmsOptions}
          onChange={setDefaultPms}
          widthClass="w-52"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-11 rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9] disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </section>

      <section className="space-y-3 rounded-2xl bg-[#eee0c7] p-5 text-sm leading-relaxed text-[#614f38]">
        <h2 className="font-display text-2xl text-[#281a0d]">About this account</h2>
        <p>PDFs stay in a private bucket for this Google user. Other accounts cannot read them.</p>
        <p>Nothing is deleted on a schedule. Delete a batch from the dashboard when you want it gone.</p>
        <p>This is a portfolio project. It is not a HIPAA product and it does not keep an audit log.</p>
      </section>

      <section className="space-y-3 rounded-2xl bg-[#eee0c7] p-5">
        <h2 className="font-display text-2xl">A note for Adhil</h2>
        <textarea
          value={feedbackMessage}
          onChange={(event) => setFeedbackMessage(event.target.value)}
          rows={4}
          placeholder="What should the next version do?"
          className="w-full rounded-xl border border-[#d1b996] bg-[#f2efe9] p-3 text-sm"
        />
        <button
          type="button"
          onClick={submitFeedback}
          disabled={submittingFeedback || !feedbackMessage.trim()}
          className="h-11 rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9] disabled:opacity-70"
        >
          {submittingFeedback ? "Sending…" : "Send note"}
        </button>
      </section>
    </div>
  );
}
