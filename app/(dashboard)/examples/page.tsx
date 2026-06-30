"use client";
// app/(dashboard)/examples/page.tsx — FIX #14: full, complete queries (not half-finished), copy options
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Copy, Check, ChevronRight, Zap, Brain, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Example {
  title: string;
  dialect: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sql: string;
  description: string;
}

// FIX #14: Every query below is complete and runnable — no truncated/half SQL
const EXAMPLES: Record<string, Example[]> = {
  "E-Commerce": [
    {
      title: "Top 10 customers by lifetime revenue",
      dialect: "PostgreSQL", difficulty: "Beginner",
      description: "Aggregate total spend per customer and rank descending.",
      sql: `SELECT
  c.id,
  c.name,
  c.email,
  COUNT(o.id)        AS order_count,
  SUM(o.total_amount) AS lifetime_revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'completed'
GROUP BY c.id, c.name, c.email
ORDER BY lifetime_revenue DESC
LIMIT 10;`,
    },
    {
      title: "Products below reorder threshold",
      dialect: "MySQL", difficulty: "Beginner",
      description: "Find low-stock products grouped by category with supplier contact.",
      sql: `SELECT
  p.id,
  p.name AS product_name,
  p.stock_qty,
  p.reorder_threshold,
  c.name AS category,
  s.contact_email AS supplier_contact
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN suppliers s ON s.id = p.supplier_id
WHERE p.stock_qty < p.reorder_threshold
ORDER BY p.stock_qty ASC;`,
    },
    {
      title: "Monthly cohort retention",
      dialect: "PostgreSQL", difficulty: "Advanced",
      description: "Track what percentage of each signup cohort placed an order in subsequent months.",
      sql: `WITH cohorts AS (
  SELECT
    id AS customer_id,
    DATE_TRUNC('month', created_at) AS cohort_month
  FROM customers
),
activity AS (
  SELECT
    o.customer_id,
    DATE_TRUNC('month', o.created_at) AS order_month
  FROM orders o
  WHERE o.status = 'completed'
)
SELECT
  c.cohort_month,
  a.order_month,
  COUNT(DISTINCT a.customer_id) AS active_customers,
  ROUND(
    COUNT(DISTINCT a.customer_id)::numeric /
    NULLIF(COUNT(DISTINCT c.customer_id), 0) * 100, 1
  ) AS retention_pct
FROM cohorts c
LEFT JOIN activity a
  ON a.customer_id = c.customer_id
  AND a.order_month >= c.cohort_month
GROUP BY c.cohort_month, a.order_month
ORDER BY c.cohort_month, a.order_month;`,
    },
    {
      title: "Abandoned cart recovery candidates",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "Customers who added items but didn't check out in the last 7 days.",
      sql: `SELECT
  c.id,
  c.name,
  c.email,
  ca.id           AS cart_id,
  SUM(ci.quantity * ci.unit_price) AS cart_value,
  MAX(ca.updated_at) AS last_activity
FROM carts ca
JOIN customers c ON c.id = ca.customer_id
JOIN cart_items ci ON ci.cart_id = ca.id
WHERE ca.status = 'active'
  AND ca.updated_at >= NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.id
      AND o.created_at >= ca.updated_at
  )
GROUP BY c.id, c.name, c.email, ca.id
HAVING SUM(ci.quantity * ci.unit_price) > 50
ORDER BY cart_value DESC;`,
    },
  ],
  "Healthcare": [
    {
      title: "Patients with abnormal labs (30 days)",
      dialect: "PostgreSQL", difficulty: "Beginner",
      description: "List patients flagged with abnormal lab results recently, most affected first.",
      sql: `SELECT
  p.id,
  p.name,
  p.phone,
  COUNT(*) AS abnormal_count,
  ARRAY_AGG(DISTINCT l.test_name) AS test_types
FROM patients p
JOIN lab_results l ON l.patient_id = p.id
WHERE l.is_abnormal = TRUE
  AND l.result_date >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.phone
ORDER BY abnormal_count DESC
LIMIT 50;`,
    },
    {
      title: "Doctor weekly appointment load",
      dialect: "MySQL", difficulty: "Intermediate",
      description: "Appointment volume per doctor for the coming week, grouped by type.",
      sql: `SELECT
  d.name AS doctor_name,
  d.department,
  a.type AS appointment_type,
  COUNT(*) AS appointment_count
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.scheduled_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND a.status = 'scheduled'
GROUP BY d.name, d.department, a.type
ORDER BY d.name, appointment_count DESC;`,
    },
    {
      title: "Prescriptions due for refill",
      dialect: "SQLite", difficulty: "Beginner",
      description: "Prescriptions where the last refill was 25+ days ago and a refill is due within 14 days.",
      sql: `SELECT
  p.id,
  pt.name AS patient_name,
  p.medication,
  p.dosage,
  p.issued_at,
  p.refill_at
FROM prescriptions p
JOIN patients pt ON pt.id = p.patient_id
WHERE p.refill_at <= DATE('now', '+14 days')
  AND JULIANDAY('now') - JULIANDAY(p.issued_at) > 25
ORDER BY p.refill_at ASC;`,
    },
  ],
  "Finance": [
    {
      title: "Q1 revenue by category with growth",
      dialect: "PostgreSQL", difficulty: "Advanced",
      description: "Monthly revenue per category for Q1 2024 with month-over-month growth percentage.",
      sql: `WITH monthly AS (
  SELECT
    DATE_TRUNC('month', t.created_at) AS month,
    c.name AS category,
    SUM(t.amount) AS revenue
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  WHERE t.created_at BETWEEN '2024-01-01' AND '2024-03-31'
    AND t.type = 'income'
  GROUP BY month, c.name
)
SELECT
  month,
  category,
  revenue,
  LAG(revenue) OVER (PARTITION BY category ORDER BY month) AS prev_month_revenue,
  ROUND(
    (revenue - LAG(revenue) OVER (PARTITION BY category ORDER BY month))
    / NULLIF(LAG(revenue) OVER (PARTITION BY category ORDER BY month), 0) * 100, 1
  ) AS growth_pct
FROM monthly
ORDER BY category, month;`,
    },
    {
      title: "Overdue invoices by client",
      dialect: "MySQL", difficulty: "Beginner",
      description: "Invoices more than 30 days past due, with total outstanding per client.",
      sql: `SELECT
  cl.name AS client_name,
  cl.email,
  COUNT(i.id) AS overdue_count,
  SUM(i.amount_due) AS total_outstanding
FROM invoices i
JOIN clients cl ON cl.id = i.client_id
WHERE i.due_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND i.status != 'paid'
GROUP BY cl.name, cl.email
ORDER BY total_outstanding DESC;`,
    },
    {
      title: "Department budget variance",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "Compare actual spend vs allocated budget for the current fiscal year.",
      sql: `SELECT
  d.name AS department,
  d.budget AS allocated_budget,
  COALESCE(SUM(e.amount), 0) AS actual_spend,
  d.budget - COALESCE(SUM(e.amount), 0) AS variance,
  ROUND(
    COALESCE(SUM(e.amount), 0) / NULLIF(d.budget, 0) * 100, 1
  ) AS pct_used
FROM departments d
LEFT JOIN expenses e
  ON e.department_id = d.id
  AND e.created_at >= DATE_TRUNC('year', NOW())
GROUP BY d.name, d.budget
ORDER BY pct_used DESC;`,
    },
  ],
  "HR & Payroll": [
    {
      title: "Employees overdue for performance review",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "Employees without a review in 6+ months, including manager contact.",
      sql: `SELECT
  e.id,
  e.name,
  e.department,
  m.name AS manager_name,
  MAX(r.review_date) AS last_review_date
FROM employees e
LEFT JOIN performance_reviews r ON r.employee_id = e.id
LEFT JOIN employees m ON m.id = e.manager_id
GROUP BY e.id, e.name, e.department, m.name
HAVING MAX(r.review_date) < NOW() - INTERVAL '6 months'
    OR MAX(r.review_date) IS NULL
ORDER BY e.department, last_review_date ASC NULLS FIRST;`,
    },
    {
      title: "Salary bands by title and department",
      dialect: "MySQL", difficulty: "Beginner",
      description: "Average, min, max salary per role for recently hired employees.",
      sql: `SELECT
  department,
  job_title,
  COUNT(*) AS headcount,
  ROUND(AVG(salary), 2) AS avg_salary,
  MIN(salary) AS min_salary,
  MAX(salary) AS max_salary
FROM employees
WHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
GROUP BY department, job_title
ORDER BY department, avg_salary DESC;`,
    },
    {
      title: "Unused vacation balance report",
      dialect: "PostgreSQL", difficulty: "Beginner",
      description: "Employees with more than 15 unused vacation days remaining.",
      sql: `SELECT
  e.id,
  e.name,
  e.department,
  e.vacation_days_allotted - COALESCE(SUM(
    CASE WHEN lr.status = 'approved' THEN
      lr.end_date - lr.start_date + 1
    ELSE 0 END
  ), 0) AS days_remaining
FROM employees e
LEFT JOIN leave_requests lr ON lr.employee_id = e.id AND lr.leave_type = 'vacation'
GROUP BY e.id, e.name, e.department, e.vacation_days_allotted
HAVING e.vacation_days_allotted - COALESCE(SUM(
    CASE WHEN lr.status = 'approved' THEN
      lr.end_date - lr.start_date + 1
    ELSE 0 END
  ), 0) > 15
ORDER BY days_remaining DESC;`,
    },
  ],
  "SaaS": [
    {
      title: "Daily active users with rolling average",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "DAU for the past 14 days with a 7-day rolling average, by plan tier.",
      sql: `WITH daily AS (
  SELECT
    DATE(used_at) AS day,
    u.plan,
    COUNT(DISTINCT u.id) AS dau
  FROM feature_usage fu
  JOIN users u ON u.id = fu.user_id
  WHERE fu.used_at >= NOW() - INTERVAL '14 days'
  GROUP BY DATE(used_at), u.plan
)
SELECT
  day,
  plan,
  dau,
  ROUND(AVG(dau) OVER (
    PARTITION BY plan ORDER BY day
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 1) AS rolling_7day_avg
FROM daily
ORDER BY plan, day;`,
    },
    {
      title: "Churn risk: inactive but billed",
      dialect: "MySQL", difficulty: "Beginner",
      description: "Active subscribers who haven't logged in for 21+ days.",
      sql: `SELECT
  u.id,
  u.email,
  s.plan,
  s.billing_cycle,
  u.last_login,
  DATEDIFF(CURDATE(), u.last_login) AS days_inactive
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.status = 'active'
  AND u.last_login <= DATE_SUB(CURDATE(), INTERVAL 21 DAY)
ORDER BY days_inactive DESC;`,
    },
    {
      title: "Feature adoption rate",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "Percentage of active users who used each feature at least once in 30 days.",
      sql: `SELECT
  f.name AS feature,
  COUNT(DISTINCT fu.user_id) AS users_who_used_it,
  (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '30 days') AS total_active_users,
  ROUND(
    COUNT(DISTINCT fu.user_id)::numeric /
    (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '30 days') * 100, 1
  ) AS adoption_pct
FROM features f
LEFT JOIN feature_usage fu
  ON fu.feature_id = f.id
  AND fu.used_at >= NOW() - INTERVAL '30 days'
GROUP BY f.name
ORDER BY adoption_pct DESC;`,
    },
  ],
  "Logistics": [
    {
      title: "Shipments delayed more than 3 days",
      dialect: "PostgreSQL", difficulty: "Beginner",
      description: "Late shipments with carrier, route, and customer contact, sorted by delay.",
      sql: `SELECT
  s.id AS shipment_id,
  c.name AS customer_name,
  c.email,
  s.carrier,
  s.origin || ' → ' || s.destination AS route,
  s.expected_delivery,
  s.actual_delivery,
  (s.actual_delivery - s.expected_delivery) AS delay_days
FROM shipments s
JOIN customers c ON c.id = s.customer_id
WHERE s.actual_delivery > s.expected_delivery + INTERVAL '3 days'
ORDER BY delay_days DESC;`,
    },
    {
      title: "Warehouse capacity utilization",
      dialect: "MySQL", difficulty: "Beginner",
      description: "Current stock vs capacity per warehouse, flagging those above 85%.",
      sql: `SELECT
  w.name AS warehouse,
  w.capacity,
  SUM(i.quantity) AS current_stock,
  ROUND(SUM(i.quantity) / w.capacity * 100, 1) AS utilization_pct,
  CASE WHEN SUM(i.quantity) / w.capacity > 0.85 THEN 'HIGH' ELSE 'NORMAL' END AS status
FROM warehouses w
JOIN inventory i ON i.warehouse_id = w.id
GROUP BY w.name, w.capacity
ORDER BY utilization_pct DESC;`,
    },
    {
      title: "Driver on-time delivery rate",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "On-time delivery percentage and average delay per driver for the past month.",
      sql: `SELECT
  dr.name AS driver_name,
  COUNT(*) AS total_deliveries,
  COUNT(*) FILTER (WHERE s.actual_delivery <= s.expected_delivery) AS on_time_count,
  ROUND(
    COUNT(*) FILTER (WHERE s.actual_delivery <= s.expected_delivery)::numeric
    / COUNT(*) * 100, 1
  ) AS on_time_pct,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (s.actual_delivery - s.expected_delivery)) / 60
  ), 1) AS avg_delay_minutes
FROM shipments s
JOIN drivers dr ON dr.id = s.driver_id
WHERE s.actual_delivery >= NOW() - INTERVAL '30 days'
GROUP BY dr.name
ORDER BY on_time_pct DESC;`,
    },
  ],
  "Education": [
    {
      title: "At-risk students this semester",
      dialect: "PostgreSQL", difficulty: "Beginner",
      description: "Students averaging below 60% in any subject, with advisor contact.",
      sql: `SELECT
  s.id,
  s.name,
  c.name AS course,
  ROUND(AVG(g.score), 1) AS avg_score,
  adv.email AS advisor_email
FROM students s
JOIN grades g ON g.student_id = s.id
JOIN courses c ON c.id = g.course_id
LEFT JOIN advisors adv ON adv.id = s.advisor_id
WHERE g.term = 'current'
GROUP BY s.id, s.name, c.name, adv.email
HAVING AVG(g.score) < 60
ORDER BY avg_score ASC;`,
    },
    {
      title: "Course enrollment vs capacity",
      dialect: "MySQL", difficulty: "Beginner",
      description: "Enrollment counts per course this term against room capacity.",
      sql: `SELECT
  c.name AS course_name,
  i.name AS instructor,
  COUNT(e.student_id) AS enrolled,
  r.capacity AS room_capacity,
  ROUND(COUNT(e.student_id) / r.capacity * 100, 1) AS fill_pct
FROM courses c
JOIN instructors i ON i.id = c.instructor_id
JOIN rooms r ON r.id = c.room_id
LEFT JOIN enrollments e ON e.course_id = c.id AND e.term = 'current'
GROUP BY c.name, i.name, r.capacity
ORDER BY fill_pct DESC;`,
    },
  ],
  "Gaming": [
    {
      title: "Season leaderboard with rank change",
      dialect: "PostgreSQL", difficulty: "Advanced",
      description: "Top 100 players this season with rank movement vs last week.",
      sql: `WITH current_rank AS (
  SELECT
    u.username,
    SUM(sc.points) AS total_points,
    RANK() OVER (ORDER BY SUM(sc.points) DESC) AS rank_now
  FROM scores sc
  JOIN users u ON u.id = sc.user_id
  JOIN seasons se ON se.id = sc.season_id
  WHERE se.is_active = TRUE
  GROUP BY u.username
),
last_week_rank AS (
  SELECT
    u.username,
    RANK() OVER (ORDER BY SUM(sc.points) DESC) AS rank_last_week
  FROM scores sc
  JOIN users u ON u.id = sc.user_id
  WHERE sc.created_at < NOW() - INTERVAL '7 days'
  GROUP BY u.username
)
SELECT
  cr.username,
  cr.total_points,
  cr.rank_now,
  lw.rank_last_week,
  (lw.rank_last_week - cr.rank_now) AS rank_change
FROM current_rank cr
LEFT JOIN last_week_rank lw ON lw.username = cr.username
ORDER BY cr.rank_now
LIMIT 100;`,
    },
    {
      title: "Rarest achievements unlocked",
      dialect: "PostgreSQL", difficulty: "Intermediate",
      description: "10 rarest achievements with unlock rate and average time to unlock.",
      sql: `SELECT
  a.name AS achievement,
  COUNT(ua.user_id) AS unlocked_count,
  (SELECT COUNT(*) FROM users) AS total_users,
  ROUND(COUNT(ua.user_id)::numeric / (SELECT COUNT(*) FROM users) * 100, 2) AS unlock_rate_pct,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (ua.unlocked_at - u.created_at)) / 86400
  ), 1) AS avg_days_to_unlock
FROM achievements a
LEFT JOIN user_achievements ua ON ua.achievement_id = a.id
LEFT JOIN users u ON u.id = ua.user_id
GROUP BY a.name
ORDER BY unlock_rate_pct ASC
LIMIT 10;`,
    },
  ],
  "Banking": [
    {
      title: "Potentially suspicious large transactions",
      dialect: "PostgreSQL", difficulty: "Advanced",
      description: "Transactions over $5,000 compared against a 30-transaction rolling average.",
      sql: `SELECT
  t.id,
  t.account_id,
  t.amount,
  t.created_at,
  ROUND(AVG(t.amount) OVER (
    PARTITION BY t.account_id
    ORDER BY t.created_at
    ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
  ), 2) AS rolling_avg_before,
  ROUND(t.amount / NULLIF(AVG(t.amount) OVER (
    PARTITION BY t.account_id
    ORDER BY t.created_at
    ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
  ), 0), 2) AS deviation_ratio
FROM transactions t
WHERE t.amount > 5000
  AND t.created_at >= NOW() - INTERVAL '7 days'
ORDER BY deviation_ratio DESC NULLS LAST;`,
    },
    {
      title: "Accounts with negative balance trend",
      dialect: "MySQL", difficulty: "Intermediate",
      description: "Accounts whose balance has declined every week for the past month.",
      sql: `SELECT
  account_id,
  GROUP_CONCAT(weekly_balance ORDER BY week_num) AS balance_trend
FROM (
  SELECT
    account_id,
    WEEK(created_at) AS week_num,
    SUM(amount) AS weekly_balance
  FROM transactions
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
  GROUP BY account_id, WEEK(created_at)
) weekly
GROUP BY account_id
HAVING COUNT(*) = 4
ORDER BY account_id;`,
    },
  ],
};

