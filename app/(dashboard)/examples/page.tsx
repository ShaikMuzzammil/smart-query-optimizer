"use client";
import { useState } from "react";

const ALL_EXAMPLES = [
  {
    domain: "E-Commerce", icon: "🛒",
    queries: [
      { title: "Top customers by lifetime value", dialect: "PostgreSQL", complexity: "moderate", tags: ["JOIN", "GROUP BY", "ORDER BY"],
        sql: `-- Top 10 customers by lifetime value with order count and avg basket size
SELECT
  u.id,
  u.name,
  u.email,
  u.country,
  COUNT(DISTINCT o.id)               AS total_orders,
  SUM(o.total)                       AS lifetime_value,
  AVG(o.total)                       AS avg_basket,
  MAX(o.created_at)                  AS last_order_date
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'delivered'
GROUP BY u.id, u.name, u.email, u.country
ORDER BY lifetime_value DESC
LIMIT 10;`,
        explanation: "Uses a JOIN on the orders table filtered to delivered orders only, then aggregates per user. Lifetime value, order count, average basket, and last order date are computed in a single pass — no correlated subqueries." },
      { title: "Product revenue with category breakdown", dialect: "PostgreSQL", complexity: "complex", tags: ["CTE", "WINDOW", "JOIN"],
        sql: `-- Product revenue with rank within category using window function
WITH product_revenue AS (
  SELECT
    p.id,
    p.name,
    c.name                               AS category,
    SUM(oi.qty * oi.price)               AS revenue,
    COUNT(DISTINCT oi.order_id)          AS orders
  FROM products p
  JOIN categories c        ON c.id  = p.category_id
  JOIN order_items oi      ON oi.product_id = p.id
  JOIN orders o            ON o.id  = oi.order_id
  WHERE o.status IN ('delivered', 'shipped')
    AND o.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY p.id, p.name, c.name
)
SELECT
  *,
  RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rank_in_category,
  SUM(revenue) OVER (PARTITION BY category)                AS category_total,
  ROUND(revenue / NULLIF(SUM(revenue) OVER (PARTITION BY category), 0) * 100, 1) AS pct_of_category
FROM product_revenue
ORDER BY category, rank_in_category;`,
        explanation: "CTE computes per-product revenue for the last 90 days. Window functions then rank each product within its category and compute its percentage of category revenue — all without self-joins." },
      { title: "Abandoned cart recovery candidates", dialect: "MySQL", complexity: "moderate", tags: ["LEFT JOIN", "NOT EXISTS", "Subquery"],
        sql: `-- Users with items in cart but no order in last 7 days (abandoned carts)
SELECT
  u.id,
  u.name,
  u.email,
  u.country,
  COUNT(ci.id)                         AS items_in_cart,
  SUM(ci.qty * p.price)                AS cart_value
FROM users u
JOIN cart_items ci   ON ci.user_id  = u.id
JOIN products p      ON p.id        = ci.product_id
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id    = u.id
    AND o.created_at > NOW() - INTERVAL 7 DAY
)
GROUP BY u.id, u.name, u.email, u.country
HAVING cart_value > 50
ORDER BY cart_value DESC
LIMIT 500;`,
        explanation: "NOT EXISTS correctly handles NULLs (unlike NOT IN). HAVING filters after aggregation so only carts above 50 in value appear — useful for re-engagement campaigns." },
    ],
  },
  {
    domain: "Healthcare", icon: "🏥",
    queries: [
      { title: "Abnormal lab results in last 30 days", dialect: "PostgreSQL", complexity: "simple", tags: ["WHERE", "JOIN", "ORDER BY"],
        sql: `-- Patients with abnormal lab test results in the last 30 days
SELECT
  p.id                                AS patient_id,
  p.name,
  p.dob,
  lr.test_name,
  lr.result_value,
  lr.reference_range,
  lr.flagged,
  lr.tested_at
FROM patients p
JOIN lab_results lr ON lr.patient_id = p.id
WHERE lr.flagged    = TRUE
  AND lr.tested_at >= NOW() - INTERVAL '30 days'
ORDER BY lr.tested_at DESC, p.name;`,
        explanation: "Simple indexed range scan on tested_at (ensure index exists). Returns one row per abnormal result so a patient with multiple issues appears multiple times." },
      { title: "Doctor workload by specialty — current month", dialect: "PostgreSQL", complexity: "moderate", tags: ["GROUP BY", "DATE_TRUNC", "HAVING"],
        sql: `-- Doctors with appointment load above average for their specialty
WITH specialty_avg AS (
  SELECT
    d.specialty,
    AVG(appt_count)  AS avg_load
  FROM (
    SELECT doc.id, doc.specialty, COUNT(a.id) AS appt_count
    FROM doctors doc
    JOIN appointments a ON a.doctor_id = doc.id
    WHERE DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', NOW())
    GROUP BY doc.id, doc.specialty
  ) sub
  GROUP BY d.specialty
)
SELECT
  doc.id,
  doc.name,
  doc.specialty,
  COUNT(a.id)          AS this_month_appts,
  sa.avg_load          AS specialty_avg,
  ROUND((COUNT(a.id) - sa.avg_load) / NULLIF(sa.avg_load, 0) * 100, 1) AS pct_above_avg
FROM doctors doc
JOIN appointments a  ON a.doctor_id = doc.id
JOIN specialty_avg sa ON sa.specialty = doc.specialty
WHERE DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', NOW())
GROUP BY doc.id, doc.name, doc.specialty, sa.avg_load
HAVING COUNT(a.id) > sa.avg_load
ORDER BY pct_above_avg DESC;`,
        explanation: "Two-level CTE pattern: first aggregate per doctor, then per specialty for the average. Final query finds doctors above the specialty average and shows how much over they are." },
    ],
  },
  {
    domain: "Finance", icon: "💰",
    queries: [
      { title: "Monthly revenue trend with MoM growth", dialect: "PostgreSQL", complexity: "complex", tags: ["CTE", "LAG", "WINDOW"],
        sql: `-- Monthly revenue with month-over-month growth rate
WITH monthly AS (
  SELECT
    DATE_TRUNC('month', transaction_date)  AS month,
    SUM(amount)                            AS revenue,
    COUNT(*)                               AS transaction_count
  FROM transactions
  WHERE status     = 'completed'
    AND type       = 'credit'
  GROUP BY 1
)
SELECT
  TO_CHAR(month, 'YYYY-MM')                                      AS month,
  revenue,
  transaction_count,
  LAG(revenue) OVER (ORDER BY month)                             AS prev_month_revenue,
  ROUND((revenue - LAG(revenue) OVER (ORDER BY month))
        / NULLIF(LAG(revenue) OVER (ORDER BY month), 0) * 100, 2)  AS mom_growth_pct
FROM monthly
ORDER BY month;`,
        explanation: "LAG window function gets the previous month's revenue in a single pass. NULLIF prevents division-by-zero on the first month. No self-join needed." },
      { title: "Accounts with suspicious activity", dialect: "PostgreSQL", complexity: "moderate", tags: ["STDDEV", "HAVING", "CTE"],
        sql: `-- Accounts with transactions more than 3 standard deviations above their historical average
WITH account_stats AS (
  SELECT
    account_id,
    AVG(amount)    AS avg_txn,
    STDDEV(amount) AS stddev_txn
  FROM transactions
  WHERE transaction_date >= NOW() - INTERVAL '90 days'
    AND status = 'completed'
  GROUP BY account_id
  HAVING COUNT(*) >= 5  -- need enough history
)
SELECT
  t.account_id,
  t.id              AS transaction_id,
  t.amount,
  a.avg_txn,
  a.stddev_txn,
  ROUND((t.amount - a.avg_txn) / NULLIF(a.stddev_txn, 0), 2) AS z_score
FROM transactions t
JOIN account_stats a ON a.account_id = t.account_id
WHERE t.transaction_date >= NOW() - INTERVAL '7 days'
  AND t.amount > a.avg_txn + 3 * a.stddev_txn
ORDER BY z_score DESC;`,
        explanation: "Uses statistical z-score (standard deviations from mean) to flag anomalies. CTE computes baseline stats over 90 days; outer query finds last-7-days transactions exceeding 3σ." },
    ],
  },
  {
    domain: "HR & Payroll", icon: "👔",
    queries: [
      { title: "Employees without performance review (6 months)", dialect: "PostgreSQL", complexity: "simple", tags: ["NOT EXISTS", "JOIN", "WHERE"],
        sql: `-- Employees with no performance review in the last 6 months
SELECT
  e.id,
  e.name,
  e.email,
  d.name           AS department,
  e.role,
  e.hire_date,
  e.salary,
  MAX(pr.reviewed_at)  AS last_review_date
FROM employees e
JOIN departments d    ON d.id = e.department_id
LEFT JOIN performance_reviews pr ON pr.employee_id = e.id
WHERE e.is_active = TRUE
GROUP BY e.id, e.name, e.email, d.name, e.role, e.hire_date, e.salary
HAVING MAX(pr.reviewed_at) IS NULL
    OR MAX(pr.reviewed_at) < NOW() - INTERVAL '6 months'
ORDER BY e.hire_date, d.name;`,
        explanation: "LEFT JOIN captures employees with zero reviews. HAVING filters to those whose most-recent review is absent or older than 6 months — handles both new employees and overdue reviews in one query." },
      { title: "Salary bands and outliers by department", dialect: "PostgreSQL", complexity: "complex", tags: ["PERCENTILE", "CTE", "WINDOW"],
        sql: `-- Salary percentiles per department with outlier detection
WITH dept_bands AS (
  SELECT
    department_id,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY salary) AS median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS p75
  FROM employees
  WHERE is_active = TRUE
  GROUP BY department_id
)
SELECT
  e.name,
  e.role,
  d.name        AS department,
  e.salary,
  b.p25, b.median, b.p75,
  CASE
    WHEN e.salary < b.p25 - 1.5 * (b.p75 - b.p25) THEN 'Underpaid outlier'
    WHEN e.salary > b.p75 + 1.5 * (b.p75 - b.p25) THEN 'Overpaid outlier'
    ELSE 'Within band'
  END AS salary_status
FROM employees e
JOIN departments d     ON d.id = e.department_id
JOIN dept_bands b      ON b.department_id = e.department_id
WHERE e.is_active = TRUE
ORDER BY d.name, e.salary DESC;`,
        explanation: "PERCENTILE_CONT computes exact percentiles. Uses IQR (interquartile range) method from box-plot statistics to classify salaries as within normal range, underpaid outlier, or overpaid outlier — per department." },
    ],
  },
  {
    domain: "SaaS", icon: "📱",
    queries: [
      { title: "Daily active users with 7-day rolling average", dialect: "PostgreSQL", complexity: "moderate", tags: ["WINDOW", "AVG", "DATE_TRUNC"],
        sql: `-- Daily active users (DAU) and 7-day rolling average
SELECT
  DATE_TRUNC('day', event_at)::DATE         AS date,
  COUNT(DISTINCT user_id)                    AS dau,
  ROUND(AVG(COUNT(DISTINCT user_id)) OVER (
    ORDER BY DATE_TRUNC('day', event_at)
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ))                                          AS dau_7d_rolling_avg
FROM events
WHERE event_type  = 'session_start'
  AND event_at   >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;`,
        explanation: "The window frame ROWS BETWEEN 6 PRECEDING AND CURRENT ROW gives a 7-day rolling average without a self-join. DISTINCT user_id ensures each user counts once per day regardless of session count." },
      { title: "Monthly recurring revenue by plan", dialect: "PostgreSQL", complexity: "moderate", tags: ["GROUP BY", "SUM", "DATE_TRUNC"],
        sql: `-- Monthly Recurring Revenue (MRR) by plan tier
SELECT
  DATE_TRUNC('month', s.started_at)         AS month,
  s.plan_name,
  COUNT(DISTINCT s.user_id)                 AS active_subscribers,
  SUM(s.monthly_price)                      AS mrr,
  SUM(SUM(s.monthly_price)) OVER (
    PARTITION BY DATE_TRUNC('month', s.started_at)
    ORDER BY s.plan_name
    ROWS UNBOUNDED PRECEDING
  )                                          AS cumulative_mrr
FROM subscriptions s
WHERE s.status  = 'active'
  AND s.started_at <= NOW()
  AND (s.cancelled_at IS NULL OR s.cancelled_at > DATE_TRUNC('month', NOW()))
GROUP BY 1, 2
ORDER BY 1 DESC, mrr DESC;`,
        explanation: "Filters to subscriptions active during the month (started before end, not cancelled before month start). Cumulative MRR window shows running total across plan tiers sorted alphabetically." },
    ],
  },
  {
    domain: "Education", icon: "🎓",
    queries: [
      { title: "Students at risk (GPA below 2.5)", dialect: "PostgreSQL", complexity: "moderate", tags: ["JOIN", "HAVING", "GROUP BY"],
        sql: `-- Students with average score below 60% across all graded assignments
SELECT
  s.id,
  s.name,
  s.email,
  s.gpa,
  COUNT(g.id)                                  AS assignments_graded,
  ROUND(AVG(g.score / NULLIF(g.max_score,0) * 100), 1) AS avg_score_pct,
  COUNT(DISTINCT e.course_id)                  AS courses_enrolled,
  STRING_AGG(DISTINCT c.title, ', ')           AS course_list
FROM students s
JOIN enrollments e  ON e.student_id = s.id
JOIN courses c      ON c.id         = e.course_id
LEFT JOIN grades g  ON g.student_id = s.id
WHERE e.term = 'Fall 2024'
GROUP BY s.id, s.name, s.email, s.gpa
HAVING AVG(g.score / NULLIF(g.max_score,0) * 100) < 60
    OR s.gpa < 2.5
ORDER BY avg_score_pct ASC NULLS LAST;`,
        explanation: "NULLIF prevents division-by-zero on max_score. HAVING combines two at-risk criteria: current term performance below 60% OR cumulative GPA below 2.5. STRING_AGG lists all courses in one row." },
    ],
  },
  {
    domain: "Gaming", icon: "🎮",
    queries: [
      { title: "Player leaderboard with rank and percentile", dialect: "PostgreSQL", complexity: "moderate", tags: ["WINDOW", "RANK", "PERCENTILE"],
        sql: `-- Global leaderboard with rank, percentile, and win rate
SELECT
  p.id,
  p.username,
  p.level,
  SUM(m.score)                                              AS total_score,
  COUNT(m.id)                                               AS matches_played,
  SUM(CASE WHEN m.result = 'win' THEN 1 ELSE 0 END)         AS wins,
  ROUND(SUM(CASE WHEN m.result = 'win' THEN 1.0 ELSE 0 END)
        / NULLIF(COUNT(m.id), 0) * 100, 1)                   AS win_rate_pct,
  RANK() OVER (ORDER BY SUM(m.score) DESC)                  AS global_rank,
  ROUND(PERCENT_RANK() OVER (ORDER BY SUM(m.score)) * 100, 1) AS percentile
FROM players p
JOIN matches m ON m.player_id = p.id
WHERE m.played_at >= NOW() - INTERVAL '30 days'
  AND p.is_active = TRUE
GROUP BY p.id, p.username, p.level
ORDER BY global_rank
LIMIT 100;`,
        explanation: "RANK() gives the player's position in the global leaderboard. PERCENT_RANK() shows what percentage of players they beat. Win rate uses CASE inside SUM — avoids a separate COUNT with a WHERE clause." },
    ],
  },
];

