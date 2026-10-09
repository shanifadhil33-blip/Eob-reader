"use client";

import { BackLink } from "@/components/back-link";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="font-display mt-3 text-4xl">This page could not load</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#614f38]">
        Your uploads are still there. Try again, or go back to the dashboard.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
      >
        Try again
      </button>
    </div>
  );
}
