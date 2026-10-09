# EOB Reader

A portfolio project that reads text-based dental Explanation of Benefits PDFs, drafts line items for a person to review, and exports an X12 835 file or a CSV for Dentrix, Eaglesoft, or Open Dental.

It is a learning project by Adhil. It is **not** for sale, **not** a HIPAA product, and **not** for real patient information. Use fictional documents only.

Live site: https://eob-reader.vercel.app

## What it actually does

- A public landing page and a public fictional demo. The demo reviews a made-up batch and builds an 835 or CSV in the browser. It is not saved.
- Sign-in is one Google button. After that, the app shows only that account’s uploads.
- Upload text-based PDFs. The text layer is read in the browser with pdf.js.
- A scanned PDF with no text layer is skipped, with a short message, and is not kept in storage.
- That text is sent to a free-tier provider chain. Google Gemini is first, then Groq, then the existing OpenRouter chain. A provider whose API key is missing is skipped. Set `AI_PROVIDER=ollama` to use a local Ollama server instead.
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

Copy the variables you need into `.env.local`. See `.env.example`.

Extraction tries providers in this order and skips any whose key is unset:

- `GEMINI_API_KEY` — Google Gemini REST (`generativelanguage.googleapis.com`). Optional `GEMINI_MODELS` is a comma-separated list. The default is `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash,gemini-2.5-flash-lite`. Flash-Lite models are listed first because this key allows about 500 of those requests a day and about 20 Flash requests a day. A 429, 403, 404, or 5xx moves to the next model. Output is capped around 4000 tokens and asked for as JSON.
- `GROQ_API_KEY` — Groq’s OpenAI-compatible API. Optional `GROQ_MODEL` defaults to `openai/gpt-oss-120b`. That model spends tokens on reasoning, so the request asks for up to 6000 output tokens when they fit. Groq’s free tier allows about 8,000 tokens per minute and counts the prompt plus the `max_tokens` you request, so a long EOB gets a smaller ceiling. A request that still does not fit falls through.
- `OPENROUTER_API_KEY` — last resort. Same model order and request shape as before: `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`, then `meta-llama/llama-3.3-70b-instruct`, with `max_tokens` 4000.

Users never see the provider’s error text. A signed-in `GET /api/ai-health` pings the first model of each configured provider and does not return keys. Add `?all=1` to ping every model. That full check spends more of the daily quota.

Other variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (keep-alive)
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (keep-alive)
- `AI_PROVIDER`, `OLLAMA_URL`, `OLLAMA_MODEL` (optional local model)

Apply `supabase/migrations` in order before using upload. `004_drop_billing_columns.sql` drops leftover trial and Polar columns. Apply it by hand in the Supabase SQL editor. The app does not read those columns, so it works before the file is applied.

Questions: shanifadhil33@gmail.com
