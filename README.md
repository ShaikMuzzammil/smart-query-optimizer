# ⚡ Smart Query Optimizer — v6

> **AI-powered SQL intelligence platform** — optimizer, Natural Language to SQL (NL2SQL), Schema Vault, Playground, Analytics, and History — all in one unified workspace.

---

## 🚀 What's New in v6

| # | Fix | What Changed |
|---|-----|-------------|
| 🤖 | AI engine | `gemini-1.5-flash` → `gemini-1.5-flash-8b` → `gemini-pro` fallback chain. Anthropic completely removed. |
| 🔐 | Auth middleware | All 9 dashboard pages + 6 API routes protected — sign-in persists across all features |
| 📊 | Universal analytics | Tracks SQL Optimizer, NL2SQL, Schema uploads, Playground runs, and Exports |
| 📜 | Universal history | Shows SQL optimizations AND NL2SQL conversions in one unified list |
| 💾 | Export dialog | Confirmation dialog — choose format + date scope + features before any download |
| 🗄️ | Schema Vault | DDL char usage meter, Edit DDL mode, 3 example schemas, PK🔑/FK🔗 ER diagram |
| 📖 | Dialect panels | Click "{Dialect} Reference" for full strengths, watchouts, key functions, index types |
| 🔤 | Full terminology | PII = Personally Identifiable Information; NL2SQL = Natural Language to SQL; DDL, ER, FK, PK spelled out |
| 🏠 | Landing page | Home button in nav, How It Works (5 steps), Step-by-Step Guide, 12 domains, FAQ glossary |
| 🐛 | Syntax fix | Template literal placeholder · `fontWeight={700}` SVG · COLS edge-case guard |
| 🔧 | Regex fix | `/is` dotAll flag → `[\s\S]` workaround; `/gis` → `/gi`; tsconfig target → ES2018 |
| 🔧 | Build config | `postinstall: prisma generate` · ESLint `no-unescaped-entities` off · `serverExternalPackages` |
| 🗃️ | Prisma schema | New `Conversion` model — tracks every feature action universally |

---

## 🔑 Environment Variables

```env
# ✅ Required — free key at aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# 🐘 Neon PostgreSQL — from neon.tech → Connection Details
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require

# 🔒 NextAuth secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_32_char_random_secret_here

# 🌐 Your deployed app URL — no trailing slash
NEXTAUTH_URL=https://your-app.vercel.app
```

---

## 🚢 Deploy to Vercel (3 steps)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "SmartQuery v6 — AI SQL Intelligence Platform"
git remote add origin https://github.com/your-username/smart-query-optimizer.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to **vercel.com → New Project**
2. Import your GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Open **Environment Variables** and add all 5 vars above
5. Click **Deploy**

### Step 3 — Run DB migration *(first deploy only)*
```bash
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_NEXTAUTH_SECRET"
```
> Pushes Prisma schema to Neon (creates all tables including `conversions`).
> Re-run this after any `prisma/schema.prisma` change.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and fill in all 5 variables

# 3. Create database tables
npx prisma db push

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

**Useful dev commands:**
```bash
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run db:generate  # Regenerate Prisma client after schema change
npm run lint         # Run ESLint
npm run build        # Test production build locally
```

---

## ✨ Feature Guide

### ⚡ SQL Optimizer
- Paste any SQL → AI rewrites with **full analysis** in seconds
- **5 dialects**: PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server
- **Live Scanner** — instant anti-pattern detection while you type (no AI call needed)
- **Dialect Reference panel** — click `{Dialect} Reference` button for:
  - Strengths of that dialect
  - Common performance pitfalls to watch out for
  - Key functions with signatures
  - Available index types with use cases
  - Link to official documentation
- **Personally Identifiable Information (PII) auto-redaction** — emails, Social Security Numbers, card numbers removed before any AI processing
- **Before/After SQL view** — split / original / optimized toggle with copy button on each
- **Sample queries** — 2–3 real anti-pattern examples per dialect
- Outputs: issues list, improvements applied, index recommendations, security alerts, query metadata

