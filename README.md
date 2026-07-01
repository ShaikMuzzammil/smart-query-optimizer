# SmartQuery — Query Intelligence Platform

> SQL Optimizer · NL to SQL · Schema Vault · Playground · Examples · Analytics

---

## ✅ What's fixed in v8 (this release)

<details>
<summary>Click to expand v8 fix list</summary>

| # | Screenshot | Root Cause | Fix |
|---|---|---|---|
| 1 | **Optimizer** "Optimization Unavailable" | All 5 Gemini model IDs in the fallback chain were shut down by Google (gemini-1.5-pro/flash/flash-8b, gemini-pro, gemini-1.0-pro → all 404) | `lib/ai-engine.ts` updated to current, live model chain: `gemini-flash-latest → gemini-2.5-flash → gemini-3.5-flash → gemini-2.5-pro → gemini-2.5-flash-lite` |
| 2 | **NL to SQL** "Conversion Unavailable" | Same dead model chain — every fallback attempt returned 404 | Fixed by the same model chain update above |
| 3 | **Analytics** stuck on "Loading…" forever | Streak calculation used up to 60 sequential DB round-trips awaited one at a time — exceeded Vercel serverless function time limit | Single `UNION` SQL query replaces the loop; always returns in one round-trip |
| 4 | **Analytics** no error state | `useSWR` failure silently kept the spinner running with no retry option | Added proper `error && !data` state with a visible error card and Retry button |
| 5 | **Playground** always replays same canned result regardless of what was typed | `handleRun` always rendered `selected.mockRows` — user edits were ignored | Now uses `alasql` (in-browser SQL engine) to actually execute edited queries against seeded sample tables; curated patterns still show verified mock output |
| 6 | **Examples** no expand/collapse | All queries always fully expanded — long advanced queries dominated the page | Per-card expand/collapse toggle; queries ≥ 8 lines default to collapsed; "Expand All / Collapse All" controls at the top |
| 7 | **Settings** content flush to sidebar | Lacked `mx-auto` centering and `lg:p-10` horizontal padding | Added `max-w-3xl mx-auto` wrapper and `lg:p-10` responsive padding |
| 8 | **Optimizer** invalid input → vague error | Submitting non-SQL text produced confusing service errors | Lightweight `looksLikeSql` regex check shows an inline "That doesn't look like SQL" notification immediately; button disabled until fixed |
| 9 | **Smart Tips** (new) | No contextual in-app help across any feature | Floating bottom-right `SmartTips` widget — page-aware tips for all 8 routes, no AI branding, "Next tip" cycle |
| 10 | **Landing page** subtitle | "SQL Intelligence Platform" in two places | Changed to "Query Intelligence Platform" in navbar logo and hero tagline |
| 11 | **Landing page** badge icon | Used generic `<Sparkles>` icon | Replaced with `<Database>` icon; badge text updated to "Query performance at production scale" |
| 12 | **Landing page** Why section (new) | No section explaining why this platform vs alternatives | Added "Why SmartQuery?" section with 6 value-prop cards and a dedicated `#why` nav link — no competitor comparisons |
| 13 | **Health endpoint** | `GET /api/health` only checked that `GEMINI_API_KEY` existed — never tested the model actually worked | Now performs a live `generateContent` ping; catches wrong/expired keys and dead model IDs before they cause silent Optimizer failures |

</details>

---

## ✅ What was fixed in v7 (previous release)

<details>
<summary>Click to expand v7 fix list</summary>

| # | Prompt item | Fix |
|---|---|---|
| 1 | Login session not persisting | JWT sessions, 30-day `maxAge`, redirect race condition fixed |
| 2 | AI provider exposed in errors | Gemini-only engine, generic "Service Temporarily Unavailable" messages |
| 3 | Analytics only showed Optimizer stats | `/api/analytics` aggregates all 4 features |
| 4 | Export confirmation missing | `ExportMenu` modal: feature → date range → format → confirm |
| 5 | Schema Vault not editable | Inline DDL edit + re-parse, 4 example schemas |
| 6 | Abbreviations unexpanded | PII, DDL, ER, PK/FK, NL2SQL all spelled out |
| 7 | AI name in error messages | All errors generic |
| 8 | Dialect reference panel missing | All 5 dialects always visible as tabs with reference panel |
| 9 | Dashboard not universal | Pulls from all features |
| 10 | Landing page improvements | Full Features/Guide/Domains/FAQ |
| 11 | Dialect reference for all | Side-by-side strength/function/index type panels |
| 12 | Anthropic references removed | Verified clean by grep |
| 13 | History not universal | Both Optimizer + NL to SQL in unified history |
| 14 | Half-written sample queries | 25 complete, runnable queries across 9 domains |

