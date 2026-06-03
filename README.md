# ⚡ Smart Query Optimizer — Advanced SQL Query Optimizer

> **Craft, Optimize, Deploy — Your SQL, Supercharged by AI.**

A production-ready, full-stack Next.js 14 application that uses GPT-4o to analyze, optimize, and explain SQL queries across 8 database engines. Features a 3-step wizard, side-by-side diff viewer, index recommendations, execution cost estimation, real-time animations, and full query history.

---

## 🚀 Live Demo

**[smart-query-optimizer.vercel.app](https://smart-query-optimizer.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 GPT-4o Optimization | Context-aware query rewrites, not just pattern matching |
| ⚡ Execution Cost Estimation | Before/after cost units + millisecond estimates |
| 🗂️ Index Recommendations | Exact `CREATE INDEX` statements with impact ratings |
| 🔀 Diff Viewer | Side-by-side & unified diff with syntax highlighting |
| 🛢️ 8 Database Engines | PostgreSQL, MySQL, SQL Server, SQLite, Oracle, MongoDB, CockroachDB, Supabase |
| 📋 Schema-Aware | Paste your DDL for hyper-accurate index suggestions |
| 💬 Natural Language Mode | Describe your query in plain English |
| 📜 Query History | MongoDB-backed history with search & pagination |
| 📧 Contact Form | Resend-powered with admin notifications + user confirmation |
| 🎨 Cyber Dark Aesthetic | Framer Motion animations, glassmorphism, neon glows |

---

## 🏗️ Tech Stack

```
Frontend    Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion
AI          OpenAI GPT-4o (configurable model)
Database    MongoDB (Mongoose ODM) via MongoDB Atlas or local Docker
Email       Resend API
Deployment  Vercel (recommended) · Docker Compose (local dev)
```

---

## 📁 Project Structure

```
smart-query-optimizer/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout + fonts + Toaster
│   │   ├── globals.css              # CSS variables, animations, utilities
│   │   ├── optimizer/page.tsx       # 3-step wizard page
│   │   ├── examples/page.tsx        # Example browser page
│   │   ├── history/page.tsx         # Query history page
│   │   ├── contact/page.tsx         # Contact form page
│   │   ├── about/page.tsx           # About page
│   │   └── api/
│   │       ├── optimize/route.ts    # POST — AI optimization endpoint
│   │       ├── contact/route.ts     # POST — contact form + Resend
│   │       ├── history/route.ts     # GET/DELETE — query history
│   │       └── health/route.ts      # GET — health check
│   ├── components/
│   │   ├── layout/                  # Navbar, Footer
│   │   ├── landing/                 # HeroSection + all 7 landing sections
│   │   ├── optimizer/               # WizardShell, StepOne/Two/Three, Loader, Results
│   │   └── ExamplesBrowser.tsx      # Filterable example cards
│   ├── lib/
│   │   ├── mongodb.ts               # Mongoose connection with caching
│   │   ├── openai.ts                # OpenAI client singleton
│   │   ├── resend.ts                # Resend client + HTML email templates
│   │   ├── promptBuilder.ts         # GPT-4o system/user prompt construction
│   │   ├── rateLimit.ts             # In-memory rate limiter
│   │   └── utils.ts                 # cn(), formatters, SQL utilities
│   ├── models/
│   │   ├── QueryLog.ts              # Mongoose schema for optimization history
│   │   └── ContactMessage.ts        # Mongoose schema for contact messages
│   ├── hooks/index.ts               # useTypewriter, useClipboard, useOptimizer, etc.
│   ├── data/
│   │   ├── examples.ts              # 8 real-world SQL optimization examples
│   │   └── features.ts              # Features, testimonials, FAQ, pricing, stats
│   └── types/index.ts               # All TypeScript interfaces
├── public/favicon.svg
├── .env.example
├── docker-compose.yml
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## ⚙️ Setup

### 1. Clone & install

```bash
git clone https://github.com/yourusername/smart-query-optimizer
cd smart-query-optimizer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required for AI optimization
OPENAI_API_KEY=sk-...

# Required for email (contact form)
RESEND_API_KEY=re_...
ADMIN_EMAIL=your@email.com

# Required for history (MongoDB Atlas free tier works great)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/queryforge

# Auth secret (any random 32+ char string)
JWT_SECRET=your-super-secret-minimum-32-chars

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run development server

```bash
npm run dev
# → http://localhost:3000
```

### 4. (Optional) Docker Compose

```bash
docker-compose up -d
# App → http://localhost:3000
# Mongo Express UI → http://localhost:8081
```

---

## 🚀 Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

> **Free MongoDB:** Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier (512MB) — more than enough for history.
> **Free Email:** [Resend](https://resend.com) free tier (3,000 emails/month).
> **Free AI:** [OpenAI](https://platform.openai.com) — pay-as-you-go, ~$0.002 per optimization.

---

## 🔌 API Reference

### `POST /api/optimize`

Optimize a SQL query using GPT-4o.

```json
{
  "query": "SELECT * FROM orders JOIN customers ON ...",
  "dbType": "postgresql",
  "dbVersion": "15",
  "optimizationGoal": "speed",
  "schema": "CREATE TABLE orders (...);",
  "naturalLanguage": "Get pending orders with customer names",
  "options": {
    "temperature": 0.2,
    "includeExplain": true,
    "includeIndexes": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalQuery": "...",
    "optimizedQuery": "...",
    "explanation": "## Changes Made\n...",
    "indexSuggestions": [
      {
        "sql": "CREATE INDEX idx_orders_status ON orders(status, created_at DESC);",
        "reason": "Covers the WHERE and ORDER BY clauses, eliminating full table scan",
        "impact": "high"
      }
    ],
    "metrics": {
      "estimatedImprovement": 87,
      "beforeCost": 1240,
      "afterCost": 161,
      "estimatedExecMs": 180
    },
    "queryComplexity": "moderate",
    "warnings": []
  }
}
```

**Rate limit:** 10 requests/minute per IP (configurable via `RATE_LIMIT_OPTIMIZER_MAX`).

---

### `POST /api/contact`

Submit contact form. Sends admin notification + user confirmation via Resend.

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "subject": "Query optimization question",
  "category": "general",
  "message": "I have a question about..."
}
```

---

### `GET /api/history`

Fetch optimization history with pagination.

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |
| `dbType` | string | Filter by database engine |
| `goal` | string | Filter by optimization goal |
| `search` | string | Search in query text |

---

### `GET /api/health`

Returns service status and uptime.

```json
{
  "status": "ok",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "ai": "available",
    "email": "available"
  }
}
```

---

## 🎨 Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `--cyber-cyan` | `#00d4ff` | Primary brand, CTAs, active states |
| `--cyber-blue` | `#0080ff` | Secondary accents |
| `--cyber-purple` | `#8b5cf6` | Feature highlights |
| `--cyber-green` | `#00ff88` | Success states, improvement indicators |
| `--cyber-pink` | `#ff0080` | Error states, removed diff lines |
| `--bg-primary` | `#050508` | Page background |

### Typography
| Font | Variable | Usage |
|---|---|---|
| Orbitron | `--font-orbitron` | Headings, stats, logo |
| Inter | `--font-inter` | Body text, UI |
| JetBrains Mono | `--font-jetbrains` | SQL editor, code blocks |

---

## 🔐 Security

- **Rate limiting** — in-memory limiter per IP (swap for Redis/Upstash in production)
- **Input validation** — query length caps, email regex, category allow-lists
- **IP hashing** — SHA-256 hash of IP before DB storage (no raw IPs stored)
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` on all API routes
- **CORS** — handled by Next.js App Router defaults

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">

**Built with ⚡ by developers, for developers**

[Launch Optimizer](https://smart-query-optimizer.vercel.app/optimizer) · [Report Bug](https://smart-query-optimizer.vercel.app/contact) · [Request Feature](https://smart-query-optimizer.vercel.app/contact)

</div>
