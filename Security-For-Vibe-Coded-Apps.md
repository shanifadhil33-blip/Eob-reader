Security Breakdown + My comprehensive Audit Prompt 👋

My goal is to get you good at building secure apps! To that end, learning a bit about security is tantamount. In this doc, I’ll teach you the five low-hanging fixes to patch in most vibe coded apps. I’ll also give you an end-to-end, comprehensive audit prompt you can plug into Gemini 3.1 Pro/Claude at the bottom of this document.

PS—if you like this sort of thing, try Maker School. Customer #1 guaranteed. 👋

–

~45% of AI-generated code will introduce major security vulnerabilities. 83% of exposed Supabase databases involved Row Level Security misconfigurations (very basic!)  Also, in January 2025, over 170 apps built with Lovable were found to have completely exposed databases.

There are apps getting hacked every day (OpenClaw, various federal agencies, various sensitive data providers). So this matters quite a bit, and will likely continue to matter more as agents get good at both the building and the hacking. 

The good news is that security for vibe-coded apps is honestly pretty simple once you understand the 80/20. You don't need to become a cybersecurity expert, just know the handful of low hanging fruit that most people attack and make sure your AI doesn't skip them.

That's what this module is. The 80/20 of auth and security for vibe coders!

The 80/20 of vibe coding security

~80% of security problems in vibe-coded apps come from five things:

1\.	Exposed environment variables and API keys.

2\.	Missing or broken Row Level Security (RLS) on your database.

3\.	No server-side validation (trusting the frontend for everything).

4\.	Using outdated or hallucinated packages.

5\.	Not having proper authentication middleware.

If you fix these five things, you are ahead of pretty much everyone vibe coding right now. It is not perfect (no security ever is) but it will allow you to launch apps without feeling like a fraud, or needlessly endangering people’s credentials.

I will also give you a simple prompt you can use to checklist your app during/after development to ensure you don’t make these mistakes.

1\. Environment variables and secret management

In a nutshell, lots of people will hardcode authentication tokens/secrets/environment variables into their code. This is kind of like putting your password on a sticky note and attaching it to your computer. Very dumb! Also, lots of hackers/etc will just go through your website/app and look for hardcoded mentions of “NEXT\_PUBLIC\_”, which is a common string prefix before a key.

You don’t do this anymore. Instead, you put them all in a file, like a .env, and then reference them using “imports”. You also change the name of the code that imports any keys, to obfuscate and prevent people from running simple ctrl+f and finding sections of code that contain keys.

Anyway, the exact syntax is unimportant, but by doing it this way, you never have the actual key in plaintext in a file, which fixes a really low hanging fruit.

2\. Row level security (RLS)

If you're using Supabase (which most vibe coders are rn), Row Level Security is probably the single most important security feature you need to add.

In simple terms, without RLS, anyone who has your Supabase URL and anon key (which are public, by design) can read, write, and delete every single row in your database. Just how Supabase works by default. 

RLS on the other hand, is the thing that says "hey, User A can only see User A's data."  Which makes sense. It isn’t enabled by default for some reason, though imo it should be. But you can just turn this on and fix like 90% of errors.

PS—83% of exposed Supabase databases involve RLS misconfigurations. And AI tools will often create tables without enabling RLS, or enable it without actually adding policies, which makes every query return empty results and looks like a bug instead of a security issue. Luckily you can just click “enable” and it will be fine.

3\. Server-side validation

Big issue AI does frequently: it puts validation on the frontend. If you didn’t know what this meant, it does logic like “the form checks that the email is valid and the password is 8 characters" directly in the code that is exposed to users (which you can access in network requests). 

Then on the server side it just trusts whatever comes in. Which is a glaring security flaw, since anyone with basic developer tools can bypass frontend validation entirely. They can open the browser console, call your API directly with curl, or use a tool like Postman. 

Luckily, this is a similarly easy fix. You just tell your AI model to validate everything on the server. E.g if your app expects an email to sign it up, you just validate that it's actually an email on the server, not on the frontend of your app. 

4\. Dependency/package security

When AI generates code, it will sometimes references packages that don't exist. As in, your AI will just make up a package name. It happens less often now with good models, but still ~5% of AI-generated code contains references to non-existent packages. 

The funny part is attackers know this. They will create malicious packages with those exact made-up names, and then when your AI goes to install the package, it installs their malware, which usually executes things like “give Nick all of your API keys”.

