# EOB Reader

A portfolio project that reads text-based dental Explanation of Benefits PDFs, drafts line items for a person to review, and exports an X12 835 file or a CSV for Dentrix, Eaglesoft, or Open Dental.

It is a learning project by Adhil. It is **not** for sale, **not** a HIPAA product, and **not** for real patient information. Use fictional documents only.

Live site: https://eob-reader.vercel.app

## What it actually does

- A public landing page and a public fictional demo. The demo reviews a made-up batch and builds an 835 or CSV in the browser. It is not saved.
- Sign-in is one Google button. After that, the app shows only that account’s uploads.
- Upload text-based PDFs. The text layer is read in the browser with pdf.js.
- A scanned PDF with no text layer is skipped, with a short message, and is not kept in storage.
- That text is sent to OpenRouter (`openai/gpt-4o-mini`). A local Ollama path exists if `AI_PROVIDER=ollama`.
- You approve, flag, or reject each draft before export.
- Approved rows can be downloaded as an X12 835 or as a PMS CSV.

## Honest limits

- No billing, trial, or daily cap.
- No automatic deletion. The only scheduled route is a keep-alive check.
- No audit log is written. The `audit_log` table is unused, and so is `payer_templates`.
- A multi-patient EOB keeps only the first patient the model returns.
- The 835 builder can insert CO-45 or OA-23 adjustments so the file balances.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port 3020. Without Supabase env vars the marketing page and the demo still render. Google sign-in does not.

Copy the variables you need into `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (keep-alive)
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (keep-alive)

Apply `supabase/migrations` in order before using upload. `004_drop_billing_columns.sql` drops leftover trial and Polar columns. Apply it by hand in the Supabase SQL editor. The app does not read those columns, so it works before the file is applied.

Questions: shanifadhil33@gmail.com
