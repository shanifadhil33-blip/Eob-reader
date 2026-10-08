import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { PortfolioNotice } from "@/components/portfolio-notice";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <PortfolioNotice />
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="EOB Reader"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="font-bold tracking-tight">EOB Reader</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-black/60 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm font-medium text-black/40">
          Last updated October 8, 2026
        </p>
        <div className="mt-10 space-y-6 text-base leading-relaxed text-black/70 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-black [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-black [&_a]:underline">
          {children}
        </div>
      </main>
    </div>
  );
}
