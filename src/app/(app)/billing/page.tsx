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
import {
  CreditCard,
  Crown,
  Loader2,
  Sparkles,
  CheckCircle,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

function daysUntil(isoDate: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

interface PracticeData {
  id: string;
  name: string | null;
  email: string;
  subscription_status: string;
  trial_end_date: string;
  default_pms: string;
  polar_customer_id: string | null;
}

export default function BillingPage() {
  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  async function fetchPractice() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("practices")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (data) {
      setPractice(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Load the practice once when the billing screen opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPractice();
  }, []);

  // Handle upgrade success redirect
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to Pro! Your account has been upgraded.");
      setTimeout(() => fetchPractice(), 1500);
      router.replace("/billing");
    }
  }, [searchParams]);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID || "";
      // Fixed: changed 'productId' to 'products' to match Polar Next.js SDK requirements
      window.location.href = `/api/checkout?products=${productId}`;
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

  const trialDaysRemaining = practice ? daysUntil(practice.trial_end_date) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isPro = practice?.subscription_status === "pro";
  const isTrialActive = practice?.subscription_status === "trial" && trialDaysRemaining > 0;
  const isTrialExpired = practice?.subscription_status === "trial" && trialDaysRemaining <= 0;
  const isCanceled = practice?.subscription_status === "canceled";

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-500" />
          Billing & Subscription
        </h1>
        <p className="text-black/50 mt-1 font-medium">
          Manage your subscription plans and details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Current Plan Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={`border-black/5 shadow-md rounded-3xl overflow-hidden ${
            isPro ? "bg-gradient-to-b from-amber-50 to-white" : "bg-white"
          }`}>
            <CardHeader className={`border-b border-black/5 p-6 rounded-t-3xl ${
              isPro ? "bg-amber-100/30" : "bg-gray-50/50"
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-black text-xl font-bold flex items-center gap-2">
                    {isPro ? (
                      <Crown className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Zap className="w-5 h-5 text-blue-500" />
                    )}
                    Current Subscription
                  </CardTitle>
                  <CardDescription className="text-black/50 font-medium">
                    Details of your current usage limits.
                  </CardDescription>
                </div>
                <Badge
                  className={`px-3 py-1 font-bold text-xs rounded-full border ${
                    isPro
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : isTrialActive
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : isCanceled
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {isPro
                    ? "⭐ Pro"
                    : isTrialActive
                      ? "Free Trial"
                      : isTrialExpired
                        ? "Trial Expired"
                        : isCanceled
                          ? "Canceled"
                          : "Expired"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-black/5">
                  <span className="text-xs font-semibold text-black/40 block mb-1">PLAN TYPE</span>
                  <span className="text-base font-black text-black">
                    {isPro ? "Pro Plan" : isTrialActive ? "Free Trial" : "Free Plan"}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-black/5">
                  <span className="text-xs font-semibold text-black/40 block mb-1">UPLOAD LIMIT</span>
                  <span className="text-base font-black text-black">
                    {isPro ? "Unlimited" : isTrialActive ? "100 PDFs/day" : "1 PDF/day"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm py-3 border-b border-black/5">
                  <span className="font-semibold text-black/50">Billing Period</span>
                  <span className="font-bold text-black">{isPro ? "Monthly" : "N/A"}</span>
                </div>
                {isTrialActive && (
                  <div className="flex items-center justify-between text-sm py-3 border-b border-black/5">
                    <span className="font-semibold text-black/50">Trial Days Remaining</span>
                    <span className="font-bold text-blue-600">{trialDaysRemaining} days</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm py-3">
                  <span className="font-semibold text-black/50">Cost</span>
                  <span className="font-bold text-black">{isPro ? "$29.00 / month" : "$0.00"}</span>
                </div>
              </div>

              <div className="pt-4">
                {isPro ? (
                  <Button
                    onClick={handleManageSubscription}
                    variant="outline"
                    className="w-full border-black/10 text-black hover:bg-gray-50 rounded-xl font-bold py-6 shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Subscription & Invoices
                  </Button>
                ) : (
                  <Button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="w-full bg-black hover:bg-black/90 text-white rounded-xl py-6 font-bold shadow-xl shadow-black/10 border border-black transition-all flex items-center justify-center gap-2"
                  >
                    {upgrading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    )}
                    Upgrade to Pro — $29/mo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security details block */}
          <Card className="bg-white border-black/5 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-base font-bold text-black">Payments</h4>
                <p className="text-sm text-black/50 font-medium mt-1 leading-relaxed">
                  Checkout and invoices go through Polar. The EOB PDF is not sent to Polar. This project is not a HIPAA billing service.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Pro Features list */}
        <div className="space-y-6">
          <Card className="bg-white border-black/5 shadow-md rounded-3xl overflow-hidden h-full">
            <CardHeader className="bg-black text-white p-6">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Why Upgrade to Pro?
              </CardTitle>
              <CardDescription className="text-white/60 font-semibold">
                Unlock the full capacity of EOB Reader.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                {
                  title: "Unlimited Uploads",
                  desc: "Process as many EOBs as your dental practice receives without daily caps.",
                },
                {
                  title: "Batch upload",
                  desc: "Upload up to 200 text-based PDFs in one batch. Each file is drafted from its text layer, then waits for review.",
                },
                {
                  title: "Export",
                  desc: "Download an X12 835 file or a CSV shaped for Dentrix, Eaglesoft, or Open Dental.",
                },
                {
                  title: "Questions",
                  desc: "Email shanifadhil33@gmail.com. This is a portfolio project, not a staffed support desk.",
                },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-black">{feat.title}</h5>
                    <p className="text-xs text-black/50 font-medium mt-0.5 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