Also: AI tends to reference older versions of libraries or use deprecated APIs. This means you might be pulling in packages with known security vulnerabilities that were patched months or years ago. So you must ensure you get updated packages as often as possible.

5\. Authentication middleware

Maybe you've now got login working and users can sign up. Great! But part of an app is making sure that every “protected” page and every “API route” actually checks whether the user is logged in first before allowing them access. 

A lot of vibe coded apps don’t! And what happens is you end up with some pages that check auth and some that don't. E.g maybe your dashboard checks, but your settings page doesn't. And then an attacker will just go to your settings page and change whatever the heck they want (or run up your API bill lol).

You can avoid this by just ensuring middleware secures all routes.

Some bonuses

The five things above cover like 80% of what you need. But if you want to go further, here are the other things that are worth knowing about:

Rate limiting

If you have API routes that do expensive things (calling OpenAI, sending emails, etc.), add rate limiting. Because without it, someone can spam your endpoint and rack up a huge bill on your account. Libraries like @upstash/ratelimit or a simple Redis-based solution work well. Prompt below includes this.

CORS Configuration

Cross-Origin Resource Sharing basically controls which domains can call your API. By default, the most popular framework’s (Next.js) API routes don't have CORS restrictions when called server-side. Easy fix as well.

File Upload Security

If your app handles file uploads, you should have your agent set up a script that validates the file type and size on the server side. Don't trust the file extension. Some people upload files that look like one thing but are actually another thing.

Security audit prompt

Below is a prompt you can copy and paste directly into Claude to have it audit your entire codebase for security issues. It's designed specifically for vibe-coded apps using the typical stack (Next.js, Supabase, TypeScript) although it will work regardless for most things.

Just paste this into a new Claude conversation, and it'll go through your codebase systematically. I've structured it as a checklist so you can track what's been reviewed. The prompt asks Claude to output findings in a specific format that makes it easy to prioritize fixes.

Obviously, AI security reviews aren't perfect. They're good at catching common patterns but can miss complex cross-file vulnerabilities or business logic issues. If you really wanted to be super sure, you would actually manually go through each file, check your database, etc. But the whole point of vibe-coding is sacrificing some precision for speed, so YMMV. 

Basically: do not take this as a legal, binding agreement from me to you that your app will be 100% secure if you use the prompt! No app ever is. Just shades of grey. 

Here's the prompt:





=== SECURITY AUDIT PROMPT (COPY EVERYTHING BELOW THIS LINE) ===



&nbsp; <role>

&nbsp; You are a senior application security engineer specializing in

&nbsp; AI-generated codebases. You have deep expertise in the OWASP Top 10,

&nbsp; CWE database, and the specific vulnerability patterns introduced by

&nbsp; LLM code generation (hallucinated packages, missing server-side

&nbsp; validation, default-open database policies, hardcoded secrets, and

&nbsp; inconsistent auth middleware).



&nbsp; You are conducting a comprehensive security audit of a vibe-coded web

&nbsp; application. "Vibe-coded" means this application was primarily built

&nbsp; using AI coding assistants like Claude, Cursor, Copilot, or similar

&nbsp; tools. These tools produce functional code fast but routinely introduce

&nbsp; security gaps that a human developer would typically catch.



&nbsp; Your job is to find every one of those gaps.

&nbsp; </role>





&nbsp; <methodology>

&nbsp; Work through the codebase in two passes:



&nbsp; PASS 1 — DISCOVERY

&nbsp; Read the entire codebase before making any findings. Build a mental

&nbsp; model of the architecture: framework, database, auth provider, API

&nbsp; layer, deployment config. Identify every entry point (pages, API

&nbsp; routes, server actions, webhooks, cron jobs). Map the data flow from

&nbsp; user input to database and back.



&nbsp; PASS 2 — SYSTEMATIC AUDIT

&nbsp; Work through each section of the checklist below. For every checklist

&nbsp; item, do one of three things:

&nbsp;   ✅ PASS   — The codebase handles this correctly. Cite the file/line.

&nbsp;   ❌ FAIL   — A vulnerability exists. Document it fully (see format).

&nbsp;   ⚠️ PARTIAL — Some coverage but gaps remain. Explain what's missing.

&nbsp;   ⬚ N/A    — Not applicable to this codebase. State why briefly.



&nbsp; Do not skip items. Do not summarize groups of items together. Every

&nbsp; single checklist item gets its own explicit verdict.

&nbsp; </methodology>



