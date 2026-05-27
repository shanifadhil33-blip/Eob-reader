import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-white/50 mb-12">
            <strong>EOB Reader</strong><br />
            <strong>Last Updated: March 23, 2026</strong><br />
            <strong>Effective Date: March 23, 2026</strong>
          </p>

          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p>These Terms of Service ("Terms") constitute a legally binding agreement between you ("you," "your," or "Customer") and EOB Reader ("we," "us," "our," or the "Service"). By creating an account, accessing, or using EOB Reader, you agree to be bound by these Terms.</p>
              <p className="mt-2">If you are using the Service on behalf of a dental practice, medical practice, or other organization, you represent that you have the authority to bind that organization to these Terms, and "you" refers to both you individually and the organization.</p>
              <p className="mt-2 font-medium">If you do not agree to these Terms, do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>EOB Reader is a web-based software-as-a-service (SaaS) application that:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Accepts uploaded Explanation of Benefits (EOB) PDF documents</li>
                <li>Uses artificial intelligence to extract structured data from those documents</li>
                <li>Presents extracted data for human review and editing</li>
                <li>Generates export files formatted for specific Practice Management Systems (Dentrix, Eaglesoft, Open Dental)</li>
              </ul>
              <p className="mt-2">The Service is designed for US dental and medical practices and their authorized billing staff.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">3.1 Eligibility</h3>
              <p>To use EOB Reader, you must:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Be at least 18 years of age</li>
                <li>Be authorized to handle patient billing and insurance data for your practice</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">3.2 Account Responsibility</h3>
              <p>You are solely responsible for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All activity that occurs under your account</li>
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>Ensuring that only authorized personnel access the Service using your account</li>
                <li>Notifying us immediately at support@eobreader.com if you suspect unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription Plans and Payment</h2>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.1 Free Trial</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>New accounts receive a 14-day free trial beginning on the date of registration</li>
                <li>During the trial, you may process up to 100 EOB PDFs per day</li>
                <li>All features are available during the trial period</li>
                <li>No credit card is required to start the trial</li>
              </ul>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.2 Pro Subscription — $29/month</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>After the trial period, continued access requires a Pro subscription at $29 per month (USD)</li>
                <li>The Pro subscription includes unlimited EOB processing, all features, full extraction history, payer learning, and all export formats</li>
                <li>Subscriptions are billed monthly through our payment processor, Polar</li>
                <li>You may cancel at any time; access continues through the end of the current billing period</li>
              </ul>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.3 Trial Expiration</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>If you do not subscribe within 14 days of registration, your account will be paused</li>
                <li>While paused, you cannot upload or process new EOBs, but you can log in to view and export previously processed data</li>
                <li>Paused account data is retained for 30 days, after which it is permanently deleted</li>
                <li>You may reactivate your account at any time within the 30-day retention window by subscribing</li>
              </ul>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">4.4 Payment Terms</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All payments are processed by Polar. By subscribing, you also agree to Polar's terms of service</li>
                <li>Prices are in US dollars (USD)</li>
                <li>We reserve the right to change pricing with 30 days' advance notice to active subscribers</li>
                <li>Price changes do not apply to the current billing period</li>
                <li>No refunds are provided for partial months of service, except as required by applicable law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use</h2>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">5.1 You Agree To:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Use the Service only for processing legitimate EOB documents from US insurance payers</li>
                <li>Ensure that you have proper authorization to upload and process any documents containing patient information</li>
                <li>Comply with all applicable laws, including HIPAA</li>
                <li>Review AI-extracted data before using it for payment posting</li>
              </ul>
              <h3 className="text-xl font-medium text-white mb-2 mt-6">5.2 You Agree NOT To:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Upload documents you are not authorized to access or process</li>
                <li>Attempt to reverse-engineer, decompile, or extract the source code</li>
                <li>Use automated tools to scrape, crawl, or extract data</li>
                <li>Use the Service in any way that violates applicable law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data and Privacy</h2>
              <p>You retain all rights to the documents you upload. Our use of your data, including Protected Health Information (PHI), is governed by our Privacy Policy and Business Associate Agreement.</p>
              <p className="mt-2">Upon account termination or at your request, we will delete your data in accordance with the timelines described in our Privacy Policy. Audit logs are retained for 6 years as required by HIPAA.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. HIPAA Compliance</h2>
              <p>When you use EOB Reader to process documents containing PHI, we act as your Business Associate under HIPAA. A Business Associate Agreement is available during onboarding and must be acknowledged to process documents containing PHI.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. AI-Extracted Data — Accuracy Disclaimer</h2>
              <p>EOB Reader uses artificial intelligence to extract data. Extracted data may contain errors. YOU ARE SOLELY RESPONSIBLE for reviewing, verifying, and approving all extracted data before using it for payment posting or any other purpose.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
              <p className="uppercase text-sm font-medium tracking-wide">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. IN NO EVENT SHALL EOB READER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF REVENUE OR PROFITS.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-white/10 text-sm text-white/40 italic">
              *These Terms of Service are provided for informational purposes. We recommend consulting with your own legal counsel to ensure these terms meet your specific needs and comply with all applicable laws in your jurisdiction.*
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
