import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms · EOB Reader",
  description:
    "Terms for the EOB Reader portfolio project. Fictional data only. Not a HIPAA service.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms">
      <p>
        EOB Reader is a personal portfolio and learning project. It is not for
        sale. By using it you agree to these terms. If you do not agree, do not
        use it.
      </p>
      <h2>What you are using</h2>
      <ul>
        <li>
          A tool that reads text from a dental EOB PDF, drafts line items, lets
          you review them, and downloads an X12 835 file or a CSV.
        </li>
        <li>
          A public demo with fictional patients. The demo does not create an
          account and does not save anything.
        </li>
        <li>
          Not a HIPAA service, not a clearinghouse, and not advice about
          billing, dentistry, or the law.
        </li>
        <li>
          The draft can be wrong. Review is required before export. The 835
          file can add balancing adjustments (CO-45 or OA-23) so the totals
          line up. Check the file before you rely on it.
        </li>
      </ul>
      <h2>Your account</h2>
      <p>
        Sign-in is Google. There is no paid plan. You are responsible for the
        account you create and for keeping real patient information off this
        site.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Use fictional data only. Do not upload real patient information.</li>
        <li>Do not try to access someone else’s files or account.</li>
        <li>Do not use the service to harm another person or to break the law.</li>
      </ul>
      <h2>No warranty</h2>
      <p>
        The project is provided as-is. It can be wrong, incomplete, or offline.
        Questions go to{" "}
        <a href="mailto:shanifadhil33@gmail.com">shanifadhil33@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