&nbsp; <output\_format>

&nbsp; For every ❌ FAIL finding, use this exact structure:



&nbsp; ┌─────────────────────────────────────────────────────────┐

&nbsp; │ FINDING #\[number]                                       │

&nbsp; ├──────────┬──────────────────────────────────────────────┤

&nbsp; │ Severity │ CRITICAL / HIGH / MEDIUM / LOW               │

&nbsp; │ Category │ e.g., Secret Exposure, Missing RLS, etc.     │

&nbsp; │ Location │ file/path.ts:line\_number                     │

&nbsp; │ CWE      │ CWE-XXX (Name)                              │

&nbsp; ├──────────┴──────────────────────────────────────────────┤

&nbsp; │ What's wrong:                                           │

&nbsp; │ \[Plain English description of the vulnerability]        │

&nbsp; │                                                         │

&nbsp; │ Why it matters:                                         │

&nbsp; │ \[What an attacker could actually do with this]          │

&nbsp; │                                                         │

&nbsp; │ The vulnerable code:                                    │

&nbsp; │ ```                                                     │

&nbsp; │ \[exact code snippet]                                    │

&nbsp; │ ```                                                     │

&nbsp; │                                                         │

&nbsp; │ The fix:                                                │

&nbsp; │ ```                                                     │

&nbsp; │ \[corrected code snippet, ready to copy/paste]           │

&nbsp; │ ```                                                     │

&nbsp; │                                                         │

&nbsp; │ Effort: ~\[X] minutes                                    │

&nbsp; └─────────────────────────────────────────────────────────┘

&nbsp; </output\_format>



&nbsp; <audit\_checklist>



&nbsp; ## Section 1: Environment Variables And Secret Management



&nbsp; Search every file in the codebase for each of the following. This

&nbsp; includes source files, config files, scripts, and any .env files

&nbsp; that may have been committed to the repository.



&nbsp; - \[ ] 1.1 — Hardcoded secrets: Search for API keys, tokens, passwords,

&nbsp;       connection strings, and webhook URLs embedded directly in source

&nbsp;       code. Common patterns to grep for:

&nbsp;         sk\_live\_, sk\_test\_, sk-, pk\_live\_,

&nbsp;         Bearer, eyJ (base64 JWT prefix),

&nbsp;         ghp\_, gho\_, github\_pat\_,

&nbsp;         xoxb-, xoxp- (Slack tokens),

&nbsp;         AKIA (AWS access keys),

&nbsp;         any 32+ character alphanumeric strings in quotes



&nbsp; - \[ ] 1.2 — .gitignore coverage: Verify that .env, .env.local,

&nbsp;       .env.production, and .env\*.local are all in .gitignore. Check

&nbsp;       git history for any previously committed .env files (even if

&nbsp;       since removed, secrets in git history are still exposed).



&nbsp; - \[ ] 1.3 — Public prefix leaks: Check that server-only secrets do

&nbsp;       NOT use framework public prefixes. In Next.js, anything with

&nbsp;       NEXT\_PUBLIC\_ is bundled into client JavaScript and visible to

&nbsp;       anyone. In Vite, the prefix is VITE\_. In Create React App, it

&nbsp;       is REACT\_APP\_. Keys that must NEVER be public-prefixed include:

&nbsp;         - Database service role keys

&nbsp;         - Stripe secret keys

&nbsp;         - OpenAI / Anthropic API keys

&nbsp;         - SMTP credentials

&nbsp;         - Any key that grants write/admin access



&nbsp; - \[ ] 1.4 — Console/error leaks: Search for console.log, console.error,

&nbsp;       and error boundary components that might print environment

&nbsp;       variables or secrets to the browser console or to client-visible

&nbsp;       error messages.



&nbsp; - \[ ] 1.5 — Build artifact exposure: Check if source maps are enabled

&nbsp;       in production (next.config.js productionBrowserSourceMaps,

&nbsp;       vite sourcemap config, etc). Source maps let anyone reconstruct

&nbsp;       your original source code including any inlined secrets.



&nbsp; - \[ ] 1.6 — Startup validation: Verify the app fails fast if required

&nbsp;       environment variables are missing, rather than silently running

&nbsp;       with undefined values (which often causes cryptic runtime errors

&nbsp;       or, worse, falls back to insecure defaults).



&nbsp; ## Section 2: Database Security



&nbsp; If the app uses Supabase, Firebase, or any database with client-side

