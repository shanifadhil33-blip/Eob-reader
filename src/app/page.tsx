import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Upload,
  CheckCircle,
  Download,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing-header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white relative overflow-hidden">
      {/* Subtle background ambient gradient simulating the soft purple/blue base of the inspiration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/40 blur-[120px] pointer-events-none" />

      <LandingHeader />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-16 sm:pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[1.05] mb-8 text-black">
            Transform your EOBs into data
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-black/50 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            EOB Reader takes your PDFs, reads every line item, and outputs perfectly balanced CSVs for your PMS. No manual data entry required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-black hover:bg-black/90 text-white text-lg px-8 py-6 border border-black shadow-xl shadow-black/10 transition-all hover:shadow-2xl hover:-translate-y-1 rounded-2xl"
              >
                Start Extracting for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Preview - Glassmorphism Card */}
        <div className="mt-20 sm:mt-28 relative perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none" />
          <div className="rounded-3xl border border-black/5 bg-white/40 backdrop-blur-3xl p-2 sm:p-3 shadow-2xl shadow-black/5">
            <div className="rounded-2xl bg-white border border-black/5 shadow-inner p-4 sm:p-8 min-h-[350px] sm:min-h-[400px] flex items-center justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl">
                {/* Simulated PDF side */}
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-black/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-4 h-4 text-black/40" />
                    <span className="text-sm font-medium text-black/60">
                      EOB_Delta_Dental.pdf
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-black/5 rounded-md w-3/4" />
                    <div className="h-4 bg-black/5 rounded-md w-full" />
                    <div className="h-4 bg-black/5 rounded-md w-5/6" />
                    <div className="mt-8 space-y-3">
                      <div className="flex justify-between">
                        <div className="h-3 bg-indigo-500/10 rounded w-1/3" />
                        <div className="h-3 bg-emerald-500/10 rounded w-1/4" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-indigo-500/10 rounded w-2/5" />
                        <div className="h-3 bg-emerald-500/10 rounded w-1/5" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Simulated extraction side */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-black/5 shadow-lg shadow-black/5">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-black/60">
                      Structured Data Output
                    </span>
                  </div>
                  <div className="space-y-4 text-sm font-medium tracking-tight">
                    <div className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="text-black/40">Patient</span>
                      <span className="text-black">John Smith</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="text-black/40">D0120</span>
                      <span className="text-emerald-600 font-mono">$41.60</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="text-black/40">D1110</span>
                      <span className="text-emerald-600 font-mono">$78.40</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-black/60 font-semibold">Total</span>
                      <span className="text-black font-bold font-mono text-base">
                        $120.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 border-t border-black/5 bg-gray-50/30">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-6 text-black">
          Automate the tedious parts.
        </h2>
        <p className="text-black/50 text-center mb-12 sm:mb-20 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
          Four simple steps to process hundreds of pages in under a minute. Our AI is designed specifically for US dental practices.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {[
            {
              icon: Upload,
              title: "Upload",
              desc: "Drag & drop up to 200 EOB PDFs at once.",
            },
            {
              icon: Zap,
              title: "Extract",
              desc: "Our engine reliably parses line items instantly.",
            },
            {
              icon: CheckCircle,
              title: "Review",
              desc: "Approve extraction perfectly aligned beside the PDF.",
            },
            {
              icon: Download,
              title: "Export",
              desc: "Download a PMS-ready CSV for Dentrix or Eaglesoft.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-black/5 hover:border-black/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/5"
            >
              <div
                className="w-14 h-14 rounded-2xl border border-black/5 bg-gray-50 flex items-center justify-center mb-8 group-hover:bg-black group-hover:border-black transition-all duration-300 shadow-sm"
              >
                <step.icon className="w-6 h-6 text-black/60 group-hover:text-white transition-colors" />
              </div>
              <div className="text-xs font-bold text-black/30 tracking-widest uppercase mb-3">
                Step 0{i + 1}
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">{step.title}</h3>
              <p className="text-black/60 font-medium leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
        <div className="rounded-[24px] sm:rounded-[40px] bg-black text-white p-8 sm:p-16 md:p-24 text-center shadow-2xl shadow-black/20 relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-20%] w-[70%] h-[150%] bg-gradient-to-br from-white/10 to-transparent blur-3xl rounded-full pointer-events-none" />
          <Shield className="w-12 h-12 sm:w-20 sm:h-20 text-white/80 mx-auto mb-6 sm:mb-8 stroke-[1.5]" />
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Designed for HIPAA Compliance.
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-xl font-medium leading-relaxed">
            No payer portal logins needed. Your PDFs are encrypted at rest, auto-deleted after 90 days, and never used to train third-party AI models. Ultimate privacy, guaranteed.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="EOB Reader" width={28} height={28} className="rounded-lg" />
              <span className="font-bold text-black tracking-tight">EOB Reader</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-black/40">
              <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
              <Link href="/hipaa" className="hover:text-black transition-colors">HIPAA Compliance</Link>
            </div>
          </div>
          <p className="text-black/30 text-sm font-medium">
            © {new Date().getFullYear()} EOB Reader.
          </p>
        </div>
      </footer>
    </div>
  );
}