### 🧠 Natural Language to SQL (NL2SQL)
- Describe what data you need in plain English → get production-ready SQL
- **Schema-aware** when Schema Vault DDL is loaded → zero hallucinated column names
- **5 dialects** supported with dialect-specific syntax
- **8 domain × 3 example prompts** = 24 curated examples (E-Commerce, Healthcare, Finance, HR, SaaS, Logistics, Education, Gaming)
- Every conversion tracked in History and Analytics
- One-click "Optimize This SQL" to send result to SQL Optimizer

### 🗄️ Schema Vault
- Paste Data Definition Language (DDL) → auto-parsed visual Entity-Relationship (ER) diagram
- **Primary Key (PK) 🔑** and **Foreign Key (FK) 🔗** auto-detected and shown with icons
- **DDL Char Usage Meter** — shows characters used / remaining / estimated token count
- **Edit DDL Mode** — in-place editing without losing your diagram
- **3 built-in example schemas** — E-Commerce (5 tables), Healthcare (4 tables), HR System (3 tables)
- Schema context **auto-injected into NL2SQL** via `sessionStorage`
- Tables view with column type, nullability, and relationship info

### 🖥️ SQL Playground
- **In-browser SQL execution** — no backend needed, runs entirely client-side
- Pre-loaded sample databases per industry domain
- Query history with copy buttons
- Live results grid with row count and execution time
- Copy any result to optimizer or NL2SQL

### 📊 Analytics — Universal (all features)
- **6 KPI cards** — total optimizations, NL2SQL count, avg performance gain, issues fixed, day streak, total actions
- **Feature usage breakdown** — all 5 tools with percentage bars and clickable links
- **14-day activity chart** — dual axis: query count + average performance gain %
- **Feature usage radar chart** — visual balance across all tools
- **Domain breakdown** bar chart with per-domain average gain
- **Issue severity pie chart** — critical / high / medium / low breakdown
- **Top 5 performance wins** — highest gain optimizations ever
- Refreshes every 30 seconds automatically

### 📜 History — Universal (all features)
- Shows **SQL Optimizer results AND NL2SQL conversions** in one chronological list
- **Filter** — All Features / SQL Optimizer / Natural Lang to SQL
- **Full-text search** across title, domain, query type, prompt text
- **Expandable cards** — click to reveal full SQL with copy button
- **Pagination** — 10 results per page with Previous / Next
- Shows creation date, dialect, domain, and performance gain for each entry

### ⚙️ Settings & Export
- **Export dialog** — choose format + date range + features before any download starts
- **4 export formats**:
  - `SQL` — just the optimized SQL queries, ready to run
  - `CSV` — spreadsheet with all metadata (title, domain, gain, date, tables)
  - `JSON` — full structured data including all issues, improvements, index recs
  - `PDF` — formatted text report with query pairs and analysis
- **4 date scopes**: All history · Last 30 days · Last 7 days · Favorites only
- **Feature selection** — choose Optimizer, NL2SQL, or both
- No API keys, internal URLs, or secrets exposed anywhere in the UI

---

## 🏗️ Full Project Structure

