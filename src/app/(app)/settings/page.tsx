"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Shield,
  Building2,
  Loader2,
  Save,
  Pencil,
  MessageSquare,
  Send,
  LogOut,
  ExternalLink,
  Crown,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface PracticeData {
  id: string;
  name: string | null;
  email: string;
  subscription_status: string;
  trial_end_date: string;
  default_pms: string;
  polar_customer_id: string | null;
}

export default function SettingsPage() {
  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [defaultPms, setDefaultPms] = useState("dentrix");
  const [loggingOut, setLoggingOut] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Feedback state
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [pastFeedback, setPastFeedback] = useState<any[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchPractice();
    loadFeedback();
  }, []);

  // Handle upgrade success redirect
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to Pro! Your account has been upgraded.");
      // Re-fetch practice to get updated status
      setTimeout(() => fetchPractice(), 1500);
      // Clean URL
      router.replace("/settings");
    }
  }, [searchParams]);

  async function fetchPractice() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (data) {
      setPractice(data);
      setName(data.name || "");
      setDefaultPms(data.default_pms || "dentrix");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!practice) return;
    setSaving(true);

    const { error } = await supabase
      .from("practices")
      .update({
        name,
        default_pms: defaultPms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", practice.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved!");
      setPractice((prev) => prev ? { ...prev, name, default_pms: defaultPms } : null);
      setIsEditing(false);
    }
    setSaving(false);
  }

  async function loadFeedback() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setPastFeedback(data);
      }
    } catch {
      // Feedback table might not exist yet — that's okay
    }
  }

  async function submitFeedback() {
    if (!feedbackMessage.trim()) {
      toast.error("Please write your feedback before submitting.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "suggestion",
          message: feedbackMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success("Thank you for your feedback!");
      setFeedbackMessage("");
      setFeedbackSubmitted(true);
      loadFeedback();
      setTimeout(() => setFeedbackSubmitted(false), 5000);
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      // Redirect to Polar checkout
      const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID || "";
      window.location.href = `/api/checkout?productId=${productId}`;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setUpgrading(false);
    }
  }

  async function handleManageSubscription() {
    try {
      window.location.href = "/api/billing/portal";
    } catch {
      toast.error("Failed to open billing portal.");
    }
  }

  const trialDaysRemaining = practice
    ? Math.max(
        0,
        Math.ceil(
          (new Date(practice.trial_end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">Settings</h1>
        <p className="text-black/50 mt-1 font-medium">
          Manage your practice settings and subscription.
        </p>
      </div>

      {/* Practice Info */}
      <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-black/5 p-6 rounded-t-3xl">
          <CardTitle className="text-black flex items-center gap-2 text-lg font-bold">
            <Building2 className="w-5 h-5 text-blue-500" />
            Practice Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2.5">
            <Label className="text-black/60 text-sm font-semibold">Practice / Organization Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Smith's Dental"
              disabled={!isEditing}
              className="bg-white border-black/10 text-black placeholder:text-black/30 disabled:opacity-50 disabled:bg-gray-50 shadow-sm rounded-xl py-5 font-medium"
            />
          </div>
          <div className="space-y-2.5">
            <Label className="text-black/60 text-sm font-semibold">Email</Label>
            <Input
              value={practice?.email || ""}
              disabled
              className="bg-gray-50 border-black/5 text-black/50 rounded-xl py-5 font-medium"
            />
          </div>
          <div className="space-y-2.5">
            <Label className="text-black/60 text-sm font-semibold">Default PMS for Export</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "dentrix", label: "Dentrix" },
                { id: "eaglesoft", label: "Eaglesoft" },
                { id: "open_dental", label: "Open Dental" },
              ].map((pms) => (
                <button
                  key={pms.id}
                  onClick={() => setDefaultPms(pms.id)}
                  disabled={!isEditing}
                  className={`py-4 px-3 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                    defaultPms === pms.id
                      ? "border-blue-500 bg-blue-50 text-blue-600 shadow-blue-500/10"
                      : "border-black/10 bg-white text-black/50 hover:bg-gray-50"
                  } ${!isEditing && "opacity-60 cursor-not-allowed border-black/5"}`}
                >
                  {pms.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-black/5">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-bold shadow-sm"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Settings
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 font-bold"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setName(practice?.name || "");
                    setDefaultPms(practice?.default_pms || "dentrix");
                  }}
                  variant="ghost"
                  className="text-black/50 hover:text-black rounded-xl font-bold"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className={`border-black/5 shadow-sm rounded-3xl overflow-hidden ${
        practice?.subscription_status === "pro"
          ? "bg-gradient-to-b from-amber-50 to-white"
          : "bg-white"
      }`}>
        <CardHeader className={`border-b border-black/5 p-6 rounded-t-3xl ${practice?.subscription_status === "pro" ? "bg-amber-100/50" : "bg-gray-50/50"}`}>
          <CardTitle className="text-black flex items-center gap-2 text-lg font-bold">
            {practice?.subscription_status === "pro" ? (
              <Crown className="w-5 h-5 text-amber-500" />
            ) : (
              <CreditCard className="w-5 h-5 text-blue-500" />
            )}
            Subscription
          </CardTitle>
          <CardDescription className="text-black/50 font-medium">
            {practice?.subscription_status === "pro"
              ? "You're on the Pro plan with unlimited access."
              : "Manage your EOB Reader subscription."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between py-4 border-b border-black/5">
            <span className="text-sm font-semibold text-black/50">Status</span>
            <Badge
              className={`px-3 py-1 font-bold text-xs rounded-full ${
                practice?.subscription_status === "pro"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : practice?.subscription_status === "trial" && trialDaysRemaining > 0
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : practice?.subscription_status === "canceled"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              {practice?.subscription_status === "pro"
                ? "⭐ Pro"
                : practice?.subscription_status === "trial" && trialDaysRemaining > 0
                  ? "Free Trial"
                  : practice?.subscription_status === "trial" && trialDaysRemaining <= 0
                    ? "Trial Expired"
                    : practice?.subscription_status === "canceled"
                      ? "Canceled"
                      : (practice?.subscription_status || "Trial")}
            </Badge>
          </div>

          {/* Trial countdown */}
          {practice?.subscription_status === "trial" && trialDaysRemaining > 0 && (
            <div className="flex items-center justify-between py-4 border-b border-black/5">
              <span className="text-sm font-semibold text-black/50">Days Remaining</span>
              <span className={`text-sm font-bold ${
                trialDaysRemaining <= 3 ? "text-red-500" : "text-black"
              }`}>
                {trialDaysRemaining} days
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-4">
            <span className="text-sm font-semibold text-black/50">Plan</span>
            <span className="text-sm font-bold text-black">
              {practice?.subscription_status === "pro"
                ? "Pro — $29/mo"
                : practice?.subscription_status === "trial" && trialDaysRemaining > 0
                  ? `Free Trial — ${trialDaysRemaining} days remaining`
                  : practice?.subscription_status === "trial" && trialDaysRemaining <= 0
                    ? "Trial Expired — 1 PDF/day"
                    : practice?.subscription_status === "canceled"
                      ? "Canceled — Limited to 1 PDF/day"
                      : "Expired — 1 PDF/day"}
            </span>
          </div>

          {/* Upload limits info */}
          <div className="flex items-center justify-between py-4 border-t border-black/5">
            <span className="text-sm font-semibold text-black/50">Daily Upload Limit</span>
            <span className="text-sm font-bold text-black">
              {practice?.subscription_status === "pro"
                ? "Unlimited"
                : practice?.subscription_status === "trial" && trialDaysRemaining > 0
                  ? "100 PDFs/day"
                  : "1 PDF/day"}
            </span>
          </div>

          <div className="pt-6">
            {/* CTA buttons */}
            {practice?.subscription_status === "pro" ? (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                className="w-full border-black/10 text-black hover:bg-gray-50 rounded-xl font-bold py-6 shadow-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-black hover:bg-black/80 text-white rounded-xl py-6 font-bold shadow-xl shadow-black/10 border border-black transition-all"
                >
                  {upgrading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-3 text-amber-300" />
                  )}
                  Upgrade to Pro — $29/mo
                </Button>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-black/5">
                    <p className="text-xs font-semibold text-black/40 mb-1">Free / Expired</p>
                    <p className="text-sm text-black font-bold">1 PDF/day</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                    <p className="text-xs font-semibold text-blue-500 mb-1">Pro Plan</p>
                    <p className="text-sm text-blue-700 font-bold">Unlimited Limit</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-black/5 p-6 rounded-t-3xl">
          <CardTitle className="text-black flex items-center gap-2 text-lg font-bold">
            <Shield className="w-5 h-5 text-emerald-500" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-sm font-medium text-black/60 leading-relaxed">
          <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> All PDFs are encrypted at rest in secure storage</p>
          <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> PDFs are auto-deleted after 90 days</p>
          <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Your data is never used to train AI models</p>
          <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Row-Level Security ensures practice data isolation</p>
        </CardContent>
      </Card>

      {/* Feedback — Simple */}
      <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-black/5 p-6 rounded-t-3xl">
          <CardTitle className="text-black flex items-center gap-2 text-lg font-bold">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Send Us Feedback
          </CardTitle>
          <CardDescription className="text-black/50 font-medium">
            Help us improve EOB Reader. Share suggestions, report bugs, or tell us what you think.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Message */}
          <textarea
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            placeholder="Tell us what you think, what could be better, or what features you'd love to see..."
            rows={4}
            className="w-full rounded-2xl border border-black/10 bg-white text-black placeholder:text-black/30 p-4 text-sm font-medium resize-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm"
          />

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button
              onClick={submitFeedback}
              disabled={submittingFeedback || !feedbackMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 shadow-md shadow-indigo-500/20 font-bold disabled:opacity-50 border-0"
            >
              {submittingFeedback ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Feedback
            </Button>
            {feedbackSubmitted && (
              <span className="text-sm font-bold text-emerald-500 animate-pulse bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Sent! Thank you.
              </span>
            )}
          </div>

          {/* Past feedback */}
          {pastFeedback.length > 0 && (
            <div className="border-t border-black/5 pt-6 space-y-4">
              <p className="text-xs text-black/40 uppercase tracking-widest font-bold">
                Your Previous Feedback
              </p>
              {pastFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-gray-50 border border-black/5 text-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-black/40">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-black/70 font-medium text-sm leading-relaxed">
                    {fb.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Out */}
      <Card className="bg-red-50 border-red-100 shadow-sm rounded-3xl overflow-hidden mt-12 mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-red-900">Sign Out</h3>
              <p className="text-sm font-medium text-red-800/60 mt-1">
                Log out of your EOB Reader account on this device.
              </p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              variant="outline"
              className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold px-6 shadow-sm w-full sm:w-auto"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