export default function ExamplesPage() {
  const [activeDomain, setActiveDomain] = useState<string>(Object.keys(EXAMPLES)[0]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const domains = Object.keys(EXAMPLES);
  const totalCount = Object.values(EXAMPLES).reduce((s, arr) => s + arr.length, 0);

  const filtered = search.trim()
    ? Object.entries(EXAMPLES).flatMap(([domain, exs]) =>
        exs.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.sql.toLowerCase().includes(search.toLowerCase()))
           .map(e => ({ ...e, domain }))
      )
    : EXAMPLES[activeDomain].map(e => ({ ...e, domain: activeDomain }));

  const copy = (sql: string, idx: number) => {
    navigator.clipboard.writeText(sql).catch(()=>{});
    setCopiedIdx(idx); setTimeout(()=>setCopiedIdx(null), 1600);
    toast.success("Query copied!");
  };

  const sendToOptimizer = (sql: string) => {
    sessionStorage.setItem("prefillSql", sql);
    router.push("/optimizer");
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-violet-400"/> Examples
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{totalCount} queries</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete, production-ready SQL across {domains.length} industry domains — every query is fully written and ready to run
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search examples…"
            className="bg-[#08081a] border border-violet-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-violet-500/40 w-56"/>
        </div>
      </div>

      {!search && (
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {domains.map(d => (
            <button key={d} onClick={() => setActiveDomain(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeDomain === d ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}>
              {d} <span className="text-[9px] opacity-60">({EXAMPLES[d].length})</span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((ex, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-[#08081a] rounded-2xl border border-violet-500/15 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-500/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{ex.title}</h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    ex.difficulty === "Beginner" ? "bg-emerald-500/15 text-emerald-300" :
                    ex.difficulty === "Intermediate" ? "bg-amber-500/15 text-amber-300" :
                    "bg-red-500/15 text-red-300"
                  }`}>{ex.difficulty}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300">{ex.dialect}</span>
                  {search && <span className="text-[9px] text-slate-500">· {ex.domain}</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{ex.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => copy(ex.sql, i)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-300 px-2 py-1.5 rounded-lg hover:bg-violet-500/10 transition-colors">
                  {copiedIdx === i ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                  {copiedIdx === i ? "Copied" : "Copy"}
                </button>
                <button onClick={() => sendToOptimizer(ex.sql)} className="flex items-center gap-1 text-[10px] text-white bg-violet-600 hover:bg-violet-500 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Zap className="w-3 h-3"/> Optimize <ChevronRight className="w-3 h-3"/>
                </button>
              </div>
            </div>
            <pre className="px-5 py-4 text-[11.5px] font-mono text-slate-300 overflow-x-auto leading-7 bg-[#040410]">{ex.sql}</pre>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">No examples match your search.</div>
        )}
      </div>
    </div>
  );
}