</details>

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Auth | NextAuth v4 (JWT, 30-day sessions) |
| Database | Prisma + Neon PostgreSQL |
| AI Engine | Google Gemini (5-model fallback chain) |
| In-browser SQL | alasql v4 (Playground live execution) |
| Charts | Recharts |
| Styling | Tailwind CSS + Framer Motion |

---

## 🔑 Environment Variables for Vercel

<details>
<summary>Click to expand — all required variables</summary>

Set these under **Vercel → Your Project → Settings → Environment Variables**:

```env
# ─── Required ─────────────────────────────────────────────────────────────────

# Gemini API key — get from https://aistudio.google.com/app/apikey
# This powers the Optimizer, NL to SQL, and all AI analysis features.
GEMINI_API_KEY=AIza…

# Neon PostgreSQL — get both from https://neon.tech → your project → Connection Details
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require&pgbouncer=false

# NextAuth — two separate values needed
NEXTAUTH_URL=https://your-app.vercel.app       # exact deployed URL, no trailing slash
NEXTAUTH_SECRET=<run: openssl rand -base64 32>  # generate locally then paste here

# ─── Optional ─────────────────────────────────────────────────────────────────

# Protect the post-deploy migration endpoint (see step 3 below)
MIGRATE_SECRET=<any long random string>
```

**Quick check after deploying:** visit `https://your-app.vercel.app/api/health`. You should see:
```json
{ "status": "healthy", "checks": { "database": "ok", "ai": "ok", "nextauth": "ok" } }
```
If `ai` is `"error"`, the details field tells you exactly why (wrong key, quota exceeded, etc.) — unlike before, you don't need to attempt an optimization to find out.

</details>

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in all five required values (see table above).

### 3. Push the database schema

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add all 5 environment variables under Settings → Environment Variables
4. Deploy — Vercel runs `npm install` (which triggers `postinstall: prisma generate`) automatically
5. After first deploy, hit `POST /api/migrate` with header `Authorization: Bearer <MIGRATE_SECRET>` to push the schema to Neon
6. Verify at `/api/health`

<details>
<summary>Click to expand — using the Vercel CLI instead</summary>

```bash
npm i -g vercel
vercel login
vercel --prod
```

</details>

---

## Project Structure

<details>
<summary>Click to expand full file tree</summary>

```
smart-query-optimizer/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # shared shell + SmartTips widget
│   │   ├── dashboard/page.tsx      # universal overview
│   │   ├── optimizer/page.tsx      # SQL optimizer (shape check + Live Scanner)
│   │   ├── nl2sql/page.tsx         # NL to SQL
│   │   ├── schema/page.tsx         # Schema Vault (DDL + ER diagram)
│   │   ├── playground/page.tsx     # in-browser SQL execution (alasql)
│   │   ├── examples/page.tsx       # 25 queries, expand/collapse per card
│   │   ├── history/page.tsx        # unified history (Optimizer + NL to SQL)
│   │   ├── analytics/page.tsx      # universal analytics + retry state
│   │   └── settings/page.tsx       # centered layout, export confirmation
│   ├── api/
│   │   ├── analytics/route.ts      # single-query streak (no more timeout)
│   │   ├── auth/[...nextauth]/
│   │   ├── auth/register/
│   │   ├── conversions/route.ts
│   │   ├── export/route.ts
│   │   ├── health/route.ts         # live AI ping + detailed error info
│   │   ├── migrate/route.ts
│   │   ├── nl2sql/route.ts
│   │   ├── optimize/route.ts
│   │   └── queries/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # landing: Why section, Query Intelligence Platform
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── SmartTips.tsx           # new: floating contextual tips widget
│   └── optimizer/
│       ├── ExportMenu.tsx
│       ├── ScoreRing.tsx
│       └── SqlBlock.tsx
├── hooks/
│   └── useSwrFetcher.ts
├── lib/
│   ├── ai-engine.ts                # updated: live Gemini model chain
│   ├── auth.ts
│   └── db.ts
├── prisma/schema.prisma
├── next.config.js
├── package.json                    # alasql added to dependencies
└── README.md
```

</details>

---

## Feature Overview

<details>
<summary>Click to expand</summary>

**SQL Optimizer** — Paste any SQL and get a production-grade rewrite. A Live Scanner flags anti-patterns as you type. A shape-check notification fires immediately if the pasted text isn't valid SQL. Dialect reference panels for all 5 dialects always visible.

**Natural Language to SQL** — Describe your query in English, get production-ready SQL. Load your schema first in Schema Vault for zero hallucinations.

**Schema Vault** — Upload your DDL, get a visual Entity-Relationship (ER) diagram with PK/FK detection. Schema context flows automatically to NL to SQL.

**Playground** — Pattern Library queries show verified sample output. Edit the SQL yourself (or write your own) and it runs live against seeded sample tables via the in-browser alasql engine.

