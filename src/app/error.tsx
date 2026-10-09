"use client";

import Link from "next/link";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center bg-[#f2efe9] px-4 py-10 text-[#281a0d]">
      <h1 className="font-display text-4xl">This page could not load</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#614f38]">
        Nothing was changed. Try again, or go back to the home page.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-[#d1b996] px-4 text-sm font-medium"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
