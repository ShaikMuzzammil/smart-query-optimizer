import type { Feature, Testimonial, PricingPlan, FaqItem } from '@/types';

// ─── Features ──────────────────────────────────────────────
export const FEATURES: Feature[] = [
  {
    id: 'f-01',
    icon: '🧠',
    title: 'GPT-4o Powered Analysis',
    description: 'Leverages the latest GPT-4o model to understand your query semantics, schema relationships, and return deep, context-aware optimizations — not just pattern matching.',
    highlight: 'Powered by GPT-4o',
    color: '#00d4ff',
  },
  {
    id: 'f-02',
    icon: '⚡',
    title: 'Execution Cost Estimation',
    description: 'Get before/after cost estimates, projected execution time in milliseconds, and a realistic improvement percentage based on your specific database engine and version.',
    highlight: 'Up to 92% faster',
    color: '#0080ff',
  },
  {
    id: 'f-03',
    icon: '🗂️',
    title: 'Smart Index Recommendations',
    description: 'Automatically generates the exact CREATE INDEX statements your query needs — composite indexes, partial indexes, covering indexes — with impact ratings and rationale.',
    highlight: 'Exact CREATE INDEX SQL',
    color: '#8b5cf6',
  },
  {
    id: 'f-04',
    icon: '🔀',
    title: 'Side-by-Side Diff Viewer',
    description: 'Visually compare your original query against the optimized version with a syntax-highlighted diff viewer. Understand every single change at a glance.',
    highlight: 'Visual diff',
    color: '#00ff88',
  },
  {
    id: 'f-05',
    icon: '🛢️',
    title: '8 Database Engines',
    description: 'Native support for PostgreSQL, MySQL, SQL Server, SQLite, Oracle, CockroachDB, MongoDB, and Supabase — each with engine-specific optimization strategies.',
    highlight: '8 databases supported',
    color: '#ff6600',
  },
  {
    id: 'f-06',
    icon: '📋',
    title: 'Schema-Aware Optimization',
    description: 'Paste your CREATE TABLE statements for hyper-accurate recommendations. The AI uses real column types, constraints, and relationships to generate precise indexes.',
    highlight: 'Schema context aware',
    color: '#00d4ff',
  },
  {
    id: 'f-07',
    icon: '🌐',
    title: 'Natural Language Mode',
    description: 'Describe what you want in plain English. Smart Query Optimizer translates your intent into optimized SQL and then further optimizes it — no SQL expertise required.',
    highlight: 'Text-to-SQL',
    color: '#8b5cf6',
  },
  {
    id: 'f-08',
    icon: '📜',
    title: 'Full Query History',
    description: 'Every optimization is saved to your history. Browse, filter, re-run, and compare past optimizations. Export as CSV or JSON for team sharing.',
    highlight: 'Persistent history',
    color: '#0080ff',
  },
  {
    id: 'f-09',
    icon: '🔒',
    title: 'Privacy First',
    description: 'Your query data is processed in real-time and never stored on third-party AI servers beyond the request window. IP addresses are hashed before storage.',
    highlight: 'Privacy first',
    color: '#00ff88',
  },
];

// ─── Testimonials ──────────────────────────────────────────
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-01',
    quote: "Smart Query Optimizer found a missing composite index that cut our checkout query time from 4.2s to 180ms. That's a 95% improvement in under 30 seconds. Our DBA team was blown away.",
    author: 'Priya Nair',
    role: 'Senior Backend Engineer',
    company: 'Shopify Partner Agency',
    avatar: '',
    rating: 5,
  },
  {
    id: 't-02',
    quote: "We had a dashboard query joining 7 tables that was killing our read replica. SmartQuery refactored it with CTEs and the right indexes. DB CPU dropped from 85% to 12%. Incredible.",
    author: 'Marcus Chen',
    role: 'Database Architect',
    company: 'FinTech Startup',
    avatar: '',
    rating: 5,
  },
  {
    id: 't-03',
    quote: "As a bootcamp grad, I didn't fully understand query optimization. SmartQuery's explanations taught me why each change was made. It's a learning tool as much as a productivity tool.",
    author: 'Sofia Andersson',
    role: 'Junior Developer',
    company: 'Consulting Agency',
    avatar: '',
    rating: 5,
  },
  {
    id: 't-04',
    quote: "The schema-aware mode is a game-changer. It generated a partial index on is_deleted = false that I wouldn't have thought to add. Pagination queries are now 8× faster.",
    author: 'Ravi Kumar',
    role: 'Full-Stack Developer',
    company: 'SaaS Startup',
    avatar: '',
    rating: 5,
  },
  {
    id: 't-05',
    quote: "Used SmartQuery on a legacy SQL Server codebase full of YEAR() and MONTH() functions in WHERE clauses. It caught every sargability issue and generated the fixes automatically.",
    author: 'James O\'Brien',
    role: 'Lead DBA',
    company: 'Healthcare Enterprise',
    avatar: '',
    rating: 5,
  },
];