&nbsp; access, this section is critical. If using a traditional server-only

&nbsp; database (e.g., Prisma with PostgreSQL, no client-side SDK), adapt

&nbsp; checks accordingly and note the architecture.



&nbsp; - \[ ] 2.1 — RLS enabled: Verify Row Level Security is enabled on

&nbsp;       EVERY table in the public schema. Check for any tables created

&nbsp;       via migrations or SQL editor that might have been missed. A

&nbsp;       single unprotected table exposes all its data to anyone with

&nbsp;       the anon key.



&nbsp; - \[ ] 2.2 — RLS policies exist: A table with RLS enabled but NO

&nbsp;       policies silently returns empty results for all queries. This

&nbsp;       looks like a bug, not a security issue, and is a common AI

&nbsp;       mistake. Verify every RLS-enabled table has at least SELECT

&nbsp;       and INSERT policies.



&nbsp; - \[ ] 2.3 — WITH CHECK clauses: Verify all INSERT and UPDATE policies

&nbsp;       include WITH CHECK clauses. Without WITH CHECK on INSERT, a

&nbsp;       user can insert rows with any user\_id (impersonating other

&nbsp;       users). Without WITH CHECK on UPDATE, a user can change a

&nbsp;       row's user\_id to steal ownership.



&nbsp; - \[ ] 2.4 — Policy identity source: Ensure RLS policies use

&nbsp;       auth.uid() for identity, NOT auth.jwt()->'user\_metadata'.

&nbsp;       User metadata can be modified by authenticated end users,

&nbsp;       making it an unreliable identity source.



&nbsp; - \[ ] 2.5 — Service role key isolation: The service\_role key bypasses

&nbsp;       all RLS. Verify it is NEVER used in client-side code, never

&nbsp;       imported in components, and only used in server-side code where

&nbsp;       RLS bypass is genuinely necessary (admin operations, webhooks).



&nbsp; - \[ ] 2.6 — Storage bucket policies: If using Supabase Storage, verify

&nbsp;       storage buckets have RLS policies. By default, storage buckets

&nbsp;       are publicly accessible.



&nbsp; - \[ ] 2.7 — SQL injection: Check for any raw SQL queries using string

&nbsp;       concatenation or template literals instead of parameterized

&nbsp;       queries. The Supabase client library is safe by default, but

&nbsp;       raw .rpc() calls or pg/postgres.js queries may not be.



&nbsp; - \[ ] 2.8 — SECURITY DEFINER functions: Check for any database

&nbsp;       functions marked SECURITY DEFINER. These run with the

&nbsp;       privileges of the function creator (usually superuser), not

&nbsp;       the calling user. Verify they don't expose data or bypass RLS.



&nbsp; ## Section 3: Authentication And Session Management



&nbsp; - \[ ] 3.1 — Auth middleware exists: Verify authentication middleware

&nbsp;       (e.g., Next.js middleware.ts, Express middleware, etc.) exists

&nbsp;       and runs on protected routes. Check the matcher config to

&nbsp;       ensure it covers all necessary paths.



&nbsp; - \[ ] 3.2 — Default-deny routing: Check whether the middleware

&nbsp;       protects routes by default (allowlist of public routes) vs.

&nbsp;       protecting routes by exception (blocklist of protected routes).

&nbsp;       Default-deny (allowlist) is significantly safer because new

&nbsp;       routes are automatically protected.



&nbsp; - \[ ] 3.3 — getUser() vs getSession(): For Supabase apps, verify

&nbsp;       that security-sensitive server-side operations use

&nbsp;       supabase.auth.getUser() (which validates the JWT against

&nbsp;       Supabase servers) rather than supabase.auth.getSession()

&nbsp;       (which only reads the local JWT without verification).



&nbsp; - \[ ] 3.4 — Auth callback handler: Verify the /auth/callback route

&nbsp;       (or equivalent) properly exchanges auth codes for sessions,

&nbsp;       handles errors gracefully, and doesn't expose tokens in URLs

&nbsp;       or logs.



&nbsp; - \[ ] 3.5 — Session storage: Verify session tokens are stored in

&nbsp;       httpOnly cookies, NOT in localStorage or sessionStorage (which

&nbsp;       are accessible to any JavaScript on the page, including XSS

&nbsp;       payloads).



&nbsp; - \[ ] 3.6 — Protected API routes: Check that EVERY API route

&nbsp;       handling user data verifies authentication before processing.

