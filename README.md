# EOB Reader

A portfolio project that reads text-based dental Explanation of Benefits PDFs, drafts line items for a person to review, and exports an X12 835 file or a CSV for Dentrix, Eaglesoft, or Open Dental.

It is a learning project by Adhil. It is **not** a HIPAA product, it does not offer a Business Associate Agreement, and it is **not** for real patient information. Use fictional documents only.

Live site: https://eob-reader.vercel.app

## What it actually does

- Upload text-based PDFs (up to 200 at a time). The text layer is read in the browser with pdf.js.
- Scanned PDFs with no text layer are skipped.
- That text is sent to OpenRouter (`openai/gpt-4o-mini`). A local Ollama path exists if `AI_PROVIDER=ollama`.
- You approve, flag, or reject each draft before export.
- Approved rows can be downloaded as an X12 835 or as a PMS CSV.

Sign-in is an email code or Google, through Supabase. Billing is Polar: a 14-day trial, then a $29/month Pro plan. There is no public demo yet.

## Honest limits

- No automatic deletion. The only scheduled route is a keep-alive check.
- No audit log is written. The `audit_log` table is unused, and so is `payer_templates`.
- A multi-patient EOB keeps only the first patient the model returns.
- The 835 builder can insert CO-45 or OA-23 adjustments so the file balances.
- `Security-For-Vibe-Coded-Apps.md` is a generic note that shipped with the repo. It is not this app’s security policy.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port 3020. Without Supabase env vars the marketing pages still render, and sign-in does not work.

Copy the variables you need into `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (webhooks and keep-alive)
- `OPENROUTER_API_KEY`
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `NEXT_PUBLIC_POLAR_PRODUCT_ID`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (keep-alive)

Apply `supabase/migrations` in order before using upload or billing.

Questions: shanifadhil33@gmail.com
