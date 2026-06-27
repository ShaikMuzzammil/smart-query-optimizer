# Smart Query Optimizer — v6

> AI-powered SQL intelligence platform: optimizer, Natural Language to SQL (NL2SQL), Schema Vault, Playground, Analytics, and History — all in one unified workspace.

## What's New in v6

| Fix | What Changed |
|-----|-------------|
| AI engine | `gemini-1.5-flash` primary → `gemini-1.5-flash-8b` → `gemini-pro` fallback chain. Anthropic removed entirely. |
| Auth middleware | All 9 dashboard pages + 6 API routes now protected — sign-in persists correctly |
| Universal analytics | Analytics tracks SQL Optimizer, NL2SQL, Schema uploads, Playground runs, and Exports |
| Universal history | History page shows both SQL optimizations and NL2SQL conversions |
| Export dialog | Confirmation dialog with format (SQL/CSV/JSON/PDF) and date scope before any download |
| Schema Vault | DDL char usage meter, Edit DDL mode, 3 example schemas, ER diagram with PK🔑/FK🔗 icons |
| Dialect panels | Click "{Dialect} Reference" for full strengths, watchouts, key functions, index types |
| Full forms | PII = Personally Identifiable Information, NL2SQL = Natural Language to SQL, DDL, ER, etc. |
| Landing page | Home button, How It Works (5 steps), Step-by-Step Guide, all 12 domains, complete FAQ with glossary |
| Build fixed | `postinstall: prisma generate` + `next build` in buildCommand. ESLint `no-unescaped-entities` off. |
| Prisma schema | New `Conversion` model tracks feature usage across all tools |

## Environment Variables

```env
# Required — get free key at aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Neon PostgreSQL (from neon.tech dashboard)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth (generate: openssl rand -base64 32)
NEXTAUTH_SECRET=your_32_character_random_secret_here

# Your deployed URL
NEXTAUTH_URL=https://your-app.vercel.app
```

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init && git add . && git commit -m "SmartQuery v6"
git remote add origin https://github.com/your/repo.git
git push -u origin main
```

### Step 2 — Vercel settings
1. Import the repo on vercel.com
2. Framework: Next.js (auto-detected)
3. Add all 5 environment variables above
4. Deploy

### Step 3 — Run DB migration once
After the first deploy succeeds:
```bash
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_NEXTAUTH_SECRET"
```
This pushes the Prisma schema to your Neon database (adds the `conversions` table).

## Local Development
```bash
npm install
cp .env.example .env.local   # fill in your values
npx prisma db push           # create tables
npm run dev                  # http://localhost:3000
```

## Features

### SQL Optimizer
- Paste any SQL → AI rewrites with full analysis
- 5 dialects: PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server
- Live Scanner: instant anti-pattern detection as you type
- Dialect Reference panel: strengths, functions, index types per dialect
- PII auto-redaction (emails, SSNs, card numbers)
- Before/After SQL view with copy button
- Issues, improvements, index recommendations, security alerts
- Sample queries per dialect

### Natural Language to SQL (NL2SQL)
- Plain English → production-ready SQL
- Schema-aware when Schema Vault DDL is loaded
- 8 domain × 3 example prompts = 24 examples
- Tracks every conversion in History and Analytics

### Schema Vault
- Paste DDL → auto-parsed ER diagram
- PK (Primary Key) 🔑 and FK (Foreign Key) 🔗 icons
- Char usage meter: used / remaining / token estimate
- Edit DDL mode: in-place editable
- 3 example schemas: E-Commerce, Healthcare, HR
- Schema context injected into NL2SQL automatically

### SQL Playground
- In-browser SQL execution (no backend needed)
- Pre-loaded sample databases per domain
- Query history with copy buttons
- Results grid with export

### Analytics (Universal)
- KPIs: total optimizations, NL2SQL count, avg gain, issues fixed, streak, total actions
- Feature usage breakdown: all 5 features with bar chart
- 14-day optimizer trend (dual-axis: queries + avg gain)
- Feature usage radar chart
- Domain breakdown bar chart
- Issue severity pie chart
- Top 5 performance wins

### History (Universal)
- SQL optimizations AND NL2SQL conversions in one list
- Filter: All / SQL Optimizer / NL to SQL
- Search across title, domain, prompt text
- Expandable cards with full SQL and copy button
- Pagination (10 per page)

### Settings & Export
- Export confirmation dialog: choose format + date scope + features before download
- 4 export formats: SQL (queries only), CSV (metadata), JSON (full structured), PDF (report)
- 4 date scopes: All, Last 30 days, Last 7 days, Favorites
- No API keys or internal URLs exposed in the UI

## Tech Stack
- **Next.js 14** (App Router)
- **Prisma** + **Neon PostgreSQL** (serverless)
- **Google Gemini AI** (gemini-1.5-flash, free tier)
- **NextAuth v4** (Google OAuth + credentials)
- **Tailwind CSS** + **Framer Motion**
- **Recharts** (analytics charts)
- **Lucide React** (icons)
- **Vercel** (deployment)