```
smart-query-optimizer/
│
├── 📁 app/                              # Next.js 14 App Router root
│   │
│   ├── 📄 page.tsx                      # Landing page (Home)
│   │                                    #   → Navbar with Home button
│   │                                    #   → Hero with Before/After demo
│   │                                    #   → Stats bar (12 domains, 5 dialects, etc.)
│   │                                    #   → Features grid (6 cards)
│   │                                    #   → How It Works (5 steps)
│   │                                    #   → Step-by-Step Guide (5 sections)
│   │                                    #   → 12 Industry Domains grid
│   │                                    #   → Why SmartQuery (3 pillars)
│   │                                    #   → FAQ with glossary (8 items)
│   │                                    #   → CTA + Footer
│   │
│   ├── 📄 layout.tsx                    # Root layout: theme, fonts, session provider
│   ├── 📄 not-found.tsx                 # 404 page
│   ├── 📄 globals.css                   # Tailwind base + glass-card utilities
│   │
│   ├── 📁 (auth)/                       # Auth route group (no sidebar layout)
│   │   ├── 📁 login/page.tsx            # Sign-in form (credentials + Google)
│   │   └── 📁 register/page.tsx         # Registration form
│   │
│   ├── 📁 (dashboard)/                  # Dashboard route group (shared sidebar)
│   │   ├── 📄 layout.tsx                # Sidebar + top bar layout
│   │   │
│   │   ├── 📁 dashboard/page.tsx        # Home dashboard
│   │   │                                #   → Greeting with time of day
│   │   │                                #   → 8 feature quick-action cards
│   │   │                                #   → 6 KPI cards (optimizer + NL2SQL + streak)
│   │   │                                #   → Feature usage breakdown panel
│   │   │                                #   → 14-day activity chart
│   │   │                                #   → Recent optimizations list
│   │   │
│   │   ├── 📁 optimizer/page.tsx        # SQL Optimizer (largest page, ~41KB)
│   │   │                                #   → Dialect selector (5 dialects)
│   │   │                                #   → {Dialect} Reference panel (per dialect)
│   │   │                                #   → PII notice with full form
│   │   │                                #   → File upload + clear + sample queries dropdown
│   │   │                                #   → SQL textarea with line/char counter
│   │   │                                #   → Live Scanner (instant, no AI)
│   │   │                                #   → Optimize with AI button (Cmd+Enter)
│   │   │                                #   → Result: metrics, before/after, issues,
│   │   │                                #     improvements, indexes, security alerts
│   │   │
│   │   ├── 📁 nl2sql/page.tsx           # Natural Language to SQL
│   │   │                                #   → Schema context banner (from Vault)
│   │   │                                #   → Dialect selector
│   │   │                                #   → Natural language textarea
│   │   │                                #   → 8 domain × 3 example prompt panels
│   │   │                                #   → Result: SQL block + explanation +
│   │   │                                #     assumptions + tables used
│   │   │                                #   → "Optimize This SQL" quick link
│   │   │
│   │   ├── 📁 schema/page.tsx           # Schema Vault
│   │   │                                #   → DDL char usage meter (chars / tokens)
│   │   │                                #   → Schema stats (tables, columns, rels)
│   │   │                                #   → Edit DDL mode (in-place editing)
│   │   │                                #   → File upload (.sql/.ddl/.txt)
│   │   │                                #   → 3 example schemas to load
│   │   │                                #   → ER diagram (SVG, auto-layout)
│   │   │                                #   → Tables view (column types, PK/FK)
│   │   │                                #   → "Use in NL to SQL" button
│   │   │
│   │   ├── 📁 playground/page.tsx       # SQL Playground (in-browser engine)
│   │   │                                #   → Sample database selector
│   │   │                                #   → SQL editor with syntax hints
│   │   │                                #   → Run button + results grid
│   │   │                                #   → Query history with copy
│   │   │                                #   → Execution time display
│   │   │
│   │   ├── 📁 examples/page.tsx         # Example Library
│   │   │                                #   → 99 queries across 12 domains
│   │   │                                #   → Domain filter tabs
│   │   │                                #   → Before/After annotations
│   │   │                                #   → Copy + "Send to Optimizer" actions
│   │   │
│   │   ├── 📁 history/page.tsx          # Universal History
│   │   │                                #   → Filter: All / Optimizer / NL2SQL
│   │   │                                #   → Full-text search
│   │   │                                #   → Expandable cards with copy
│   │   │                                #   → Pagination (10/page)
│   │   │
│   │   ├── 📁 analytics/page.tsx        # Universal Analytics
│   │   │                                #   → 6 KPI cards
│   │   │                                #   → 5 feature usage cards (clickable)
│   │   │                                #   → 14-day dual-axis trend chart
│   │   │                                #   → Feature radar chart
│   │   │                                #   → Domain breakdown bar chart
│   │   │                                #   → Issue severity pie chart
│   │   │                                #   → Top 5 performance wins
│   │   │
│   │   └── 📁 settings/page.tsx         # Settings & Export
│   │                                    #   → Account info (name, email)
│   │                                    #   → PII security notice
│   │                                    #   → Export dialog (format + scope + features)
│   │                                    #   → Preferences toggles
│   │                                    #   → Delete all history (with confirm)
│   │                                    #   → Sign out
│   │
│   └── 📁 api/                          # API Route Handlers
│       ├── 📁 auth/[...nextauth]/       # NextAuth handler (credentials + Google)
│       ├── 📁 optimize/route.ts         # POST — AI SQL optimization
│       │                                #   → PII redaction → Gemini → DB save
│       ├── 📁 nl2sql/route.ts           # POST — Natural Language to SQL conversion
│       │                                #   → Gemini → Conversion DB save
│       ├── 📁 queries/route.ts          # GET — paginated query history
│       │                                # GET ?id= — single query details
│       ├── 📁 conversions/route.ts      # GET — feature conversion history
│       │                                # POST — manual conversion tracking
│       ├── 📁 analytics/route.ts        # GET — universal analytics aggregation
│       │                                #   → queries + conversions + streak
│       ├── 📁 export/route.ts           # POST — export in SQL/CSV/JSON/PDF
│       │                                #   → scope filter + feature filter
│       ├── 📁 migrate/route.ts          # POST — run prisma db push (deploy once)
│       │                                #   → Bearer auth required
│       └── 📁 health/route.ts           # GET — service health check
│                                        #   → DB + AI engine + NextAuth status
│
├── 📁 components/                       # Shared React components
│   ├── 📁 optimizer/
│   │   └── 📄 SqlBlock.tsx              # Syntax-highlighted SQL display + copy
│   ├── 📁 ui/                           # shadcn/ui base components
│   │   ├── 📄 button.tsx
│   │   ├── 📄 dialog.tsx
│   │   ├── 📄 toast.tsx
│   │   └── 📄 ... (tooltip, select, tabs, etc.)
│   └── 📄 Providers.tsx                 # SessionProvider + ThemeProvider wrapper
│
├── 📁 lib/                              # Core library modules
│   ├── 📄 ai-engine.ts                  # Gemini AI engine (THE most critical file)
│   │                                    #   → 3-model fallback chain
│   │                                    #   → PII redaction (5 pattern types)
│   │                                    #   → optimizeSQL() — full analysis
│   │                                    #   → nl2sql() — NL to SQL conversion
│   │                                    #   → AiUnavailableError, AiParseError
│   ├── 📄 auth.ts                       # NextAuth configuration
│   │                                    #   → CredentialsProvider (email/password)
│   │                                    #   → GoogleProvider (OAuth)
│   │                                    #   → JWT session strategy
│   ├── 📄 db.ts                         # Prisma + Neon PostgreSQL client
│   │                                    #   → WebSocket adapter for serverless
│   │                                    #   → Global PrismaClient singleton
│   └── 📄 utils.ts                      # Shared utilities
│                                        #   → cn() className helper
│                                        #   → DOMAIN_CONFIG map
│                                        #   → gainColor(), timeAgo()
│
├── 📁 hooks/                            # Custom React hooks
│   └── 📄 useSwrFetcher.ts              # SWR fetcher with auth headers
│
├── 📁 prisma/
│   └── 📄 schema.prisma                 # Database schema
│                                        #   → User (id, email, name, password)
│                                        #   → Account (OAuth accounts)
│                                        #   → Session (NextAuth sessions)
│                                        #   → Query (optimizer results + full analysis)
│                                        #   → Conversion (NL2SQL + feature tracking)
│
├── 📄 middleware.ts                     # Route protection
│                                        #   → Protects /dashboard /optimizer /nl2sql
│                                        #   → /schema /playground /examples /history
│                                        #   → /analytics /settings + 6 API routes
│
├── 📄 next.config.js                    # Next.js config
│                                        #   → serverExternalPackages: prisma, bcryptjs
│                                        #   → image domains for OAuth avatars
│
├── 📄 tsconfig.json                     # TypeScript config
│                                        #   → target: ES2018 (required for Vercel)
│                                        #   → strict: true
│                                        #   → paths: @/* → ./*
│
├── 📄 tailwind.config.ts                # Tailwind CSS config
│                                        #   → dark mode: class
│                                        #   → custom violet/emerald/sky palette
│                                        #   → glass-card utility classes
│
├── 📄 vercel.json                       # Vercel deployment config
│                                        #   → buildCommand: next build
│                                        #   → function timeouts: optimize 30s
│
├── 📄 package.json                      # Dependencies
│                                        #   → postinstall: prisma generate
│                                        #   → @google/generative-ai (Gemini)
│                                        #   → NO @anthropic-ai/sdk
│
└── 📄 .eslintrc.json                    # ESLint config
                                         #   → no-unescaped-entities: off
                                         #   → rules-of-hooks: error (enforced)
```