&nbsp;       Look for API routes that skip the auth check entirely,

&nbsp;       especially ones that AI may have added later in development.



&nbsp; - \[ ] 3.7 — OAuth security: If OAuth is implemented, verify callback

&nbsp;       URLs are validated, state parameters are used for CSRF

&nbsp;       protection, and tokens are handled securely.



&nbsp; - \[ ] 3.8 — Password reset flows: If applicable, verify reset tokens

&nbsp;       expire, are single-use, and are transmitted securely.



&nbsp; ## Section 4: Server-Side Validation



&nbsp; - \[ ] 4.1 — Schema validation: Verify all API routes and server

&nbsp;       actions validate input using a schema validation library (Zod,

&nbsp;       Yup, Valibot, ArkType, etc.) on the server side. Frontend

&nbsp;       validation is UX, not security. Every input must be re-checked

&nbsp;       server-side.



&nbsp; - \[ ] 4.2 — Identity from session: Verify user identity for write

&nbsp;       operations is ALWAYS derived from the authenticated session or

&nbsp;       JWT token, never from request body fields like { userId: "..." }.

&nbsp;       An attacker can send any userId they want in a request body.



&nbsp; - \[ ] 4.3 — Input sanitization: Check that user-generated content

&nbsp;       rendered in HTML is properly sanitized to prevent Cross-Site

&nbsp;       Scripting (XSS). Look for dangerouslySetInnerHTML, v-html,

&nbsp;       \[innerHTML], or unescaped template literals that render user

&nbsp;       content.



&nbsp; - \[ ] 4.4 — HTTP method enforcement: Verify state-changing operations

&nbsp;       use POST/PUT/PATCH/DELETE, not GET. GET requests can be triggered

&nbsp;       by image tags, link prefetching, and browser extensions without

&nbsp;       user intent.



&nbsp; - \[ ] 4.5 — Error information leaks: Verify error responses don't

&nbsp;       leak internal details (stack traces, SQL errors, file paths,

&nbsp;       environment variable names) to the client. Check both API

&nbsp;       routes and error boundary components.



&nbsp; - \[ ] 4.6 — Webhook signature verification: If the app receives

&nbsp;       webhooks (Stripe, GitHub, etc.), verify it validates the

&nbsp;       webhook signature before processing. Without verification,

&nbsp;       anyone can send fake webhook events to your endpoint.



&nbsp; ## Section 5: Dependency And Package Security



&nbsp; - \[ ] 5.1 — Audit results: Run the package manager's audit command

&nbsp;       (npm audit, pnpm audit, yarn audit, bun audit) and report any

&nbsp;       vulnerabilities found, grouped by severity.



&nbsp; - \[ ] 5.2 — Hallucinated packages: Check for any installed packages

&nbsp;       with suspiciously low download counts, very recent publish

&nbsp;       dates, or names that don't match well-known packages. AI tools

&nbsp;       sometimes hallucinate package names, and attackers publish

&nbsp;       malware under those names.



&nbsp; - \[ ] 5.3 — Lockfile committed: Verify a lockfile (package-lock.json,

&nbsp;       pnpm-lock.yaml, yarn.lock, bun.lockb) is committed to the

&nbsp;       repository. Without it, npm install can silently pull different

&nbsp;       (potentially compromised) versions.



&nbsp; - \[ ] 5.4 — Outdated packages: Check for outdated packages,

&nbsp;       especially those with known CVEs. Pay particular attention to

&nbsp;       auth libraries, crypto libraries, and framework versions.



&nbsp; - \[ ] 5.5 — Unused dependencies: AI tends to install packages it

&nbsp;       ends up not using. Each unused package is unnecessary attack

&nbsp;       surface. Check for packages in package.json that aren't

&nbsp;       imported anywhere in the codebase.



&nbsp; ## Section 6: Rate Limiting



&nbsp; - \[ ] 6.1 — Expensive operations: Identify all API routes that call

&nbsp;       external paid APIs (OpenAI, Anthropic, Stripe, email/SMS

&nbsp;       providers, etc.) and verify they have rate limiting. Without

&nbsp;       it, an attacker can spam the endpoint and run up a massive

&nbsp;       bill on the developer's account.



&nbsp; - \[ ] 6.2 — Auth endpoints: Verify login, signup, password reset,

&nbsp;       and OTP endpoints have rate limiting to prevent brute force

&nbsp;       attacks and credential stuffing.



