import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { PortfolioNotice } from "@/components/portfolio-notice";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2efe9] text-[#281a0d]">
      <PortfolioNotice />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <BackLink href="/" />
        <h1 className="font-display mt-3 text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[#614f38]">Last updated October 8, 2026</p>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-[#614f38] [&_a]:text-[#416c6f] [&_a]:underline [&_h2]:pt-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-[#281a0d] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
        <p className="mt-10 text-sm">
          <Link href="/privacy">Privacy</Link>
          {" · "}
          <Link href="/terms">Terms</Link>
          {" · "}
          <Link href="/hipaa">Data handling</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
