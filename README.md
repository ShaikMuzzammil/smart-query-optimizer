# Smart Query Optimizer

**SQL Intelligence Platform** — production-grade query optimization, natural language to SQL, schema visualization, and in-browser playground.

## Features

- ⚡ **SQL Optimizer** — AI-powered rewrite with anti-pattern detection, index recommendations, security alerts, and lint warnings
- 🧠 **Natural Language to SQL** — convert plain English to production-ready SQL for 5 dialects
- 🗄️ **Schema Vault** — upload DDL, get a visual ER diagram; schema context injected into NL→SQL
- 🖥️ **SQL Playground** — execute SQL in-browser against seeded sample data, zero backend
- 🔍 **Live Scanner** — 10 anti-pattern rules run client-side as you type (N+1, leading wildcards, YEAR() functions, missing LIMIT, etc.)
- 🌍 **Multi-Dialect** — PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server
- 🛡️ **PII Redaction** — emails, SSNs, card numbers masked before any AI analysis
- 📊 **Analytics Dashboard** — performance charts, domain breakdowns, cost score trends
- 📋 **99-Example Library** — real anti-pattern queries across 12 industry domains
- 📥 **4 Export Formats** — .sql, .json, .csv, .pdf per query; bulk CSV/PDF from History
- 🔐 **NextAuth.js** — secure email/password authentication; data isolated per user

## Environment Variables (Vercel)

| Variable | Source | Required |
|---|---|---|
| `DATABASE_URL` | Neon → pooled connection | ✅ |
| `DIRECT_URL` | Neon → direct connection | ✅ |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ |
| `NEXTAUTH_URL` | Your Vercel app URL | ✅ |
| `GEMINI_API_KEY` | aistudio.google.com/apikey (free) | ✅ Recommended |
| `ANTHROPIC_API_KEY` | Optional fallback | ❌ Optional |

> **Tip:** The AI engine tries Gemini first, then falls back to the secondary provider automatically. Set at least one AI key.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** Neon PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js
- **AI:** Dual-provider engine with automatic failover
- **Export:** pdf-lib (serverless PDF), CSV, JSON
- **Charts:** Recharts

## Local Development

```bash
git clone <repo-url>
cd smart-query-optimizer
npm install
cp .env.example .env.local
# Fill in .env.local
npx prisma db push
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables above
4. Vercel runs `prisma generate && next build` automatically (see `vercel.json`)
