import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { DemoWorkspace } from "@/components/demo-workspace";

export const metadata: Metadata = {
  title: "Demo · EOB Reader",
  description:
    "A fictional EOB batch you can review and export without signing in. Not real patient data.",
};

export default function DemoPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <BackLink href="/" label="Home" />
      <div className="mt-3">
        <Suspense
          fallback={
            <div className="space-y-3" aria-busy="true" aria-label="Loading the sample">
              <div className="h-8 w-64 rounded-xl bg-[#d1b996]" />
              <div className="h-24 rounded-2xl bg-[#eee0c7]" />
              <div className="h-16 rounded-2xl bg-[#eee0c7]" />
            </div>
          }
        >
          <DemoWorkspace />
        </Suspense>
      </div>
    </main>
  );
}
