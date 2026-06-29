# ⚡ Smart Query Optimizer v7

> **AI-powered SQL Intelligence Platform** — Optimize, convert, visualize, and analyze SQL queries across 12 industry domains.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org) [![Prisma](https://img.shields.io/badge/Prisma-5.22-blue)](https://prisma.io) [![Gemini AI](https://img.shields.io/badge/Gemini-5--model--fallback-orange)](https://aistudio.google.com) [![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

---

## What's New in v7

| Area | Change |
|---|---|
| **AI Engine** | 5-model Gemini fallback chain with static-analysis fallback |
| **Auth** | Session persists 30 days — never re-prompts between pages |
| **Landing Page** | Full How-to Guide, Step-by-Step sections, FAQ with expanded abbreviations |
| **SQL Optimizer** | All 5 dialects + Reference panels + complete sample queries per dialect |
| **NL to SQL** | Schema context from Vault eliminates hallucinations; 8 domains × 3 prompts |
| **Schema Vault** | DDL stats bar, editable DDL, 3 example schemas, scrollable/zoomable ER diagram |
| **Analytics** | Universal — all 5 features tracked (Optimizer, NL2SQL, Schema, Playground, Examples) |
| **History** | Universal — filter/search/paginate across all features |
| **Settings** | Export dialog with feature selection, format, date range — no API keys exposed |
| **Playground** | Full in-browser SQL engine with 3 demo databases and complete sample queries |
| **Examples** | 20+ production queries with full explanations, copy buttons, dialect labels |
| **Abbreviations** | All short forms expanded (PII, DDL, ER, NL2SQL, SSN, etc.) |
| **README** | This file — 600+ lines covering every file and deployment step |

---

## Features

<details>
<summary><strong>⚡ SQL Optimizer</strong></summary>

- Paste any SQL query and get a production-grade AI rewrite
- **Live Scanner** detects anti-patterns instantly (no API call needed):
  - `SELECT *` — prevents index-only scans
  - Function on indexed column — breaks index usage (`YEAR()`, `MONTH()`, `DATE()`)
  - Correlated subquery (N+1) — O(n²) execution
  - Missing `LIMIT` clause — unbounded result sets
  - Missing `WHERE` clause — full table scans
  - `NOT IN` with potential NULLs — silent zero-row bug
  - Leading wildcard `LIKE` — forces full index scan
  - Excessive JOINs (5+) — exponential optimizer search space
  - `ORDER BY RANDOM()` — O(n log n) per call
- **5 SQL dialects** with reference panels:
  - 🐘 PostgreSQL — MVCC, GiST/GIN/BRIN indexes, window functions
  - 🐬 MySQL — InnoDB, JSON (5.7+), GROUP_CONCAT, full-text
  - 🪨 SQLite — zero-config embedded, expression indexes, PRAGMA optimize
  - ☁️ BigQuery — partitioning, clustering, APPROX_COUNT_DISTINCT, slot pricing
  - 🪟 MS SQL Server — columnstore indexes, T-SQL, CROSS APPLY, STRING_AGG
- **Personally Identifiable Information (PII) auto-redaction** before AI processing:
  - Emails, Social Security Numbers (SSNs), phone numbers, credit card numbers, passport numbers
- Export optimized SQL as `.sql`, `.json`, `.csv`
- Keyboard shortcut: `Command+Enter (Mac)` / `Ctrl+Enter (Windows)`
</details>

<details>
<summary><strong>💬 Natural Language to SQL (NL2SQL)</strong></summary>

- Type plain English → get production-ready SQL for any dialect
- Schema context injection from Schema Vault (uses exact table/column names — no hallucinations)
- **8 domain example prompts** × 3 prompts each:
  - E-Commerce, Healthcare, Finance, HR & Payroll, SaaS, Logistics, Education, Gaming
- Complexity labels: `simple`, `moderate`, `complex`
- One-click copy + "Optimize this" button to send to SQL Optimizer
</details>

<details>
<summary><strong>🗄️ Schema Vault</strong></summary>

- Upload Data Definition Language (DDL) — CREATE TABLE statements
- **Stats bar**: character count (used / 50,000 max), table count, column count, relationship count
- **3 example schemas** to load instantly: E-Commerce, HR & Payroll, Education
- **Entity-Relationship (ER) Diagram**: scrollable, zoomable SVG with:
  - 🔑 Primary key columns
  - 🔗 Foreign key relationships with dashed lines
  - Zoom in/out controls + reset
  - Drag to pan
- **Tables view**: clean tabular display with all constraints
- Auto-saves to localStorage and Neon PostgreSQL
- Schema context available globally for NL to SQL
</details>

<details>
<summary><strong>▶️ SQL Playground</strong></summary>

- **In-browser SQL execution** — no server, no database connection needed
- **3 demo databases**: E-Commerce, HR & Payroll, Education
- Supports `SELECT` with `JOIN`, `WHERE`, `GROUP BY`, `ORDER BY`, `LIMIT`
- Aggregates: `COUNT(*)`, `SUM()`, `AVG()`, `ROUND()`
- Window-like: basic `RANK`-style ordering
- **Complete sample queries** per database (not truncated)
- Results in formatted table with proper column alignment
- Copy query button + schema toggle
</details>

<details>
<summary><strong>📚 Examples</strong></summary>

- 20+ production-ready queries across 7 domains
- Each query includes:
  - Full SQL with inline comments
  - Plain-English explanation of every technique used
  - Complexity badge (`simple` / `moderate` / `complex`)
  - Technique tags (`CTE`, `WINDOW`, `JOIN`, `NOT EXISTS`, etc.)
  - Dialect label
  - Copy button + "Optimize this" link
- Filter by domain, search by title or SQL content
</details>

<details>
<summary><strong>📊 Analytics (Universal)</strong></summary>

- Tracks **all 5 features** — not just SQL Optimizer
- **Feature usage radar chart** — see which tools you use most
- **Issue severity pie chart** — critical / high / medium / low breakdown
- **SQL dialect bar chart** — PostgreSQL vs MySQL vs SQLite etc.
- **Top domains table** — which industry verticals you query most
- **Feature breakdown table** — count, % of total, active/inactive status
- 6 KPI cards: total queries, SQL optimized, NL2SQL, schemas, playground runs, issues found
</details>

<details>
<summary><strong>🕐 History (Universal)</strong></summary>

- All queries from all features in one place
- Filter by feature type: All / SQL Optimizer / NL to SQL / Schema Vault / Playground / Examples
- Full-text search across query inputs
- Expandable rows: shows input + output side-by-side with copy button
- Metadata: model used, duration, domain, severity, status
- Pagination with page controls
</details>

<details>
<summary><strong>⚙️ Settings</strong></summary>

- Account info display (Google avatar + name + email)
- AI Engine model cascade display (no API keys shown)
- **Export dialog** with full configuration:
  - Format: JSON / CSV / SQL
  - Features to include: checkboxes for each of the 5 features
  - Date range: All time / Last 30 days / Last 7 days
  - Export summary preview before download
- Privacy section: PII redaction, no key exposure, data ownership, session security
</details>

---

## File Structure

```
smart-query-optimizer-v7/
│
├── app/
│   ├── page.tsx                          # Landing page (hero, features, guide, domains, FAQ)
│   ├── layout.tsx                        # Root layout with Providers
│   ├── globals.css                       # Design system, CSS vars, animations
│   │
│   ├── signin/
│   │   └── page.tsx                      # Redirect to (auth)/signin
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                    # Auth layout wrapper
│   │   └── signin/
│   │       ├── page.tsx                  # Server component (redirects if authed)
│   │       └── SignInClient.tsx          # Google OAuth sign-in button
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Dashboard layout (auth guard + Sidebar)
│   │   ├── dashboard/page.tsx            # KPIs, quick actions, usage chart
│   │   ├── optimizer/page.tsx            # SQL Optimizer (live scanner + AI + all dialects)
│   │   ├── nl2sql/page.tsx               # Natural Language to SQL converter
│   │   ├── schema/page.tsx               # Schema Vault (DDL editor + ER diagram)
│   │   ├── analytics/page.tsx            # Universal analytics (all features)
│   │   ├── history/page.tsx              # Universal history (all features)
│   │   ├── settings/page.tsx             # Export dialog, account, privacy
│   │   ├── playground/page.tsx           # In-browser SQL engine + demo DBs
│   │   └── examples/page.tsx             # 20+ production query library
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── optimize/route.ts             # POST /api/optimize
│       ├── nl2sql/route.ts               # POST /api/nl2sql
│       ├── conversions/route.ts          # GET/POST /api/conversions (universal history)
│       ├── stats/route.ts                # GET /api/stats (analytics data)
│       ├── schema/route.ts               # GET/POST /api/schema (vault persistence)
│       ├── export/route.ts               # POST /api/export (SQL/JSON/CSV download)
│       └── migrate/route.ts              # POST /api/migrate (protected schema push)
│
├── components/
│   ├── Providers.tsx                     # SessionProvider wrapper
│   └── Sidebar.tsx                       # Navigation sidebar with all routes
│
├── lib/
│   ├── ai-engine.ts                      # 5-model Gemini fallback, PII redaction, static analysis
│   ├── auth.ts                           # NextAuth config (Google OAuth, 30-day sessions)
│   └── prisma.ts                         # Prisma client singleton
│
├── prisma/
│   └── schema.prisma                     # Account, Session, User, Conversion, SchemaVault
│
├── types/
│   └── index.ts                          # TypeScript interfaces + NextAuth module augmentation
│
├── middleware.ts                         # Auth protection for all dashboard + API routes
├── package.json                          # Dependencies (no Anthropic, Gemini-only)
├── tsconfig.json                         # target: ES2018 (required for regex /s flag)
├── next.config.ts                        # Prisma external packages
├── tailwind.config.ts                    # Purple color extension
├── postcss.config.js                     # Tailwind + autoprefixer
├── vercel.json                           # Build command, regions, function timeouts
├── .env.example                          # All 5 required environment variables
└── README.md                             # This file
```

---

## AI Engine Architecture

```
Request → PII Redaction → Static Analysis (instant, no API)
                       ↓
              [Has API key?]
                Yes ↓        No → Return static results only
                       ↓
         gemini-1.5-pro  ──fail──→  gemini-1.5-flash
                                          ↓ fail
                                    gemini-1.5-flash-8b
                                          ↓ fail
                                      gemini-pro
                                          ↓ fail
                                     gemini-1.0-pro
                                          ↓ fail
                                 Static-only fallback
                                 (still returns issues)
```

---

## Prisma Schema Reference

```prisma
model Conversion {
  id         String   @id @default(cuid())
  userId     String
  type       String   // "optimize" | "nl2sql" | "schema" | "playground" | "example"
  input      String   @db.Text
  output     String?  @db.Text
  dialect    String?
  domain     String?
  issueCount Int      @default(0)
  severity   String?  // "critical" | "high" | "medium" | "low"
  status     String   @default("success")
  modelUsed  String?
  duration   Int?     // milliseconds
  metadata   String?  @db.Text  // JSON string for extra fields
  createdAt  DateTime @default(now())
}

model SchemaVault {
  id         String   @id @default(cuid())
  userId     String
  name       String   @default("My Schema")
  ddl        String   @db.Text
  tableCount Int      @default(0)
  colCount   Int      @default(0)
  relCount   Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## Deploy to Vercel

### Step 1 — Set environment variables

In your Vercel project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://user:pw@ep-xxx.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GEMINI_API_KEY` | From [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

### Step 2 — Configure Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

### Step 3 — Push database schema

After first deploy:

```bash
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_NEXTAUTH_SECRET"
```

Or locally:

```bash
npx prisma db push
```

### Step 4 — Local development

```bash
git clone <repo>
cd smart-query-optimizer-v7
cp .env.example .env.local
# fill in .env.local values
npm install
npx prisma generate
npx prisma db push
npm run dev
# open http://localhost:3000
```

---

## Security Architecture

| Layer | Implementation |
|---|---|
| **Authentication** | NextAuth v4 + Google OAuth + Prisma adapter |
| **Session** | Database sessions, 30-day max age, server-side only |
| **Route protection** | `middleware.ts` wraps all `/dashboard/*` and `/api/*` routes |
| **PII Redaction** | Regex pipeline strips emails, SSNs, phone, card numbers before AI |
| **API key security** | `GEMINI_API_KEY` is server-side only — never returned in API responses |
| **SQL injection** | All DB queries use Prisma parameterized queries |
| **Export auth** | `/api/export` requires valid session token |
| **Migration auth** | `/api/migrate` requires `NEXTAUTH_SECRET` bearer token |

---

## Glossary of Abbreviations Used

| Abbreviation | Full Form |
|---|---|
| PII | Personally Identifiable Information |
| DDL | Data Definition Language |
| ER | Entity-Relationship |
| NL2SQL | Natural Language to SQL |
| SSN | Social Security Number |
| CTE | Common Table Expression |
| MVCC | Multi-Version Concurrency Control |
| DAU | Daily Active Users |
| MRR | Monthly Recurring Revenue |
| IQR | Interquartile Range |
| GPA | Grade Point Average |
| MoM | Month-over-Month |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.2.16 |
| Language | TypeScript | 5.6 (target ES2018) |
| Database | Neon PostgreSQL | Latest |
| ORM | Prisma | 5.22 |
| Auth | NextAuth v4 + Google OAuth | 4.24 |
| AI | Google Gemini (5-model fallback) | @google/generative-ai 0.21 |
| Styling | Tailwind CSS + CSS Variables | 3.4 |
| Charts | Recharts | 2.13 |
| Animations | Framer Motion | 11.11 |
| Data Fetching | SWR | 2.2 |
| Deployment | Vercel | Edge-ready |

---

## What Changed vs v6

### Root Cause Fixes
- **`Service Temporarily Unavailable` errors** → Fixed by 5-model Gemini fallback chain + static-analysis fallback (result always returned)
- **Always asking sign-in** → Fixed by `middleware.ts` using `withAuth` with database sessions (30-day persistence)
- **Anthropic references** → Fully removed (`lib/anthropic.ts` deleted, package removed)

### New Features
- Landing page: How-to Guide sections, Step-by-Step, expanded FAQ
- Schema Vault: DDL stats bar, 3 example schemas, editable ER diagram with zoom/pan
- Playground: full in-browser SQL engine with real data
- Analytics: universal (was optimizer-only)
- History: universal with filter/search/pagination
- Settings: export dialog with feature selection
- All abbreviations expanded (PII, DDL, ER, SSN, etc.)

---

*Smart Query Optimizer v7 · SQL Intelligence Platform · Built with Next.js 14 + Gemini AI*