---

## 🤖 AI Engine Architecture

```
User SQL Input
      │
      ▼
┌─────────────────┐
│  PII Redaction  │  Emails → [REDACTED_EMAIL]
│                 │  SSNs   → [REDACTED_SSN]
│                 │  Cards  → [REDACTED_CARD]
│                 │  Phones → [REDACTED_PHONE]
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│         Gemini Fallback Chain   │
│                                 │
│  1st try: gemini-1.5-flash      │  ← Fastest, free tier
│     ↓ (404 / deprecated)        │
│  2nd try: gemini-1.5-flash-8b   │  ← Smaller, very fast
│     ↓ (404 / deprecated)        │
│  3rd try: gemini-pro             │  ← Stable fallback
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  JSON Response  │  Strict JSON parse → extract
│  Parsing        │  with regex fallback if needed
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DB Save        │  Query or Conversion record
│  (non-blocking) │  Failure here never breaks response
└────────┬────────┘
         │
         ▼
    API Response
```

---

## 🛡️ Security Architecture

| Layer | What's Protected |
|-------|-----------------|
| **Middleware** | All 9 dashboard routes + 6 API routes require valid session |
| **PII Redaction** | 5 pattern types removed before any AI processing |
| **Settings UI** | Zero API keys, DB URLs, or internal endpoints exposed |
| **Export Auth** | Exports scoped to authenticated user only |
| **Migrate Auth** | `Bearer {NEXTAUTH_SECRET}` required for DB migration endpoint |
| **Error Messages** | All user-facing errors are generic — no internal details leaked |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 14.2.x |
| Language | TypeScript | 5.x |
| Database | Prisma + Neon PostgreSQL | 5.20 + serverless |
| AI Engine | Google Gemini (gemini-1.5-flash) | @google/generative-ai 0.24 |
| Auth | NextAuth | 4.24 |
| Styling | Tailwind CSS + Framer Motion | 3.4 + 11 |
| Charts | Recharts | 2.12 |
| Icons | Lucide React | 0.447 |
| Data Fetching | SWR | 2.2 |
| Deployment | Vercel | — |

---

## 📋 Prisma Schema Reference

```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String?           // bcrypt hashed
  role      Role     @default(USER)
  queries   Query[]
  conversions Conversion[]
}

model Query {
  // Optimizer results
  originalQuery    String    // Input SQL (PII-redacted)
  optimizedQuery   String    // AI-rewritten SQL
  performanceGain  Int       // 0–99 %
  issues           Json      // [{type, severity, description}]
  improvements     Json      // string[]
  indexRecs        Json      // ["CREATE INDEX ..."]
  tablesDetected   Json      // string[]
  costScore        Int?      // 1–100 (lower = cheaper)
  domain           String?   // E-Commerce, Healthcare, etc.
  piiDetected      // (stored in metadata)
}

model Conversion {
  // Universal feature tracking
  feature    String  // "nl2sql"|"schema_upload"|"playground_run"|"export"
  inputText  String? // Prompt or DDL
  outputText String? // Generated SQL
  dialect    String? // PostgreSQL, MySQL, etc.
  success    Boolean
  metadata   Json    // Feature-specific data
}
```

---

*SmartQuery v6 — built with ⚡ Next.js 14 · 🤖 Google Gemini · 🐘 Neon PostgreSQL · 🚀 Vercel*
