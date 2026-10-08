import Link from "next/link";
import { PortfolioNotice } from "@/components/portfolio-notice";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";

const steps = [
  {
    title: "Upload",
    body: "Drop in a text-based dental EOB PDF. A scan or photo has no text layer, so it is skipped with a plain message.",
  },
  {
    title: "Draft",
    body: "The text is sent to a model, which drafts the payer, patient, and line items. The draft can be wrong.",
  },
  {
    title: "Review",
    body: "You approve, flag, or reject each claim. Export only includes what you approved.",
  },
  {
    title: "Export",
    body: "Download an X12 835 or a CSV shaped for Dentrix, Eaglesoft, or Open Dental. The 835 may add a balancing adjustment.",
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen flex-col bg-[#f2efe9] text-[#281a0d]">
      <PortfolioNotice />
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-14 sm:py-20">
          <p className="text-sm font-medium text-[#416c6f]">A portfolio piece</p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight sm:text-6xl">
            Read a dental EOB, review the draft, export a file.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#614f38]">
            EOB Reader is a learning project. Anyone can try a fictional batch
            without an account. Sign in with Google when you want a private
            workspace for your own uploads.
          </p>
          {params.error === "auth" ? (
            <p className="mt-4 text-sm text-[#8c3a2f]" role="alert">
              Google sign-in did not finish. Use Sign in in the header to try again.
            </p>
          ) : null}
          <div className="mt-8">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-5 text-sm font-medium text-[#f2efe9]"
            >
              Try the demo
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#eee0c7] p-5">
            <p className="text-xs uppercase tracking-wide text-[#614f38]">Sample EOB</p>
            <p className="mt-3 font-medium">Lumen Dental Plan</p>
            <p className="text-sm text-[#614f38]">Patient: Maple Quill (fictional)</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#d1b996] py-2">
                <span>D0120 exam</span>
                <span>$70.00 paid</span>
              </div>
              <div className="flex justify-between border-b border-[#d1b996] py-2">
                <span>D1110 cleaning</span>
                <span>$140.00 paid</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#b9cecf] p-5">
            <p className="text-xs uppercase tracking-wide text-[#416c6f]">After review</p>
            <p className="mt-3 font-medium">Ready to download</p>
            <p className="mt-2 text-sm leading-relaxed text-[#281a0d]">
              An approved claim can leave as an X12 835 or as a CSV. The public
              demo builds both in the browser. A signed-in account keeps the
              files private to that Google user.
            </p>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-[#d1b996] py-16">
          <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-[#eee0c7] p-5">
                <p className="text-sm text-[#416c6f]">0{index + 1}</p>
                <h3 className="font-display mt-2 text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#614f38]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-[#d1b996] py-16">
          <h2 className="font-display text-3xl">What this is not</h2>
          <ul className="mt-4 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#614f38]">
            <li>Not a HIPAA product, and not a place for real patient information.</li>
            <li>Not sold. There is no trial, no plan, and no checkout.</li>
            <li>Not a guarantee. Review the draft before you export anything.</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
