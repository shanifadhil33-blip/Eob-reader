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
        <li>Sign-in is Google only. This app does not collect or store a password.</li>
        <li>Practice name and preferred practice-management system, if you save them.</li>
        <li>There is no checkout and no payment processor in this app.</li>
      </ul>
      <h2>Documents</h2>
      <ul>
        <li>The PDF you upload, in a private storage bucket under your account.</li>
        <li>
          The text taken from that PDF, and the fields the model returns
          (payer, patient, claim, check, and line items).
        </li>
        <li>
          That text is sent to Google Gemini, then Groq, then OpenRouter, skipping
          any provider whose API key is not set. If AI_PROVIDER=ollama, it goes
          to a local Ollama server instead. No zero-retention setting is applied
          in this code.
        </li>
        <li>Feedback text you submit from Settings.</li>
        <li>
          The public demo is fictional and stays in the browser. It is not
          written to your account.
        </li>
      </ul>
      <h2>What is not true of this project</h2>
      <ul>
        <li>It is not HIPAA compliant, and it does not sign BAAs.</li>
        <li>Files are not auto-deleted on a timer.</li>
        <li>Access is not written to an audit log.</li>
        <li>Extraction is not guaranteed, and model output can be wrong.</li>
      </ul>
      <h2>How long data stays</h2>
      <p>
        Until you delete a batch, or until the rows are removed from the
        database. There is no self-serve “delete my account” button. Email{" "}
        <a href="mailto:shanifadhil33@gmail.com">shanifadhil33@gmail.com</a> if
        you want an account removed.
      </p>
    </LegalPage>
  );
}
