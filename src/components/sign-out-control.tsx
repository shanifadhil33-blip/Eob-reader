"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function SignOutControl() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setBusy(false);
        setError("Could not sign out. Try again.");
        return;
      }
      window.location.replace("/");
    } catch {
      setBusy(false);
      setError("Could not sign out. Try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium text-[#281a0d]"
      >
        Sign out
      </button>
      <ConfirmDialog
        open={open}
        title="Sign out of EOB Reader?"
        body="You can sign in again with Google. Your uploads stay on this account."
        confirmLabel="Sign out"
        busyLabel="Signing out…"
        busy={busy}
        error={error}
        onCancel={close}
        onConfirm={confirm}
      />
    </>
  );
}
