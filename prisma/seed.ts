// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hashedPw = await bcrypt.hash("demo123456", 12);

  const demoUser = await db.user.upsert({
    where: { email: "demo@smartquery.pro" },
    update: {},
    create: { name: "Demo User", email: "demo@smartquery.pro", password: hashedPw },
  });

  console.log(`✅ Demo user ready: ${demoUser.email} / demo123456`);

  const sampleQueries = [
    {
      title: "Top Products by Revenue (N+1)",
      domain: "E-Commerce",
      originalQuery: `SELECT p.id, p.name, p.price,\n  (SELECT SUM(oi.qty * oi.unit_price)\n   FROM order_items oi WHERE oi.product_id = p.id) AS revenue\nFROM products p WHERE p.is_active = 1\nORDER BY revenue DESC;`,
      optimizedQuery: `SELECT p.id, p.name, p.price,\n  COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue\nFROM products p\nLEFT JOIN order_items oi ON oi.product_id = p.id\nWHERE p.is_active = TRUE\nGROUP BY p.id, p.name, p.price\nORDER BY revenue DESC LIMIT 100;`,
      performanceGain: 82,
      issues: [
        { type: "n_plus_one", severity: "critical", description: "Correlated subquery runs once per product row" },
        { type: "missing_index", severity: "high", description: "Missing index on order_items.product_id" },
      ],
      improvements: ["LEFT JOIN + GROUP BY replaces N+1 subquery", "LIMIT 100 added for pagination"],
      indexRecs: ["CREATE INDEX idx_oi_product ON order_items(product_id);"],
      tablesDetected: ["products", "order_items"],
      complexityBefore: "O(n²)", complexityAfter: "O(n log n)", estimatedSpeedup: "5.5× faster",
      explanation: "A correlated subquery ran once per product row. Replacing with a LEFT JOIN + GROUP BY reduces from O(n) independent scans to a single pass.",
    },
    {
      title: "30-Day Patient Readmission",
      domain: "Healthcare",
      originalQuery: `SELECT p.id, p.name, a1.discharge_date,\n  (SELECT MIN(a2.admission_date) FROM admissions a2\n   WHERE a2.patient_id=p.id AND a2.admission_date>a1.discharge_date) AS readmission\nFROM patients p JOIN admissions a1 ON a1.patient_id=p.id;`,
      optimizedQuery: `WITH ranked AS (\n  SELECT patient_id, admission_date, discharge_date,\n    LEAD(admission_date) OVER (PARTITION BY patient_id ORDER BY admission_date) AS next_admission\n  FROM admissions\n)\nSELECT p.id, p.name, r.discharge_date, r.next_admission\nFROM ranked r JOIN patients p ON p.id=r.patient_id;`,
      performanceGain: 89,
      issues: [{ type: "correlated_subquery", severity: "critical", description: "Correlated subquery runs for every admission row" }],
      improvements: ["LEAD() finds next admission in a single sorted scan"],
      indexRecs: ["CREATE INDEX idx_admissions_patient ON admissions(patient_id, admission_date);"],
      tablesDetected: ["patients", "admissions"],
      complexityBefore: "O(n²)", complexityAfter: "O(n log n)", estimatedSpeedup: "6.2× faster",
      explanation: "LEAD() accesses the next row in a partition in O(n). The correlated subquery scanning all previous rows is O(n²).",
    },
    {
      title: "Fraud Detection with Z-Score",
      domain: "Finance",
      originalQuery: `SELECT t.id, t.amount FROM transactions t\nWHERE t.amount > (SELECT AVG(amount)*3 FROM transactions t2 WHERE t2.account_id=t.account_id);`,
      optimizedQuery: `WITH baselines AS (\n  SELECT account_id, AVG(amount) AS avg_amt, STDDEV(amount) AS std_amt\n  FROM transactions GROUP BY account_id\n)\nSELECT t.*, (t.amount-b.avg_amt)/NULLIF(b.std_amt,0) AS z_score\nFROM transactions t LEFT JOIN baselines b ON b.account_id=t.account_id\nWHERE t.amount > b.avg_amt*3;`,
      performanceGain: 76,
      issues: [{ type: "correlated_subquery", severity: "critical", description: "Correlated subquery computes account average per transaction row" }],
      improvements: ["Account baselines computed once in CTE", "Z-score added for statistical fraud signal"],
      indexRecs: ["CREATE INDEX idx_tx_account_date ON transactions(account_id, created_at);"],
      tablesDetected: ["transactions"],
      complexityBefore: "O(n²)", complexityAfter: "O(n)", estimatedSpeedup: "4.1× faster",
      explanation: "Statistical baselines per account computed once. Z-score is more accurate than a simple 3× multiplier.",
    },
  ];

  for (const q of sampleQueries) {
    await db.query.create({ data: { ...q, userId: demoUser.id, queryType: "SELECT" } });
  }

  console.log(`✅ Seeded ${sampleQueries.length} sample queries`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
