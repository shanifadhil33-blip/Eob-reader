import Link from "next/link";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HIPAAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white selection:bg-blue-500/30">
      <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">EOB Reader</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="prose prose-invert prose-blue max-w-none">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-5xl font-bold m-0">HIPAA Compliance</h1>
          </div>
          <p className="text-white/50 mb-12">
            <strong>EOB Reader</strong><br />
            <strong>Last Updated: March 23, 2026</strong>
          </p>

          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment to Protecting Patient Data</h2>
              <p>
                EOB Reader processes dental Explanation of Benefits (EOB) documents that contain Protected Health Information (PHI). We take our responsibility to protect this data seriously. This page describes how we comply with the Health Insurance Portability and Accountability Act of 1996 (HIPAA) and its implementing regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How HIPAA Applies to EOB Reader</h2>
              
              <h3 className="text-xl font-medium text-white mb-2 mt-6">Your Role: Covered Entity</h3>
              <p>As a dental or medical practice, you are a "Covered Entity" under HIPAA. You are responsible for the privacy and security of your patients' PHI and for ensuring that any service providers who access PHI on your behalf meet HIPAA standards.</p>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Our Role: Business Associate</h3>
              <p>When you use EOB Reader to process EOB documents containing PHI, we act as your "Business Associate." This means we access, process, and store PHI on your behalf solely to provide the Service. We are legally and contractually bound to protect that PHI.</p>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Business Associate Agreement (BAA)</h3>
              <p>We provide a Business Associate Agreement to every customer. The BAA defines:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The permitted uses and disclosures of PHI</li>
                <li>Our obligations to safeguard PHI</li>
                <li>Breach notification procedures</li>
                <li>Your rights regarding the PHI we process</li>
                <li>Termination provisions related to PHI handling</li>
              </ul>
              <p className="mt-2">A BAA is available for review and acknowledgment during onboarding. If you require a customized BAA or have questions, contact hipaa@eobreader.com.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Administrative Safeguards</h2>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>Access Management:</strong> Access requires authenticated login credentials. Each practice's data is logically isolated using Row-Level Security (RLS) at the database level.</li>
                <li><strong>Workforce Training:</strong> All team members with potential access to PHI receive HIPAA training.</li>
                <li><strong>Incident Response:</strong> We maintain a documented incident response plan for security events and potential breaches. Suspected incidents are investigated immediately.</li>
                <li><strong>Risk Assessment:</strong> We conduct periodic risk assessments of our systems and processes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Technical Safeguards</h2>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">Encryption</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Data at rest:</strong> AES-256 encryption</li>
                <li><strong>Data in transit:</strong> TLS 1.3</li>
                <li><strong>Database:</strong> Encrypted at the storage layer (Supabase/AWS)</li>
                <li><strong>File storage:</strong> Encrypted private buckets with no public access</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Audit Controls</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All actions involving PHI are logged: uploads, extractions, reviews, edits, exports, and access events</li>
                <li>Audit logs include timestamps, user identifiers, action types, and affected records</li>
                <li>Audit logs are retained for a minimum of 6 years as required by HIPAA</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Access Controls & Automatic Logoff</h3>
              <p>User authentication via Supabase Auth with hashed passwords. Row-Level Security (RLS) enforces practice-level data isolation. User sessions expire after a configurable period of inactivity.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">AI Processing and PHI</h2>
              <p>Documents are sent to our AI provider via encrypted connection for data extraction. Extracted data is stored in your practice's isolated database partition. Original images sent to the AI provider are not retained by the provider after processing.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>We maintain Business Associate Agreements with AI providers that process PHI</li>
                <li>AI providers are contractually prohibited from using your data to train their models</li>
                <li>All data transmitted to AI providers is encrypted in transit</li>
              </ul>
              <p className="mt-4 font-medium text-white">EOB Reader includes a mandatory human review step to ensure human oversight of all PHI processing before it is used for payment posting.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Lifecycle and Retention</h2>
              <p>Extracted data is stored in your practice's database partition. PDFs are retained for 90 days by default (configurable). You can manually delete any EOB record or batch at any time. All deletions from our systems are permanent and irrecoverable.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Breach Notification</h2>
              <p>In the event of a breach of unsecured PHI, we will investigate immediately, contain the breach, notify you within 72 hours, and cooperate with your breach notification obligations to affected individuals and the HHS.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Subcontractors and Third Parties</h2>
              <p>We use third-party services like Supabase (AWS) for database and file storage, and AI Providers (e.g., Groq) for extraction. We require all subcontractors who may access PHI to enter into Business Associate Agreements before any PHI is shared.</p>
              <p className="mt-2 text-white">We do NOT share PHI with advertising platforms, analytics providers, or any party not directly involved in providing the Service.</p>
            </section>

            <div className="mt-12 pt-8 border-t border-white/10 text-sm text-white/40 italic">
              *This page describes our HIPAA compliance practices and commitments. It does not constitute legal advice. We recommend that you consult with your own HIPAA compliance officer or legal counsel regarding your obligations as a Covered Entity. EOB Reader is committed to supporting your compliance efforts through robust technical safeguards and transparent business practices.*
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
