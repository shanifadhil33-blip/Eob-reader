import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function NotFound() {
  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">That page is not here</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#614f38]">
          The address may be old. Home, the demo, and the dashboard are still available.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
          >
            Home
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center rounded-xl border border-[#d1b996] px-4 text-sm font-medium"
          >
            Demo
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-xl border border-[#d1b996] px-4 text-sm font-medium"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}