// ─── Pricing ───────────────────────────────────────────────
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for exploring and occasional optimization tasks.',
    highlighted: false,
    cta: 'Start Free',
    features: [
      '10 optimizations per day',
      'GPT-4o powered analysis',
      'All 8 database engines',
      'Index recommendations',
      'Basic history (7 days)',
      'Copy & download results',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    period: 'month',
    description: 'For developers and DBAs who optimize queries daily.',
    highlighted: true,
    cta: 'Start Free Trial',
    badge: '🔥 Most Popular',
    features: [
      'Unlimited optimizations',
      'GPT-4o powered analysis',
      'All 8 database engines',
      'Schema-aware optimization',
      'Unlimited history',
      'Natural language mode',
      'Execution plan analysis',
      'CSV/JSON export',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'month',
    description: 'For teams and organizations with advanced needs.',
    highlighted: false,
    cta: 'Contact Sales',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'SSO / SAML integration',
      'Custom AI model fine-tuning',
      'On-premise deployment option',
      'SLA guarantee',
      'Dedicated support engineer',
      'Audit logs & compliance',
    ],
  },
];

// ─── FAQ ───────────────────────────────────────────────────
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-01',
    question: 'How accurate are the optimization suggestions?',
    answer: 'Smart Query Optimizer uses GPT-4o with a highly specialized system prompt trained on thousands of real-world query optimization patterns. The suggestions are highly accurate for common anti-patterns like missing indexes, N+1 problems, and sargability issues. For very complex, domain-specific queries we always recommend testing in a staging environment. Our users report 70–95% performance improvements on typical queries.',
    category: 'accuracy',
  },
  {
    id: 'faq-02',
    question: 'Is my query data safe and private?',
    answer: 'Yes. Your query is sent to OpenAI\'s API over TLS to generate the optimization, and then immediately discarded from their servers per their API data usage policy. We store only a hashed version of your IP address (no PII). Your query content is saved to your history only if you have a SmartQuery account, and you can delete it at any time.',
    category: 'privacy',
  },
  {
    id: 'faq-03',
    question: 'Which databases are supported?',
    answer: 'Smart Query Optimizer supports PostgreSQL (8.x–16.x), MySQL (5.7–8.x), SQL Server (2016–2022), SQLite (3.x), Oracle Database (12c+), CockroachDB, MongoDB (aggregation pipeline), and Supabase. Each engine has specific optimization rules — for example, we generate PostgreSQL-specific partial index syntax and MySQL-specific FORCE INDEX hints when appropriate.',
    category: 'compatibility',
  },
  {
    id: 'faq-04',
    question: 'Do I need to provide my schema for it to work?',
    answer: 'No — SmartQuery works without a schema and makes reasonable assumptions based on the query structure and column names. However, providing your CREATE TABLE statements (or just the relevant tables) dramatically improves accuracy. The AI can then generate precise composite index column orders, avoid redundant suggestions, and tailor recommendations to your actual data types.',
    category: 'usage',
  },
  {
    id: 'faq-05',
    question: 'What is the natural language mode?',
    answer: 'Natural language mode lets you describe what you want in plain English, like "Get the top 10 customers by total spend in the last 90 days, grouped by region." Smart Query Optimizer will first generate the appropriate SQL, then optimize it, and return the full report. It\'s perfect for analysts who understand data but don\'t write SQL fluently, or for rapidly prototyping queries.',
    category: 'features',
  },
  {
    id: 'faq-06',
    question: 'How does the improvement percentage work?',
    answer: 'The estimated improvement percentage is calculated by comparing the AI\'s relative cost estimate before and after optimization. It\'s based on factors like: number of rows scanned (full table scan vs. index scan), join algorithm changes (hash join vs. nested loop vs. merge join), presence of subquery materialization, and index coverage. It\'s an estimate, not a guarantee — actual improvements depend on data distribution and server load.',
    category: 'accuracy',
  },
  {
    id: 'faq-07',
    question: 'Can I use Smart Query Optimizer for production queries?',
    answer: 'Absolutely — that\'s exactly what it\'s designed for. However, always test optimized queries in a staging environment first, especially if they change join order or add new indexes. The index suggestions should be tested with EXPLAIN ANALYZE before applying to production. We include safety warnings in the results when a suggestion could have side effects.',
    category: 'usage',
  },
  {
    id: 'faq-08',
    question: 'Is there a query length limit?',
    answer: 'The free tier supports queries up to 5,000 characters. Pro accounts support up to 20,000 characters, which covers virtually all real-world queries including stored procedures and complex analytical queries. Enterprise accounts have no limit. If your query exceeds the limit, SmartQuery will show a warning before submission.',
    category: 'limits',
  },
];

// ─── Stats ─────────────────────────────────────────────────
export const STATS = [
  { value: 50000,  suffix: '+', label: 'Queries Optimized',    icon: '⚡' },
  { value: 87,     suffix: '%', label: 'Avg. Improvement',     icon: '📈' },
  { value: 8,      suffix: '',  label: 'Database Engines',     icon: '🛢️' },
  { value: 4200,   suffix: '+', label: 'Developers Using It',  icon: '👩‍💻' },
];
