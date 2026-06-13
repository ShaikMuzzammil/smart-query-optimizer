# SmartQuery Pro

**AI-powered document intelligence & query optimization platform.**

Upload documents, get instant full-text search ranked by a real **BM25 inverted index**, have typos and vague
queries automatically corrected and expanded by an **AI query optimizer** (Google Gemini, optional), and explore
**sentiment, readability, named-entity, and issue-detection** insights across your whole library — all in a single
Next.js app deployable to Vercel with one click.

---

## ✨ Features

- **Real inverted index + BM25 ranking** — every document is tokenized, stemmed (Porter2), and indexed. Search
  results are ranked with `BM25(k1=1.5, b=0.75) × (1 + 0.2·recency) × (1 + 0.1·personalization)`.
- **AI query optimizer** — spell correction (static dictionary + Levenshtein fuzzy match against your own
  vocabulary), abbreviation/synonym expansion, and optional Gemini-powered semantic query expansion. Degrades
  gracefully to zero external calls if no API key is set.
- **Explainable results** — every result includes a full score breakdown: term frequency, IDF, recency boost, and
  personalization boost.
- **15+ document health checks** — PII detection (emails/phones), placeholder text, excessive repetition, low
  readability, negative sentiment, ALL CAPS, TODO markers, and more.
- **NLP analysis** — sentiment scoring, Flesch-Kincaid & Coleman-Liau readability, named entity extraction (people,
  places, organizations, dates, money) via `compromise`.
- **AI summaries & Q&A** — generate a TL;DR for any document, or ask natural-language questions across your whole
  library with cited sources (Gemini, with extractive fallback).
- **Live analytics dashboard** — queries over time, file growth, top TF-IDF terms, sentiment trends, recent query
  log. Polls every 15s for near-real-time updates (Vercel-friendly, no WebSocket infrastructure required).
- **Document versioning** — re-uploading a file with the same name keeps the previous version's word count and
  timestamp.
- **In-app notification center** — alerts for uploads, detected issues, AI summaries, and account events.
- **Multi-format uploads** — `.txt`, `.md`, `.pdf`, `.docx` up to 10MB.
- **Demo mode** — sign in with `demo@smartquery.com` / `password` and load 5 pre-written example documents with one
  click.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB (via Mongoose) |
| Auth | NextAuth.js (credentials provider, JWT sessions) |
| AI | Google Gemini (`@google/generative-ai`) — optional |
| NLP | `natural` (stemming), `compromise` (entities), `sentiment` |
| File parsing | `pdf-parse`, `mammoth` |
| Charts | Recharts |
| UI | Framer Motion, Lucide icons, `react-hot-toast`, `react-dropzone` |
| Data fetching | SWR (polling-based live updates) |

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill in values (see below)
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000. Click "Continue with demo account" on the login page to explore immediately — this
works even without `MONGODB_URI` configured (the demo session itself doesn't require a database, though
uploads/search do).

---

## Environment Variables

See `.env.example` for the full template with inline documentation. Summary:

| Variable | Required? | Purpose |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Signs session JWTs. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | Your app's canonical URL (`http://localhost:3000` locally, your Vercel URL in prod). |
| `MONGODB_URI` | Yes (for persistence) | MongoDB connection string. Free tier: MongoDB Atlas. |
| `GEMINI_API_KEY` | No | Enables AI query expansion, summaries, and Q&A. Free key: Google AI Studio. |
| `GEMINI_MODEL` | No | Defaults to `gemini-1.5-flash`. |
| `RATE_LIMIT_OPTIMIZER_MAX` | No | Defaults to `30` requests/min per user for the optimizer endpoint. |

### Setting up MongoDB Atlas (free)

1. Create a free account at mongodb.com/cloud/atlas.
2. Create a free M0 cluster.
3. Under Database Access, create a user with a username/password.
4. Under Network Access, add `0.0.0.0/0` (allow access from anywhere) — required for Vercel's dynamic IPs.
5. Click Connect → Drivers, copy the connection string, and replace `<password>` with your user's password.
6. Paste the result into `MONGODB_URI`. You can append a database name, e.g.
   `.../smartquery?retryWrites=true&w=majority`.

### Setting up Gemini (free, optional)

1. Go to aistudio.google.com/app/apikey.
2. Click "Create API key" (no credit card required for the free tier).
3. Paste it into `GEMINI_API_KEY`.

Without this key, the app still fully functions — AI-specific UI elements show a banner explaining that
"extractive fallback mode" is active.

---

## Deploying to Vercel

### 1. Push to GitHub

Push this repository to a new GitHub repo.

### 2. Import into Vercel

1. Go to vercel.com/new and import your repository.
2. Framework Preset: Next.js (auto-detected).
3. Build Command: `next build` (default — no changes needed).
4. Output Directory: `.next` (default).
5. Install Command: `npm install` (default).

### 3. Add Environment Variables

In Project Settings → Environment Variables, add (for Production, Preview, and Development as needed):

```
NEXTAUTH_SECRET=<output of: openssl rand -base64 32>
NEXTAUTH_URL=https://<your-project>.vercel.app
MONGODB_URI=<your MongoDB Atlas connection string>
GEMINI_API_KEY=<your Gemini API key>          # optional
RATE_LIMIT_OPTIMIZER_MAX=30                    # optional
```

> Important: After your first deploy, Vercel assigns your project a `.vercel.app` URL. Update `NEXTAUTH_URL` to
> match that exact URL (including `https://`), then redeploy (or just trigger a redeploy from the dashboard) —
> NextAuth requires this to match for cookies/redirects to work correctly.

