# SmartQuery — SQL Intelligence Platform (v7)

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
