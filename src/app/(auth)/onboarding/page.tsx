"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, FileText, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OnboardingPage() {
  const [practice, setPractice] = useState<{ id: string; created_at: string } | null>(null);
  const [name, setName] = useState("");
  const [defaultPms, setDefaultPms] = useState("dentrix");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingUser, setExistingUser] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const { data, error } = await supabase
        .from("practices")
        .select("id, name, created_at")
        .eq("auth_id", user.id)
        .single();
        
      if (data) {
        // Checking if an existing user accidentally signed up instead of logging in.
        // We evaluate this by seeing if their account is older than 5 minutes.
        const createdAt = new Date(data.created_at).getTime();
        const now = new Date().getTime();
        const isNewUser = (now - createdAt) < 5 * 60 * 1000;
        
        if (!isNewUser) {
          setExistingUser(true);
          setLoading(false);
          return;
        }

        setPractice({ id: data.id, created_at: data.created_at });
        if (data.name) setName(data.name);
      }
      setLoading(false);
    }
    
    checkUser();
  }, [router, supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!practice || !name.trim()) return;
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
      toast.error("Failed to setup practice.");
      setSaving(false);
      return;
    }

    toast.success("Setup complete!");
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 bg-card border-border backdrop-blur-xl shadow-2xl shadow-primary/10">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-white">
              Looks like you already have an account!
            </h1>
            <p className="text-sm text-white/50">
              You are already signed in.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white py-5 border-0 shadow-lg shadow-blue-500/25"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card border-border backdrop-blur-xl shadow-2xl shadow-primary/10">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              EOB Reader
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">
            Set up your practice
          </h1>
          <p className="text-sm text-white/50">
            Let's get your workspace ready
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70 text-sm">
                Practice / Organization Name
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. Smith's Dental"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Default PMS for Export</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dentrix", label: "Dentrix" },
                  { id: "eaglesoft", label: "Eaglesoft" },
                  { id: "open_dental", label: "Open Dental" },
                ].map((pms) => (
                  <button
                    key={pms.id}
                    type="button"
                    onClick={() => setDefaultPms(pms.id)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      defaultPms === pms.id
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                    }`}
                  >
                    {pms.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white py-5 border-0 shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