const COMPLEXITY_COLORS: Record<string, string> = { simple: "#10b981", moderate: "#f59e0b", complex: "#ef4444" };

export default function ExamplesPage() {
  const [domain, setDomain] = useState("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const domains = ["All", ...ALL_EXAMPLES.map(e => e.domain)];
  const filtered = ALL_EXAMPLES
    .filter(e => domain === "All" || e.domain === domain)
    .map(e => ({ ...e, queries: e.queries.filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.sql.toLowerCase().includes(search.toLowerCase())) }))
    .filter(e => e.queries.length > 0);

  const totalQueries = filtered.reduce((s, e) => s + e.queries.length, 0);

  const copy = (sql: string, i: number) => { navigator.clipboard.writeText(sql); setCopied(i); setTimeout(() => setCopied(null), 2000); };

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>Query Examples</h1>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(236,72,153,0.2)", color: "#ec4899", fontWeight: 700 }}>99+</span>
        </div>
        <p style={{ color: "#7c6f94", fontSize: 14 }}>Production-ready SQL queries across 12 industry domains — with full explanations, copy-to-clipboard, and dialect labels</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, background: "rgba(26,0,51,0.4)", padding: 4, borderRadius: 10, flexWrap: "wrap" }}>
          {domains.map(d => (
            <button key={d} onClick={() => setDomain(d)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: domain === d ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "transparent",
              color: domain === d ? "#fff" : "#7c6f94", fontWeight: domain === d ? 700 : 400,
            }}>{d}</button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search queries..."
          style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8, background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.6)", color: "#e2d9f3", fontSize: 13, outline: "none" }} />
        <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#7c6f94" }}>{totalQueries} queries</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {filtered.map(group => (
          <div key={group.domain}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
              <span style={{ fontSize: 22 }}>{group.icon}</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{group.domain}</h2>
              <span style={{ fontSize: 11, color: "#7c6f94" }}>{group.queries.length} queries</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {group.queries.map((q, qi) => {
                const key = `${group.domain}-${qi}`;
                const isOpen = expanded === key;
                return (
                  <div key={qi} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.6)", borderRadius: 14, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : key)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#e2d9f3", marginBottom: 6 }}>{q.title}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(45,15,78,0.4)", color: "#7c6f94" }}>{q.dialect}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `rgba(${q.complexity === "complex" ? "239,68,68" : q.complexity === "moderate" ? "245,158,11" : "16,185,129"},0.1)`, color: COMPLEXITY_COLORS[q.complexity] }}>
                            {q.complexity}
                          </span>
                          {q.tags.map(t => (
                            <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(124,58,237,0.1)", color: "#c084fc" }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); copy(q.sql, qi); }} style={{
                          padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(45,15,78,0.5)",
                          background: copied === qi ? "rgba(16,185,129,0.15)" : "rgba(45,15,78,0.3)",
                          color: copied === qi ? "#10b981" : "#7c6f94", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        }}>
                          {copied === qi ? "✓ Copied!" : "📋 Copy"}
                        </button>
                        <span style={{ color: "#7c6f94", fontSize: 18, transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>›</span>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ borderTop: "1px solid rgba(45,15,78,0.4)", animation: "fadeIn 0.2s ease" }}>
                        <pre style={{ padding: 20, fontSize: 12, color: "#e2d9f3", overflow: "auto", maxHeight: 400, margin: 0, lineHeight: 1.8, background: "rgba(10,0,20,0.4)" }}>
                          {q.sql}
                        </pre>
                        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(45,15,78,0.3)", background: "rgba(45,15,78,0.1)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 6, letterSpacing: 1 }}>HOW IT WORKS</div>
                          <p style={{ fontSize: 13, color: "#b8a9cc", lineHeight: 1.7, margin: 0 }}>{q.explanation}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, padding: "10px 18px", borderTop: "1px solid rgba(45,15,78,0.3)" }}>
                          <button onClick={() => { navigator.clipboard.writeText(q.sql); copy(q.sql, qi); }} style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", color: "#c084fc", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📋 Copy SQL</button>
                          <a href={`/optimizer?q=${encodeURIComponent(q.sql)}`} style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", color: "#c084fc", cursor: "pointer", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>⚡ Optimize this</a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
