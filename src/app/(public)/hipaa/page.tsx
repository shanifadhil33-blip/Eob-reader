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
          The app reads the PDF text in the browser and sends that text to the
          configured extraction providers, in order: Google Gemini, then Groq,
          then OpenRouter. A provider with no API key is skipped. If{" "}
          <span className="font-mono text-sm">AI_PROVIDER=ollama</span> is set,
          the text goes to a local Ollama server instead.
        </li>
        <li>
          A scanned PDF with no text layer is not extracted. You get a short
          message, and that file is removed from storage instead of being kept
          as an empty row.
        </li>
        <li>Nothing is deleted on a schedule. Delete a batch when you want it gone.</li>
        <li>There is no audit log. Sign-in is Google. This app does not store a password.</li>
      </ul>
      <p>
        Questions:{" "}
        <a href="mailto:shanifadhil33@gmail.com">shanifadhil33@gmail.com</a>
      </p>
    </LegalPage>
  );
}