**Examples** — 25 fully-written queries across 9 domains. Cards with short queries open fully; cards with long queries default to collapsed. Expand/Collapse All controls at the top. One click sends any example straight to the Optimizer.

**Analytics** — Universal across all four active features. Streak calculated in a single SQL round-trip. Error state with Retry button on failure.

**Smart Tips** — Floating bottom-right widget on every dashboard page. Shows 1–3 contextual tips relevant to whatever feature you're currently using.

</details>

---

## Security & Privacy Notes

- PII (Personally Identifiable Information) — emails, Social Security Numbers (SSNs), card numbers — is stripped before any query is processed
- No API keys or provider names are ever surfaced in the UI
- All AI errors surface as generic messages ("Service Temporarily Unavailable")
- Your data is never used to train any model
- The `/api/migrate` endpoint is protected by `MIGRATE_SECRET`

---

## License

MIT
 (v7)

SmartQuery is a full-stack SQL intelligence platform built with Next.js 14, TypeScript, Prisma, and PostgreSQL. It optimizes SQL queries with AI, converts natural language to SQL, visualizes database schemas, and tracks your usage across every feature in one unified analytics view.

This is **v7** — a comprehensive rebuild that resolves all known issues from v6, including persistent login sessions, a 5-model Gemini fallback chain (Anthropic fully removed), universal analytics, export confirmation flows, dialect reference panels, and a curated SQL examples library.

---

## ✅ What's fixed in v7

<details>
<summary><strong>Click to expand — full list of 14 fixes applied</strong></summary>

| # | Issue | Fix |
|---|---|---|
| 1 | Login required repeatedly when switching features | JWT session strategy with 30-day `maxAge`, fixed redirect race condition with `update()` + `router.refresh()` |
| 2 | "Optimization failed" errors, wrong env vars | Switched entirely to `GEMINI_API_KEY` with a 5-model fallback chain; Anthropic fully removed |
| 3 | Analytics only showed Optimizer stats | `/api/analytics` now aggregates Optimizer, NL to SQL, Schema Vault, and Playground usage |
| 4 | Export downloaded immediately with no choice | New `ExportMenu` modal: choose features → date range/format → confirm, every time |
| 5 | Schema Vault didn't show DDL or allow edits | Added a DDL code panel at the top with character meter, inline edit, and re-parse |
| 6 | Abbreviations shown without context | PII, DDL, ER, NL2SQL, PK/FK, etc. are now spelled out on first use across the UI |
| 7 | NL to SQL "Conversion failed" exposed internals | Generic, friendly error messages — no AI provider name ever shown to users |
| 8 | No dialect-specific guidance in Optimizer | Added a "[Dialect] Reference" panel — strengths, key functions, index types |
| 9 | Dashboard only reflected Optimizer activity | Dashboard and Analytics both pull from all 4 features now |
| 10 | Landing page missing nav/home, thin content | Home link in nav + sidebar, full Features/How It Works/Guide/Domains/FAQ sections |
| 11 | Only one SQL dialect visible at a time | All 5 dialects always shown as tabs; comparison data available via the Reference panel |
| 12 | "Service unavailable" — wrong API key entirely | Same root cause as #2 — fully resolved with Gemini-only integration |
| 13 | History only showed Optimizer; API details exposed in Settings | History is feature-tagged and unified; Settings never displays API keys or provider names |
| 14 | Half-written sample queries | Every query in Examples, Playground, and NL to SQL prompts is complete and runnable |

</details>

---

## Tech Stack

Next.js 14 (App Router) · TypeScript · Prisma + PostgreSQL (Neon-compatible) · NextAuth (JWT sessions) · Tailwind CSS · Framer Motion · Google Gemini API (5-model fallback chain)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

`postinstall` automatically runs `prisma generate` — no extra step needed.

### 2. Set environment variables

Copy `.env.example` to `.env` and fill in the five required values:

<details>
<summary><strong>Click to expand — environment variable details</strong></summary>

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | Free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `DATABASE_URL` | Pooled Postgres connection string (e.g. Neon) |
| `DIRECT_URL` | Direct (non-pooled) Postgres connection string — used for migrations |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your deployed URL in production |

**Only these five are needed.** SmartQuery runs entirely on Gemini — no other AI provider key is required or used anywhere in the codebase.

</details>

### 3. Push the database schema

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same five environment variables in **Project Settings → Environment Variables**.
4. Deploy. Vercel will run `npm install` (which triggers `prisma generate` via `postinstall`) and `npm run build` automatically.
5. After the first deploy, run a migration once via the protected `/api/migrate` endpoint (or `npx prisma db push` locally pointed at your production database).

