# ⚡ Smart Query Optimizer

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript) ![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?logo=postgresql&logoColor=white) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel) ![License](https://img.shields.io/badge/License-MIT-violet)

AI-powered SQL query optimizer. Real-time anti-pattern detection, AI-driven rewrites, Neon PostgreSQL persistence, full auth, analytics dashboards, and a 99-example domain library — built as a full-stack production app.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · NextAuth.js · Prisma + Neon PostgreSQL (serverless driver) · Anthropic AI SDK · Recharts · Vercel

---

## 🚀 Deploy in 2 Minutes — Zero Local Setup Required

You do **not** need Node.js, npm, or to run a single command on your computer to get this live. Vercel builds and installs everything for you.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/YOUR-REPO&env=DATABASE_URL,DIRECT_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,ANTHROPIC_API_KEY&envDescription=See%20the%20Environment%20Variables%20section%20below%20for%20how%20to%20get%20each%20value&project-name=smart-query-optimizer&repository-name=smart-query-optimizer)

1. Push this folder to a new GitHub repository (GitHub's web UI lets you drag-and-drop the unzipped folder to upload — no local `git` needed either, via [github.com/new](https://github.com/new) → "uploading an existing file").
2. Click the button above (after replacing `YOUR-USERNAME/YOUR-REPO` with your repo path), or just go to [vercel.com/new](https://vercel.com/new) and import your repo manually.
3. Paste in the 5 environment variable values (get them in 2 minutes — see [§3](#3--environment-variables) below).
4. Click **Deploy**. That's it — **the database tables are created automatically on every build** (see `vercel.json`), so there is no separate migration step to run, ever.
5. Visit `https://your-app.vercel.app/api/health` to confirm everything connected correctly.

---

## ✨ Features

- **Real AI optimization** — every query is analyzed live by Claude Sonnet, not pre-canned. Hardened response parsing means malformed AI output or non-SQL input never produces a dead-end "optimization failed" error — invalid input now gets a specific, friendly explanation with example queries to try instead.
- **Live anti-pattern scanner** — 10 regex rules flag N+1 subqueries, leading wildcards, implicit joins, etc. instantly in the editor as you type, with zero API calls.
- **99-example library** — real, intentionally-flawed SQL queries across 12 domains (E-Commerce, Healthcare, Banking & Finance, HR & Payroll, SaaS Analytics, Social Media, Real Estate, Logistics & Shipping, Education, Gaming, Marketing, Travel & Hospitality), filterable by domain/difficulty/search, with one click to load any example straight into the Optimizer.
- **Full auth** — email/password via NextAuth credentials provider, bcrypt-hashed, JWT sessions.
- **Persistent history** — every optimization saved to Neon Postgres: issues, improvements, index recs, complexity before/after, full original + optimized SQL.
- **Analytics dashboard** — Recharts bar/radar charts, daily trend (raw SQL `jsonb_array_elements` aggregation), streak tracking, domain breakdown.
- **Export** — download any optimization as annotated `.sql` or structured `.json`.
- **Rate limiting** — 20 optimizations/hour/user, enforced server-side against the DB.
- **Self-healing schema** — `prisma db push` runs automatically as part of every Vercel build, so the database is always in sync with the code with zero manual steps.
- **Built-in diagnostics** — `/api/health` checks every env var and does a live database query + table-existence check, so you can self-diagnose any deployment issue in one request.

---

## 1 · Local Setup (optional — only if you want to run it on your own machine)

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd smart-query-optimizer
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment Variables](#3--environment-variables) below), then:

```bash
npm run dev
```

The dev server doesn't run `prisma db push` automatically (only the production build does, via `vercel.json`/`package.json`'s `build` script). For local dev against your Neon database, run once:

```bash
npx prisma generate
npx prisma db push
```

Visit `http://localhost:3000`.

---

## 2 · Get Your Keys

### Neon PostgreSQL (free tier)
1. [neon.tech](https://neon.tech) → New Project.
2. Copy the **pooled connection string** → `DATABASE_URL` (must include `?sslmode=require&pgbouncer=true`).
3. Copy the **direct connection string** → `DIRECT_URL` (used only for migrations, no pgbouncer).

### Anthropic API key
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.
2. Copy into `ANTHROPIC_API_KEY`.

### NextAuth secret
```bash
openssl rand -base64 32
```
Copy the output into `NEXTAUTH_SECRET`.

---

## 3 · Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string |
| `DIRECT_URL` | ✅ | Neon **direct** connection string (migrations) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` locally; your Vercel URL in prod |
| `ANTHROPIC_API_KEY` | ✅ | From console.anthropic.com |
| `NEXT_PUBLIC_APP_URL` | Optional | Used in metadata/OG tags |
| `RATE_LIMIT_MAX` | Optional | Default `20` (optimizations/hour) |

**Never commit `.env` or `.env.local`** — `.gitignore` already blocks every `.env*` variant except `.env.example`.

---

## 4 · Push to GitHub

```bash
git init
git add .
git status              # confirm no .env / .env.local listed — should be ignored
git commit -m "Initial commit: Smart Query Optimizer"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Double-check nothing leaked:
```bash
git ls-files | grep -i env
# should print only: .env.example
```

---

## 5 · Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → select your repo.
2. Framework Preset: **Next.js** (auto-detected).
3. Before clicking **Deploy**, expand **Environment Variables** and add all six from the table above (apply to **Production**, **Preview**, and **Development**).
4. Click **Deploy**.

### Build settings (already configured via `vercel.json`)
| Setting | Value |
|---|---|
| Build Command | `prisma generate && prisma db push --accept-data-loss --skip-generate && next build` |
| Install Command | `npm install` |
| Output Directory | `.next` (default) |
| Node Version | 20.x (set in Vercel Project Settings → General if needed) |

### Important: `NEXTAUTH_URL` two-step
Vercel only assigns your `.vercel.app` domain **after** the first deploy:
1. Deploy once with `NEXTAUTH_URL=https://placeholder.vercel.app`.
2. Copy your real deployed URL from the Vercel dashboard.
3. Project Settings → Environment Variables → update `NEXTAUTH_URL` to the real URL.
4. Deployments → latest → **⋯** → **Redeploy** (env var changes require a redeploy to take effect).

### Database schema — fully automatic, no manual step
Every build runs `prisma db push` against your Neon database before `next build` — the `users`, `queries`, `accounts`, and `sessions` tables are created (or updated) automatically on every deploy. You never need to run a migration command yourself, locally or otherwise.

> **Note for later, once you have real production data:** `db push --accept-data-loss` is ideal for getting started fast, but it can silently drop a column if you remove a field from `schema.prisma` after the app has real user data. When that matters to you, switch to Prisma's proper migration workflow (`prisma migrate dev` locally to generate a migration file, commit it, then `prisma migrate deploy` in the build command instead of `db push`) for safe, reviewable schema changes.

---

## 6 · Post-Deploy Checklist

- [ ] Visit `https://your-app.vercel.app/api/health` → should return `{"status":"✅ healthy",...}`. If it returns `❌ misconfigured`, the JSON tells you exactly which env var or DB connection is broken — fix that first before testing anything else.
- [ ] Visit your Vercel URL → landing page renders with animations.
- [ ] `/register` → create an account → redirects to `/dashboard`.
- [ ] `/optimizer` → paste a query with `SELECT * FROM a, b WHERE a.id=b.id` → live scanner flags "Implicit JOIN" instantly.
- [ ] Click **Optimize with AI** → Claude returns issues + optimized SQL + index recs (requires `ANTHROPIC_API_KEY`).
- [ ] `/history` → optimization appears, persisted in Neon.
- [ ] `/analytics` → charts render (requires at least 1 saved query).
- [ ] Export a query as `.sql` and `.json` from the history page.

---

## 7 · Project Structure

```
app/
  (auth)/login, register/        — auth pages
  (dashboard)/                   — protected app shell
    dashboard/                   — overview + stats
    optimizer/                   — main AI optimizer tool
    examples/                    — 99-query example library (filter, search, load-into-optimizer)
    history/                     — saved optimizations
    analytics/                   — Recharts dashboards
    settings/                    — account settings
  api/
    auth/[...nextauth]/          — NextAuth handler
    auth/register/                — registration endpoint
    optimize/                    — Claude AI optimization endpoint
    queries/                     — CRUD for saved queries
    analytics/                   — aggregated stats (raw SQL + Prisma)
    export/                      — SQL/JSON download
  layout.tsx, page.tsx           — root layout + landing page
components/
  layout/                        — Providers, Sidebar
  optimizer/                     — SqlBlock, ScoreRing
lib/
  db.ts                          — Prisma + Neon serverless adapter
  auth.ts                        — NextAuth config
  anthropic.ts                   — Claude AI client + prompt + response parser
  examples-data.ts               — 99 example queries across 12 domains
  utils.ts                       — shared helpers, design tokens
prisma/
  schema.prisma                  — User, Query, Account, Session models
```

---

## 8 · Troubleshooting

**Registration fails with "Database tables aren't set up yet"**
→ Tables are created automatically by `prisma db push` as part of every build (see `vercel.json`). If you're seeing this, your deployment is running an older build that predates this automation. Fix: Vercel dashboard → Deployments → latest → **⋯** → **Redeploy**. Then check `/api/health` — `database_schema` should show `ok: true`. If it's still failing after a fresh redeploy, the one manual fallback is running `npx prisma db push` once from a machine with Node.js installed, pointed at your Neon `DATABASE_URL`.

**Build fails with "Failed to collect page data for /api/..." or "@prisma/client did not initialize yet"**
→ This is Next.js evaluating your API routes at build time, which triggers Prisma Client setup. Two causes, both already fixed in this codebase:
  1. Missing `binaryTargets` in `prisma/schema.prisma` — Vercel's build machine and Lambda runtime can use different OS images, so Prisma needs `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to bundle the right engine for both.
  2. Any code that synchronously `throw`s if an env var is missing, inside a module imported by an API route — this kills the *entire build*, not just that route. `lib/db.ts` intentionally never throws at import time; it fails lazily on first real query instead, which your route handlers already catch.
  
  If you still hit this after pulling the latest code: confirm `DATABASE_URL` is set for **all three** environments in Vercel (Production/Preview/Development), then **redeploy** — env var changes never apply to an existing build.

**Build fails with "ESLint must be installed"**
→ Never set `NODE_ENV=production` manually in Vercel env vars — it makes `npm install` skip devDependencies.

**"Application error" on every page**
→ `NEXTAUTH_SECRET` missing. Confirm it's set in all three environments (Production/Preview/Development) in Vercel.

**Prisma Client errors at runtime**
→ Confirm `DATABASE_URL` uses the **pooled** connection string with `?pgbouncer=true`, and `DIRECT_URL` uses the **unpooled** one. Visit `/api/health` to see the exact connection error.

**Login works locally but not on Vercel**
→ `NEXTAUTH_URL` doesn't match your deployed domain. Update it and redeploy (see step 5).

**Favicon/tab icon not showing or showing a generic placeholder**
→ Browsers cache favicons aggressively per-origin. After deploying, hard-refresh (Ctrl/Cmd+Shift+R) or open in an incognito window to see the updated icon immediately.

**"Optimization failed. Please try again." on a valid query**
→ Fixed. The previous version had two gaps: the AI response parser had no fallback if the model wrapped its JSON in any extra text, and there was no specific handling for input that isn't actually SQL. Both are now handled: malformed AI responses get one automatic retry with a stricter prompt before failing, and non-SQL input (gibberish, a stray word, a question) now returns a friendly "that doesn't look like SQL" explanation with example queries to try, instead of a generic error. If you still see this message, it means the AI engine genuinely couldn't be reached twice in a row — check `ANTHROPIC_API_KEY` is set correctly and visit `/api/health`.

---

## License

MIT — built with Smart Query Optimizer.
