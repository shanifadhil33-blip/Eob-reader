import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Data handling · EOB Reader",
  description:
    "EOB Reader is a portfolio project. It is not a HIPAA product and is not for real patient information.",
};

export default function DataHandlingPage() {
  return (
    <LegalPage title="Data handling">
      <p>
        EOB Reader is a portfolio project for learning. It is not a
        HIPAA-compliant product. It does not offer a Business Associate
        Agreement, and it is not for real patient information.
      </p>
      <h2>What happens to a file you upload</h2>
      <ul>
        <li>
          The PDF is stored in a private Supabase Storage bucket, in a folder
          for your account.
        </li>
        <li>
          The app reads the PDF text in the browser and sends that text to
          OpenRouter (model <span className="font-mono text-sm">openai/gpt-4o-mini</span>
          ) to draft line items. If <span className="font-mono text-sm">AI_PROVIDER=ollama</span>{" "}
          is set, the text goes to a local Ollama server instead. This project
          does not configure a zero-retention or no-training option on that
          request.
        </li>
        <li>
          Scanned PDFs with no text layer are skipped. The file is still
          uploaded first, and deleting the batch does not remove that skipped
          copy.
        </li>
        <li>
          Nothing is deleted on a schedule. Files and rows stay until you
          delete the batch, or until the data is removed from the database.
        </li>
        <li>
          There is no audit log of views, edits, or exports. Sign-in is an
          email code or Google. This app does not store a password.
        </li>
        <li>
          If you subscribe, Polar handles the payment. The PDF is not sent to
          Polar.
        </li>
      </ul>
      <p>
        Questions:{" "}
        <a href="mailto:shanifadhil33@gmail.com">shanifadhil33@gmail.com</a>
      </p>
      <p>
        <Link href="/privacy">Privacy</Link>
        {" · "}
        <Link href="/terms">Terms</Link>
      </p>
    </LegalPage>
  );
}