<details>
<summary><strong>Click to expand — established Vercel deployment patterns used in this project</strong></summary>

- All build-time packages are listed in `dependencies`, **not** `devDependencies` — Vercel's production install can skip `devDependencies` in some configurations, which previously caused build failures.
- `postinstall: prisma generate` in `package.json` handles Prisma client generation automatically on every install.
- `prisma/schema.prisma` sets `binaryTargets = ["native", "rhel-openssl-3.0.x"]` so the generated query engine matches Vercel's AWS Lambda runtime, not just your local machine.
- The Google Fonts `next/font/google` loader was intentionally **not** used — fonts are loaded via a plain CSS `@import` in `globals.css` instead, so the production build never depends on a live network call to `fonts.googleapis.com` at build time.
- A protected `/api/migrate` endpoint exists for running `prisma db push` against the production database after deploy, without needing direct database shell access.

</details>

---

## Project Structure

<details>
<summary><strong>Click to expand — full file tree</strong></summary>

```
sqo-v7/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # sidebar shell + auth guard
│   │   ├── dashboard/page.tsx  # unified overview, all features
│   │   ├── optimizer/page.tsx  # SQL Optimizer
│   │   ├── nl2sql/page.tsx     # Natural Language to SQL
│   │   ├── schema/page.tsx     # Schema Vault (DDL → ER diagram)
│   │   ├── playground/page.tsx # in-browser SQL pattern explorer
│   │   ├── examples/page.tsx   # 25 curated queries, 9 domains
│   │   ├── history/page.tsx    # universal activity log
│   │   ├── analytics/page.tsx  # universal usage analytics
│   │   └── settings/page.tsx   # account, privacy, export, danger zone
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── optimize/route.ts
│   │   ├── nl2sql/route.ts
│   │   ├── analytics/route.ts
│   │   ├── queries/route.ts
│   │   ├── conversions/route.ts
│   │   ├── export/route.ts
│   │   ├── health/route.ts
│   │   └── migrate/route.ts
│   ├── layout.tsx
│   ├── page.tsx                # landing page
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Providers.tsx
│   └── optimizer/
│       ├── SqlBlock.tsx        # syntax-highlighted SQL display + copy
│       ├── ScoreRing.tsx       # circular performance-gain indicator
│       └── ExportMenu.tsx      # ask-before-export modal
├── lib/
│   ├── ai-engine.ts            # Gemini integration, PII redaction, static analysis
│   ├── auth.ts                 # NextAuth config (JWT, 30-day sessions)
│   └── db.ts                   # Prisma client singleton
├── hooks/
│   └── useSwrFetcher.ts
├── types/
│   └── next-auth.d.ts
├── prisma/
│   └── schema.prisma
├── middleware.ts                # route protection
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

</details>

---

## Feature Overview

<details>
<summary><strong>Click to expand — what each feature does</strong></summary>

**SQL Optimizer** — Paste a query, select a dialect, get an AI-rewritten version with anti-pattern detection, index recommendations, complexity analysis, and a live client-side scanner that flags issues before you even click Optimize.

**Natural Language to SQL** — Describe what data you need in plain English; get production-ready SQL. Schema-aware: when a Schema Vault DDL is loaded, generation uses your exact table and column names.

**Schema Vault** — Paste `CREATE TABLE` statements to get a visual ER diagram with Primary Key / Foreign Key detection, an editable DDL panel, and a character usage meter. The parsed schema feeds directly into NL to SQL.

**Playground** — A safe, simulated SQL execution environment for studying advanced patterns (window functions, recursive CTEs, JSON aggregation) without needing a live database connection.

**Examples** — 25 complete, production-ready queries across 9 industry domains (E-Commerce, Healthcare, Finance, HR, SaaS, Logistics, Education, Gaming, Banking), each tagged by difficulty and dialect, with one-click copy or "send to Optimizer."

**History** — A unified, searchable log of everything you've done across Optimizer and NL to SQL, with favoriting, reopening, and per-item copy.

**Analytics** — Cross-feature usage statistics: total actions, average performance gain, activity streak, issue severity breakdown, 14-day trend, and a feature-usage bar chart spanning all four tools.

**Settings** — Account info, PII redaction status, notification preferences, the export flow, and a confirmation-gated "clear history" action. No API keys or provider names are ever shown here.

</details>

---

## Security & Privacy Notes

- Personally Identifiable Information (PII) — emails, Social Security Numbers, card numbers — is redacted from query text before it's ever sent to the AI provider.
- No AI provider name is shown anywhere in the user-facing UI; error states use generic, friendly language ("Service Temporarily Unavailable").
- API keys live only in server-side environment variables and are never sent to the client or exposed via any API response.
- Every export action requires the user to explicitly choose what to include before any file is generated.

---

## License

Private project — not licensed for redistribution.
