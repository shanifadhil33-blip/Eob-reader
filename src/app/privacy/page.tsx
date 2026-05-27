import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/50 mb-12">
            <strong>EOB Reader</strong><br />
            <strong>Last Updated: March 23, 2026</strong><br />
            <strong>Effective Date: March 23, 2026</strong>
          </p>

          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                EOB Reader ("we," "us," "our," or the "Service") is a web-based software application that processes dental Explanation of Benefits (EOB) documents using artificial intelligence. This Privacy Policy describes how we collect, use, store, and protect your information, including Protected Health Information (PHI) as defined under the Health Insurance Portability and Accountability Act of 1996 (HIPAA).
              </p>
              <p className="mt-2">
                By using EOB Reader, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-white mb-2 mt-6">2.1 Account Information</h3>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Full name</li>
                <li>Email address</li>
                <li>Practice name</li>
                <li>Practice address (optional)</li>
                <li>Password (stored as a cryptographic hash, never in plaintext)</li>
                <li>Preferred Practice Management System (Dentrix, Eaglesoft, or Open Dental)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">2.2 Protected Health Information (PHI)</h3>
              <p>When you upload EOB documents for processing, the documents may contain PHI, including but not limited to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Patient names and dates of birth</li>
                <li>Subscriber names and insurance ID numbers</li>
                <li>Group numbers</li>
                <li>Claim numbers</li>
                <li>Dates of service</li>
                <li>Dental procedure codes (CDT codes)</li>
                <li>Diagnosis information</li>
                <li>Billed, allowed, and paid amounts</li>
                <li>Adjustment and remark codes</li>
                <li>Provider names and NPI numbers</li>
                <li>Insurance payer information</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">2.3 Usage Data</h3>
              <p>We automatically collect:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Log-in timestamps</li>
                <li>Number of EOBs uploaded and processed</li>
                <li>Feature usage patterns (e.g., export frequency, PMS type selected)</li>
                <li>Browser type and version</li>
                <li>IP address</li>
                <li>Device type</li>
              </ul>
              <p className="mt-2">We do NOT use cookies for advertising or third-party tracking. We use only strictly necessary cookies for session management and authentication.</p>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">2.4 Payment Information</h3>
              <p>Payment is processed entirely by our third-party payment processor, Polar. We do NOT collect, store, or have access to your credit card number, bank account details, or other financial payment instruments. Polar's privacy policy governs their handling of your payment data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">3.1 PHI Usage</h3>
              <p>We use PHI strictly for the following purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Processing and extracting data from uploaded EOB documents using AI</li>
                <li>Displaying extracted data for your review and editing</li>
                <li>Generating PMS-compatible export files (CSV)</li>
                <li>Improving extraction accuracy for your specific insurance payers over time (payer learning)</li>
                <li>Storing extraction history for your audit and reference purposes</li>
              </ul>
              <p className="mt-4">We do NOT use your PHI for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Marketing or advertising</li>
                <li>Sale to third parties</li>
                <li>Training AI models (unless you provide explicit written authorization)</li>
                <li>Any purpose unrelated to providing the Service</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">3.2 Account and Usage Data</h3>
              <p>We use account and usage data to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Authenticate your identity and manage your account</li>
                <li>Enforce subscription status and trial limits</li>
                <li>Provide customer support</li>
                <li>Monitor and improve the Service</li>
                <li>Send transactional emails (trial reminders, account notifications)</li>
                <li>Generate aggregated, de-identified analytics about Service usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. How We Store and Protect Your Information</h2>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.1 Infrastructure Security</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All data is encrypted at rest using AES-256 encryption</li>
                <li>All data in transit is encrypted using TLS 1.3</li>
                <li>Our database and file storage are hosted on Supabase, which operates on Amazon Web Services (AWS) infrastructure</li>
                <li>File storage uses private buckets with no public access URLs</li>
                <li>Row-Level Security (RLS) is enforced at the database level so each practice can only access its own data</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.2 Access Controls</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Authentication is required for all access to the Service</li>
                <li>Passwords are cryptographically hashed and never stored in plaintext</li>
                <li>We implement role-based access controls internally</li>
                <li>Administrative access to production systems is limited to authorized personnel only</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.3 PHI-Specific Protections</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Uploaded EOB PDFs are stored in encrypted private storage buckets</li>
                <li>PDFs are automatically deleted after 90 days unless you configure a different retention period</li>
                <li>Extracted data is stored in your practice's isolated database partition</li>
                <li>No PHI is included in application logs, error reports, or analytics</li>
                <li>All access to PHI is recorded in an audit log retained for 6 years per HIPAA requirements</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.4 AI Processing</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>EOB documents are sent to our AI provider (currently Groq / Google Gemini / Anthropic, depending on configuration) for extraction</li>
                <li>We maintain Business Associate Agreements (BAAs) with AI providers that process PHI</li>
                <li>AI providers are contractually prohibited from using your data to train their models</li>
                <li>Documents are transmitted via encrypted connections and are not retained by the AI provider after processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention and Deletion</h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="py-3 px-4 font-semibold text-white">Data Type</th>
                      <th className="py-3 px-4 font-semibold text-white">Retention Period</th>
                      <th className="py-3 px-4 font-semibold text-white">Deletion Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Uploaded EOB PDFs</td>
                      <td className="py-3 px-4">90 days (configurable)</td>
                      <td className="py-3 px-4">Automatic permanent deletion</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Extracted data and history</td>
                      <td className="py-3 px-4">Duration of active account</td>
                      <td className="py-3 px-4">Deleted within 30 days of account closure</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Payer templates</td>
                      <td className="py-3 px-4">Duration of active account</td>
                      <td className="py-3 px-4">Deleted within 30 days of account closure</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Audit logs</td>
                      <td className="py-3 px-4">6 years (HIPAA requirement)</td>
                      <td className="py-3 px-4">Automatic deletion after retention period</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Account information</td>
                      <td className="py-3 px-4">Duration of active account</td>
                      <td className="py-3 px-4">Deleted within 30 days of account closure</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Expired trial accounts</td>
                      <td className="py-3 px-4">30 days after trial expiration</td>
                      <td className="py-3 px-4">Automatic permanent deletion</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                You may request immediate deletion of your data at any time by contacting us at privacy@eobreader.com. We will process deletion requests within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Third-Party Service Providers</h2>
              <p>We use the following third-party services that may have access to your data:</p>
              <div className="overflow-x-auto mt-4 text-sm md:text-base">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="py-3 px-2 md:px-4 font-semibold text-white">Provider</th>
                      <th className="py-3 px-2 md:px-4 font-semibold text-white">Purpose</th>
                      <th className="py-3 px-2 md:px-4 font-semibold text-white">Data Accessed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 md:px-4">Supabase (AWS)</td>
                      <td className="py-3 px-2 md:px-4">Database, authentication, file storage</td>
                      <td className="py-3 px-2 md:px-4">All data</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 md:px-4">Groq / Gemini / Anthropic</td>
                      <td className="py-3 px-2 md:px-4">AI document extraction</td>
                      <td className="py-3 px-2 md:px-4">Uploaded EOB images (PHI)</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 md:px-4">Polar</td>
                      <td className="py-3 px-2 md:px-4">Payment processing</td>
                      <td className="py-3 px-2 md:px-4">Email, payment details (no PHI)</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 md:px-4">Resend</td>
                      <td className="py-3 px-2 md:px-4">Transactional email delivery</td>
                      <td className="py-3 px-2 md:px-4">Email address only (no PHI)</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 md:px-4">Vercel</td>
                      <td className="py-3 px-2 md:px-4">Application hosting</td>
                      <td className="py-3 px-2 md:px-4">Encrypted traffic only</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                We maintain appropriate agreements with each provider. For providers that process PHI, we maintain Business Associate Agreements as required by HIPAA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">7.1 All Users</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Access your account data and extraction history at any time through the Service</li>
                <li>Export your data in standard formats (CSV)</li>
                <li>Correct any inaccurate information in your account</li>
                <li>Delete your account and all associated data</li>
                <li>Opt out of non-essential communications</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">7.2 HIPAA Rights</h3>
              <p>As the covered entity responsible for the PHI you upload, you retain all rights and obligations under HIPAA. We act as your Business Associate and process PHI only as directed by you and as permitted under our Business Associate Agreement.</p>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">7.3 California Residents (CCPA/CPRA)</h3>
              <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act and California Privacy Rights Act, including the right to know what personal information we collect, the right to delete, and the right to opt out of the sale of personal information. We do not sell personal information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
              <p>EOB Reader is a business-to-business service designed for dental practice staff. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal information, please contact us at privacy@eobreader.com.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Data Breach Notification</h2>
              <p>In the event of a data breach affecting your PHI, we will:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Notify affected practices within 72 hours of discovering the breach</li>
                <li>Provide details of the nature and scope of the breach</li>
                <li>Describe the steps we are taking to mitigate the breach</li>
                <li>Cooperate with your breach notification obligations under HIPAA</li>
                <li>Report to the U.S. Department of Health and Human Services as required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Handling</h2>
              <p>EOB Reader is designed for US dental practices. While our team operates internationally, all PHI and practice data is stored and processed in the United States on US-based infrastructure (AWS regions). No PHI is transferred to or stored in jurisdictions outside the United States.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Posting the updated policy on our website with a new "Last Updated" date</li>
                <li>Sending an email notification to registered users for material changes</li>
                <li>Displaying an in-app notice upon your next login</li>
              </ul>
              <p className="mt-4">Your continued use of the Service after changes become effective constitutes acceptance of the revised policy.</p>
              <p className="mt-4">For data deletion requests, please email privacy@eobreader.com with the subject line "Data Deletion Request" and include your registered email address and practice name.</p>
            </section>

            <div className="mt-12 pt-8 border-t border-white/10 text-sm text-white/40 italic">
              *This Privacy Policy is provided for informational purposes and represents our commitment to protecting your data. We recommend consulting with your own legal counsel regarding your HIPAA compliance obligations as a covered entity.*
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
