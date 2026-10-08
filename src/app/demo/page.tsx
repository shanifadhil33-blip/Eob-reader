import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { DemoWorkspace } from "@/components/demo-workspace";
import { PortfolioNotice } from "@/components/portfolio-notice";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Demo · EOB Reader",
  description:
    "A fictional EOB batch you can review and export without signing in. Not real patient data.",
};

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2efe9]">
      <PortfolioNotice />
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <BackLink href="/" />
        <div className="mt-3">
          <DemoWorkspace />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
