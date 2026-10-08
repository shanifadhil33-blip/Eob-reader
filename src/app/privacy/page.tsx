import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy · EOB Reader",
  description:
    "What EOB Reader actually stores. A portfolio project, not for real patient information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        EOB Reader is a portfolio project. Use fictional documents only. Do not
        upload real patient information. This page describes what the code does
        today. It is not a HIPAA notice and not a Business Associate Agreement.
      </p>
      <h2>Account</h2>
      <ul>
        <li>
          Email address, from an email sign-in code or from Google. This app
          does not collect or store a password.
        </li>
        <li>Practice name and preferred practice-management system, if you save them.</li>
        <li>
          If you start a Polar checkout, Polar processes the payment. This app
          stores a Polar customer id, a subscription id, and a status such as
          trial or pro. It does not store card numbers.
        </li>
      </ul>
      <h2>Documents</h2>
      <ul>
        <li>The PDF you upload, in a private storage bucket under your account.</li>
        <li>
          The text taken from that PDF, and the fields the model returns
          (payer, patient, claim, check, and line items).
        </li>
        <li>
          That text is sent to OpenRouter for extraction, or to a local Ollama
          server when that provider is configured. No zero-retention setting is
          applied in this code.
        </li>
        <li>Feedback text you submit from Settings.</li>
      </ul>
      <h2>What is not true of this project</h2>
      <ul>
        <li>It is not HIPAA compliant, and it does not sign BAAs.</li>
        <li>Files are not auto-deleted after 90 days, or on any other timer.</li>
        <li>Access is not written to an audit log.</li>
        <li>
          This app does not apply its own AES key or promise a specific TLS
          version. The site is served over HTTPS. Storage encryption is
          whatever the host provides for a private bucket.
        </li>
        <li>Extraction is not guaranteed, and model output can be wrong.</li>
      </ul>
      <h2>How long data stays</h2>
      <p>
        Until you delete a batch, or until the rows are removed from the
        database. There is no self-serve “delete my account” button. Email{" "}
        <a href="mailto:shanifadhil33@gmail.com">shanifadhil33@gmail.com</a> if
        you want an account removed. A skipped scan can remain in storage even
        after the batch is deleted, because only files tied to a saved
        extraction are removed.
      </p>
      <h2>Contact</h2>
      <p>
        <a href="mailto:shanifadhil33@gmail.com">shanifadhil33@gmail.com</a>
      </p>
    </LegalPage>
  );
}
