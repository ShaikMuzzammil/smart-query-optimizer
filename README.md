# ⚡ Smart Query Optimizer — v6

> **AI-powered SQL intelligence platform** — optimizer, Natural Language to SQL (NL2SQL), Schema Vault, Playground, Analytics, and History — all in one unified workspace.

---

## 🚀 What's New in v6

| Fix | What Changed |
|-----|-------------|
| 🤖 AI engine | `gemini-1.5-flash` → `gemini-1.5-flash-8b` → `gemini-pro` fallback chain. Anthropic completely removed. |
| 🔐 Auth middleware | All 9 dashboard pages + 6 API routes protected — sign-in persists across all features |
| 📊 Universal analytics | Tracks SQL Optimizer, NL2SQL, Schema uploads, Playground runs, and Exports |
| 📜 Universal history | Shows both SQL optimizations AND NL2SQL conversions in one list |
| 💾 Export dialog | Confirmation dialog: choose format (SQL/CSV/JSON/PDF) + date scope before any download |
| 🗄️ Schema Vault | DDL char usage meter, Edit DDL mode, 3 example schemas, PK🔑/FK🔗 ER diagram |
| 📖 Dialect panels | "{Dialect} Reference" button → full strengths, watchouts, functions, index types |
| 🔤 Full forms | PII = Personally Identifiable Information, NL2SQL = Natural Language to SQL, DDL, ER, etc. |
| 🏠 Landing page | Home button in nav, How It Works (5 steps), Step-by-Step Guide, 12 domains, FAQ glossary |
| 🔧 Build fixed | `postinstall: prisma generate` · ESLint `no-unescaped-entities` off · `serverExternalPackages` key |
| 🗃️ Prisma schema | New `Conversion` model — tracks every feature action universally |
| 🐛 Syntax fixed | Template literal placeholders · `fontWeight={700}` SVG · COLS edge-case guard |

---

## 🔑 Environment Variables

```env
# ✅ Required — free key at aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# 🐘 Neon PostgreSQL (from neon.tech dashboard → Connection Details)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require

# 🔒 NextAuth secret (generate: openssl rand -base64 32)
NEXTAUTH_SECRET=your_32_char_random_secret

# 🌐 Your deployed app URL (no trailing slash)
NEXTAUTH_URL=https://your-app.vercel.app
```

---

## 🚢 Deploy to Vercel (3 steps)

### Step 1 — Push to GitHub
```bash
git init && git add . && git commit -m "SmartQuery v6"
git remote add origin https://github.com/your/repo.git
git push -u origin main
```

### Step 2 — Vercel settings
1. Import the repo on **vercel.com → New Project**
2. Framework: **Next.js** (auto-detected)
3. Add all **5 environment variables** from above
4. Click **Deploy**

### Step 3 — Run DB migration once *(first deploy only)*
```bash
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_NEXTAUTH_SECRET"
```
> Pushes the Prisma schema to Neon (adds `conversions` table). Run once per schema change.

---

## 💻 Local Development
```bash
npm install
cp .env.example .env.local   # fill in your values
npx prisma db push           # create tables
npm run dev                  # → http://localhost:3000
```

---

## ✨ Features

### ⚡ SQL Optimizer
- Paste any SQL → AI rewrites with **full analysis** in seconds
- **5 dialects**: PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server
- **Live Scanner** — instant anti-pattern detection as you type
- **Dialect Reference panel** — strengths, watchouts, key functions, index types per dialect
- **PII auto-redaction** — Personally Identifiable Information (emails, SSNs, card numbers) removed before processing
- **Before/After SQL view** — split/before/after toggle with copy buttons
- Issues detected, improvements applied, index recommendations, security alerts
- **Sample queries per dialect** — 2–3 real examples for each

### 🧠 Natural Language to SQL (NL2SQL)
- Plain English → production-ready SQL for any dialect
- **Schema-aware** when Schema Vault DDL is loaded → zero hallucinations
- **8 domain × 3 example prompts** = 24 curated examples
- Every conversion tracked in History and Analytics

### 🗄️ Schema Vault
- Paste DDL (Data Definition Language) → auto-parsed visual Entity-Relationship (ER) diagram
- **Primary Key (PK) 🔑** and **Foreign Key (FK) 🔗** icons auto-detected
- **Char usage meter** — used / remaining / estimated token count
- **Edit DDL mode** — in-place editable without losing the diagram
- **3 example schemas** — E-Commerce, Healthcare, HR
- Schema context **auto-injected into NL2SQL** for accurate generation

### 🖥️ SQL Playground
- In-browser SQL execution (no backend needed)
- Pre-loaded sample databases per domain
- Query history with copy buttons
- Results grid with row count

### 📊 Analytics (Universal — all features)
- **6 KPIs** — total optimizations, NL2SQL count, avg gain, issues fixed, day streak, total actions
- **Feature usage breakdown** — all 5 tools with percentage bars
- **14-day activity chart** — dual axis: query count + avg performance gain
- **Feature radar chart** — visual balance of which tools you use most
- **Domain breakdown** bar chart + top 5 performance wins
- **Issue severity pie chart** — critical/high/medium/low

### 📜 History (Universal — all features)
- SQL Optimizer results **and** NL2SQL conversions in one unified list
- **Filter** — All Features / SQL Optimizer / NL to SQL
- **Full-text search** across title, domain, prompt
- Expandable cards with complete SQL + copy button
- **Pagination** — 10 results per page

### ⚙️ Settings & Export
- **Export dialog** — choose format, date range, and features before any download starts
- **4 export formats**: SQL (queries only), CSV (spreadsheet), JSON (full data), PDF (text report)
- **4 date scopes**: All history, Last 30 days, Last 7 days, Favorites only
- **No API keys or internal URLs** exposed in the UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Prisma + Neon PostgreSQL (serverless) |
| AI Engine | Google Gemini (gemini-1.5-flash, free tier) |
| Auth | NextAuth v4 (credentials + OAuth) |
| Styling | Tailwind CSS + Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 🏗️ Project Structure

```
app/
├── (auth)/login, register       # Auth pages
├── (dashboard)/
│   ├── dashboard/               # Home with all 8 feature cards
│   ├── optimizer/               # SQL Optimizer + dialect panels
│   ├── nl2sql/                  # Natural Language to SQL
│   ├── schema/                  # Schema Vault + ER diagram
│   ├── playground/              # In-browser SQL runner
│   ├── examples/                # 99 query example library
│   ├── history/                 # Universal history
│   ├── analytics/               # Universal analytics
│   └── settings/                # Export + account
├── api/
│   ├── optimize/                # AI optimization endpoint
│   ├── nl2sql/                  # AI NL→SQL endpoint
│   ├── analytics/               # Universal stats
│   ├── export/                  # SQL/CSV/JSON/PDF export
│   ├── conversions/             # Feature usage tracking
│   ├── queries/                 # Query history CRUD
│   ├── migrate/                 # One-time DB schema push
│   └── health/                  # Health check
├── page.tsx                     # Landing page (Home)
lib/
├── ai-engine.ts                 # Gemini 3-model fallback
├── auth.ts                      # NextAuth config
└── db.ts                        # Prisma + Neon client
middleware.ts                    # Route protection
prisma/schema.prisma             # User, Query, Conversion models
```

---

*SmartQuery v6 — built with Next.js 14, Gemini AI, Neon PostgreSQL, and Vercel*