&nbsp; - \[ ] 6.3 — Implementation check: If rate limiting exists, verify

&nbsp;       it's applied server-side (not just frontend debouncing) and

&nbsp;       uses a reliable backing store (Redis, Upstash, or similar)

&nbsp;       rather than in-memory storage that resets on deploy.



&nbsp; ## Section 7: CORS Configuration



&nbsp; - \[ ] 7.1 — API route CORS: If the app exposes API routes intended

&nbsp;       only for its own frontend, verify CORS headers restrict access

&nbsp;       to the app's own domain(s). Check for Access-Control-Allow-

&nbsp;       Origin: \* on sensitive endpoints.



&nbsp; - \[ ] 7.2 — Credentials mode: If CORS is configured, verify

&nbsp;       Access-Control-Allow-Credentials is only true when paired with

&nbsp;       specific (not wildcard) origins.



&nbsp; ## Section 8: File Upload Security



&nbsp; - \[ ] 8.1 — Server-side validation: If the app handles file uploads,

&nbsp;       verify file type and size are validated on the server, not just

&nbsp;       the frontend. Check MIME type, not just file extension (users

&nbsp;       can rename malware.exe to photo.jpg).



&nbsp; - \[ ] 8.2 — Storage permissions: Verify uploaded files are stored

&nbsp;       with appropriate access controls. Public uploads (profile

&nbsp;       photos) and private uploads (documents) should have different

&nbsp;       policies.



&nbsp; - \[ ] 8.3 — Execution prevention: Verify uploaded files cannot be

&nbsp;       executed on the server. Check that upload directories are not

&nbsp;       in the web root's executable path.



&nbsp; </audit\_checklist>



&nbsp; <final\_report>

&nbsp; After completing all checklist items, compile your findings into this

&nbsp; structure:



&nbsp; ## 1. Security Posture Rating



&nbsp; Rate the overall codebase:

&nbsp;   🔴 CRITICAL — Active data exposure or auth bypass. Stop and fix now.

&nbsp;   🟠 NEEDS WORK — Significant gaps that would be exploitable.

&nbsp;   🟡 ACCEPTABLE — Minor issues, no immediate data exposure risk.

&nbsp;   🟢 STRONG — Well-secured with only informational findings.



&nbsp; Include a one-paragraph executive summary explaining the rating.



&nbsp; ## 2. Critical And High Findings



&nbsp; List all CRITICAL and HIGH severity findings here for immediate

&nbsp; visibility, even though they appear in the section-by-section results

&nbsp; above. These are the "stop everything and fix this" items.



&nbsp; ## 3. Quick Wins



&nbsp; List fixes that take under 10 minutes each but meaningfully improve

&nbsp; security posture. These are satisfying to knock out and build momentum.



&nbsp; ## 4. Prioritized Remediation Plan



&nbsp; A numbered list of ALL findings ordered by:

&nbsp;   1st — Severity (critical before high before medium before low)

&nbsp;   2nd — Effort (quick fixes before complex refactors within each tier)



&nbsp; For each item, include the estimated fix time so the developer can

&nbsp; plan their work.



&nbsp; ## 5. What's Already Done Right



&nbsp; List security measures that are properly implemented. This is important

&nbsp; because it tells the developer what NOT to accidentally break, and

&nbsp; reinforces good patterns they should continue using.



&nbsp; ## 6. Checklist Summary



&nbsp; Output a compact summary of every checklist item and its verdict:

&nbsp;   1.1 ✅  1.2 ✅  1.3 ❌  1.4 ✅  1.5 ⚠️  1.6 ⬚ ...

&nbsp; This gives an at-a-glance view of coverage.

&nbsp; </final\_report>



&nbsp; <instructions>

&nbsp; Begin the audit now.



&nbsp; Read the full codebase before producing any findings. Understand the

&nbsp; architecture first. Then work through every checklist item one by one.



&nbsp; Be thorough but practical. Prioritize real, exploitable vulnerabilities

&nbsp; over theoretical concerns. If a finding requires a specific, unusual

&nbsp; attacker capability, note that in the severity assessment.



&nbsp; Do not group multiple checklist items into a single response. Each item

&nbsp; gets its own explicit pass/fail/partial/n-a verdict.



&nbsp; If you are uncertain about a finding, flag it as ⚠️ PARTIAL and

&nbsp; explain what you'd need to verify.

&nbsp; </instructions>



&nbsp; === END OF SECURITY AUDIT PROMPT ===





