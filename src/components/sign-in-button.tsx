"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";

export function SignInButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!isSupabaseConfigured) {
      toast.error("Google sign-in is not configured in this environment.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in could not start. Try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={busy}
      className={`inline-flex h-11 items-center justify-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9] disabled:opacity-70 ${className}`}
    >
      {busy ? "Opening Google…" : "Sign in"}
    </button>
  );
}
