# ⚡ QueryForge — AI Database Performance Platform

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript) ![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?logo=postgresql&logoColor=white) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel) ![License](https://img.shields.io/badge/License-MIT-violet)

**QueryForge** is a production-grade AI-powered SQL optimization platform. Dual AI engine (Claude + Gemini with automatic failover), live anti-pattern scanner, Natural Language to SQL converter, PII redaction, multi-dialect support, full analytics dashboard, and export in 4 formats — built as a full-stack Next.js 14 app.

---

## 🚀 Deploy in 2 Minutes — Zero Local Setup

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this folder to a new GitHub repo (drag-and-drop via github.com/new → uploading files — no `git` needed)
2. Import to [vercel.com/new](https://vercel.com/new)
3. Add the environment variables below
4. Click **Deploy** — database schema is created automatically, no manual migration needed

---

## ✨ Features

| Feature | Details |
|---|---|
| **Dual AI Engine** | Claude primary + Gemini automatic fallback. Either alone is sufficient. |
| **Natural Language → SQL** | Type plain English, get production-ready SQL for your chosen dialect |
| **PII Redaction** | Emails, SSNs, card numbers masked before any AI call — GDPR-safe |
| **Multi-Dialect** | PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server |
| **Live Scanner** | 10 anti-pattern rules run client-side as you type (zero API calls) |
| **File Upload** | Drag-and-drop .sql or .txt into the editor |
| **Deep Analysis** | Cost score, rows scanned estimate, complexity before/after, readability notes |
| **99 Examples** | Real flawed queries across 12 industry domains |
| **Full History** | List/grid view, search, filters, sub-tabs, pagination |
| **Analytics** | Charts, domain breakdown, AI engine split, streak, top gains |
| **Export** | SQL, JSON, CSV, PDF — single query or bulk history |
| **Self-healing schema** | `prisma db push` runs automatically on every Vercel deploy |
| **Health endpoint** | `/api/health` shows live status of all providers and DB |

---

## 3 · Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string |
| `DIRECT_URL` | ✅ | Neon **direct** connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | Your Vercel app URL |
| `ANTHROPIC_API_KEY` | ⚠️ one of these two | From console.anthropic.com |
| `GEMINI_API_KEY` | ⚠️ one of these two | **FREE** from aistudio.google.com/apikey |

> **You only need ONE AI key.** Setting both gives automatic failover. If your Anthropic key is invalid but you have a Gemini key, Gemini handles all requests automatically.

### Getting a Free Gemini Key (Recommended)
1. Go to **aistudio.google.com/apikey**
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste into Vercel as `GEMINI_API_KEY`
5. Redeploy — optimizer works immediately

---

## 4 · Project Structure

```
app/
  (auth)/login, register/     — Auth pages with home button
  (dashboard)/
    dashboard/                — KPI overview, charts, top gains
    optimizer/                — Main AI optimizer (dialect, PII, drag-drop)
    nl2sql/                   — Natural Language → SQL converter
    examples/                 — 99-example library
    history/                  — Grid/list view, sub-tabs, pagination
    analytics/                — 5-section charts dashboard
    settings/                 — Live health, export, rate limits
  api/
    optimize/                 — AI optimization (Claude/Gemini + PII redaction)
    nl2sql/                   — NL to SQL conversion
    queries/                  — CRUD + queryType/pagination filter
    analytics/                — Charts data + engine breakdown
    export/                   — SQL/JSON/CSV/PDF single + bulk
    health/                   — Live system diagnostics
lib/
  ai-engine.ts               — Dual-provider AI + PII redactor + NL2SQL
  examples-data.ts           — 99 SQL examples across 12 domains
  csv-export.ts / pdf-export.ts — Export formatters
components/
  layout/Sidebar.tsx          — Nav with NL2SQL badge
  optimizer/ExportMenu.tsx   — Multi-format export dropdown
```

---

## 5 · Troubleshooting

**Optimizer shows "AI engine authentication failed"**
→ Your ANTHROPIC_API_KEY is invalid or expired. Fix: add `GEMINI_API_KEY` (free at aistudio.google.com/apikey) to Vercel env vars — Gemini will take over automatically with no code changes.

**Health check shows `status: "❌ misconfigured"`**
→ Visit `/api/health` on your live app. It lists every check individually. Only `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and at least one AI key are truly required. `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` are each optional as long as the other is set.

**"Tables missing — trigger a Redeploy"**
→ The build command (`prisma generate && prisma db push --accept-data-loss && next build`) auto-creates tables. If you see this, go to Vercel → Deployments → click Redeploy.

**Accounts not persisting across sessions**
→ `NEXTAUTH_URL` must exactly match your Vercel app URL (e.g. `https://your-app.vercel.app`). Sessions last 30 days by default.

---

## 6 · Quick Deploy Checklist

- [ ] Push to GitHub
- [ ] Import to Vercel
- [ ] Add `DATABASE_URL` + `DIRECT_URL` (from neon.tech)
- [ ] Add `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Add `NEXTAUTH_URL` (your Vercel URL after first deploy)
- [ ] Add `GEMINI_API_KEY` (free from aistudio.google.com/apikey) **OR** `ANTHROPIC_API_KEY`
- [ ] Deploy
- [ ] Visit `/api/health` — confirm `status: "✅ healthy"`
- [ ] Register account and test first optimization

---

MIT License — QueryForge
