# ⚡ SmartQuery Pro — GODMODE

AI-powered SQL query optimizer. Real-time anti-pattern detection, Claude AI rewrites, Neon PostgreSQL persistence, full auth, analytics dashboards, and a 36-example domain library — built as a full-stack production app.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · NextAuth.js · Prisma + Neon PostgreSQL (serverless driver) · Claude AI (Anthropic SDK) · Recharts · Vercel

---

## ✨ Features

- **Real AI optimization** — every query is sent to Claude (`claude-sonnet-4-6`) and analyzed live, not pre-canned.
- **Live anti-pattern scanner** — 10 regex rules flag N+1 subqueries, leading wildcards, implicit joins, etc. instantly in the editor, with zero API calls.
- **Full auth** — email/password via NextAuth credentials provider, bcrypt-hashed, JWT sessions.
- **Persistent history** — every optimization saved to Neon Postgres: issues, improvements, index recs, complexity before/after, full original + optimized SQL.
- **Analytics dashboard** — Recharts bar/radar charts, daily trend (raw SQL `jsonb_array_elements` aggregation), streak tracking, domain breakdown.
- **Export** — download any optimization as annotated `.sql` or structured `.json`.
- **Rate limiting** — 20 optimizations/hour/user, enforced server-side against the DB.
- **36-example library** — real anti-pattern queries across 8 domains (E-Commerce, Healthcare, Finance, HR, Analytics, Social, Real Estate, Logistics).

---

## 1 · Local Setup

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd smartquery-pro
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment Variables](#3--environment-variables) below), then:

```bash
npx prisma generate
npx prisma db push        # creates tables in Neon
npm run db:seed           # optional: seeds a demo user
npm run dev
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
git commit -m "Initial commit: SmartQuery Pro GODMODE"
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
| Build Command | `prisma generate && next build` |
| Install Command | `npm install` |
| Output Directory | `.next` (default) |
| Node Version | 20.x (set in Vercel Project Settings → General if needed) |

### Important: `NEXTAUTH_URL` two-step
Vercel only assigns your `.vercel.app` domain **after** the first deploy:
1. Deploy once with `NEXTAUTH_URL=https://placeholder.vercel.app`.
2. Copy your real deployed URL from the Vercel dashboard.
3. Project Settings → Environment Variables → update `NEXTAUTH_URL` to the real URL.
4. Deployments → latest → **⋯** → **Redeploy** (env var changes require a redeploy to take effect).

### Push your Neon schema
After your first successful deploy (or before, doesn't matter — Neon is independent of Vercel):
```bash
npx prisma db push
```
Run this from your local machine with the same `DATABASE_URL`/`DIRECT_URL` as production, since Vercel's build step only runs `prisma generate` (schema sync), not `db push`.

---

## 6 · Post-Deploy Checklist

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
  anthropic.ts                   — Claude AI client + prompt
  utils.ts                       — shared helpers, design tokens
prisma/
  schema.prisma                  — User, Query, Account, Session models
  seed.ts                        — demo data seeder
```

---

## 8 · Troubleshooting

**Build fails with "ESLint must be installed"**
→ Never set `NODE_ENV=production` manually in Vercel env vars — it makes `npm install` skip devDependencies.

**"Application error" on every page**
→ `NEXTAUTH_SECRET` missing. Confirm it's set in all three environments (Production/Preview/Development) in Vercel.

**Prisma Client errors at runtime**
→ Confirm `DATABASE_URL` uses the **pooled** connection string with `?pgbouncer=true`, and `DIRECT_URL` uses the **unpooled** one.

**Login works locally but not on Vercel**
→ `NEXTAUTH_URL` doesn't match your deployed domain. Update it and redeploy (see step 5).

---

## License

MIT — built with SmartQuery Pro GODMODE.