### 4. Deploy

Click Deploy. The build runs `next build`, type-checks the whole project, and produces serverless functions for
every API route automatically — no extra configuration needed.

### 5. Verify

- Visit your deployed URL — you should see the landing page.
- Click "Continue with demo account" and load demo documents from the dashboard.
- Run a search for "eror handeling" and confirm the optimizer suggests "error handling".

### Notes on Vercel function limits

- File upload, demo seeding, search, and AI routes set `maxDuration` (30-60s) for larger documents. On the Hobby
  plan, Vercel may cap actual execution time depending on your account configuration — if very large PDFs time out,
  either reduce file sizes or upgrade your plan.
- This app intentionally avoids WebSockets/Socket.io (which don't run on Vercel's serverless functions). "Real-time"
  updates use SWR polling (every 15s for notifications/dashboards) — this is reliable, scales with serverless, and
  requires zero extra infrastructure (no Redis pub/sub needed).

---

## Architecture Overview

```
app/
├── page.tsx                 # Landing page (marketing site)
├── (auth)/login, register   # Auth pages
├── (app)/                   # Authenticated app shell
│   ├── dashboard/           # Overview metrics + charts
│   ├── upload/              # Drag-and-drop upload + live NLP results
│   ├── files/, files/[id]/  # File list + detail (analysis, summary, versions)
│   ├── search/              # BM25 search + query optimizer UI
│   ├── analytics/           # Full analytics dashboards + export
│   ├── ai-insights/         # Q&A and document summaries
│   └── settings/            # Preferences + session reset
└── api/
    ├── upload/               # File upload -> text extraction -> NLP analysis
    ├── files/, files/[id]/   # CRUD for documents
    ├── search/, search/optimize/  # Core search + optimizer-only endpoint
    ├── analytics/            # Aggregated dashboard data
    ├── ai/summarize, ai/qa, ai/status  # Gemini-backed AI features
    ├── notifications/        # In-app notification center
    ├── user/settings, user/reset
    ├── demo/seed/            # Loads 5 example documents
    └── register/, auth/[...nextauth]/

lib/
├── search/
│   ├── invertedIndex.ts     # BM25 ranking engine + snippet highlighting
│   ├── queryOptimizer.ts    # Spell correction, synonym expansion, AI rewriting
│   ├── nlpAnalyzer.ts        # Sentiment, entities, readability, 15 issue rules
│   ├── textProcessing.ts    # Tokenization, stemming, Levenshtein, readability math
│   ├── synonyms.ts           # Static synonym/abbreviation/correction dictionaries
│   └── personalization.ts   # Builds per-user term-weight map from search history
├── ai/gemini.ts              # Gemini client wrapper (graceful no-key fallback)
├── files/extractText.ts     # txt/md/pdf/docx text extraction
├── db/models/                # Mongoose schemas (User, FileDoc, QueryLog, Notification)
├── auth.ts, session.ts       # NextAuth config + server session helper
└── rateLimit.ts              # In-memory sliding-window rate limiter
```

### How the query optimizer works

Every search runs through a five-stage pipeline (see the "AI Optimizer" section on the landing page for a visual
walkthrough):

1. Tokenize the raw query.
2. Spell-correct using a static dictionary of common misspellings, plus fuzzy (Levenshtein <= 2) matching against
   the terms that actually appear in your documents.
3. Expand synonyms/abbreviations via a built-in dictionary (e.g. `ai -> artificial intelligence`, `bug -> defect,
   issue, error`).
4. (Optional) AI expansion — if `GEMINI_API_KEY` is set, Gemini suggests up to 5 additional semantically related
   terms based on the corrected query.
5. Rank with BM25 plus a recency boost (newer documents score slightly higher) and a personalization boost (terms
   from your past successful searches get a small ongoing boost).

Steps 1-3 and 5 require zero external dependencies beyond MongoDB — the app is a fully functional search engine
without any AI configuration.

### Extending with new file types

1. Add an extraction branch in `lib/files/extractText.ts` (dynamically import your parser, mirroring the
   `pdf`/`docx` branches).
2. Add the extension to `ALLOWED_EXTENSIONS` in the same file and to the `fileType` enum in
   `lib/db/models/FileDoc.ts`.
3. Add an icon mapping in `components/files/FileCard.tsx` and `lib/utils.ts` (`FILE_TYPE_COLORS`).
4. Add the new extension to the `accept` map in `components/upload/DropZone.tsx` and to the filter dropdown in
   `components/search/FilterBar.tsx`.

---

## Demo Account

```
Email:    demo@smartquery.com
Password: password
```

This account works even without `MONGODB_URI` configured (for the login session itself). To persist uploaded files
and search history, configure MongoDB. From the dashboard's empty state, click "Load demo documents" to instantly
populate the account with 5 fully-analyzed example files (privacy policy, error log, customer feedback, meeting
notes, API docs) — great for testing search, analytics, and AI insights.

---

## Suggested test queries

Once demo data is loaded, try searching:

- `eror handeling` -> corrected to "error handling", surfaces the meeting notes and error log.
- `refund policy` -> surfaces the privacy policy and customer feedback.
- `performance` -> surfaces meeting notes and feedback about slow search.
- `onboarding` -> surfaces meeting notes and the review requesting a guided tour.

---

## License

This project was generated for personal/educational use. Adapt freely.
