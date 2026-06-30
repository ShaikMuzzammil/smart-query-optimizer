"use client";
// app/(dashboard)/playground/page.tsx — FIX #14: full complete queries, copy options
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Terminal, Play, Copy, Check, RefreshCw, Database, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SqlBlock } from "@/components/optimizer/SqlBlock";

const DIALECTS = ["PostgreSQL", "MySQL", "SQLite"];

// FIX #14: Full, complete playground queries (not half-finished)
const PLAYGROUND_QUERIES = [
  {
    name: "Window Function: Running Total",
    dialect: "PostgreSQL",
    sql: `SELECT
  order_date,
  daily_revenue,
  SUM(daily_revenue) OVER (ORDER BY order_date) AS running_total,
  AVG(daily_revenue) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS rolling_7day_avg
FROM (
  SELECT
    DATE(created_at) AS order_date,
    SUM(total_amount) AS daily_revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE(created_at)
) daily
ORDER BY order_date;`,
    mockRows: [
      { order_date: "2024-06-01", daily_revenue: 4250.00, running_total: 4250.00, rolling_7day_avg: 4250.00 },
      { order_date: "2024-06-02", daily_revenue: 3890.50, running_total: 8140.50, rolling_7day_avg: 4070.25 },
      { order_date: "2024-06-03", daily_revenue: 5120.75, running_total: 13261.25, rolling_7day_avg: 4420.42 },
    ],
  },
  {
    name: "Recursive CTE: Org Chart",
    dialect: "PostgreSQL",
    sql: `WITH RECURSIVE org_chart AS (
  SELECT id, name, manager_id, 1 AS depth, name::text AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id, oc.depth + 1, oc.path || ' > ' || e.name
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT id, name, depth, path
FROM org_chart
ORDER BY path;`,
    mockRows: [
      { id: 1, name: "Sarah Chen (CEO)", depth: 1, path: "Sarah Chen (CEO)" },
      { id: 2, name: "James Park (VP Eng)", depth: 2, path: "Sarah Chen (CEO) > James Park (VP Eng)" },
      { id: 5, name: "Priya Nair (Eng Mgr)", depth: 3, path: "Sarah Chen (CEO) > James Park (VP Eng) > Priya Nair (Eng Mgr)" },
    ],
  },
  {
    name: "Pivot with CASE: Sales by Quarter",
    dialect: "MySQL",
    sql: `SELECT
  product_category,
  SUM(CASE WHEN QUARTER(sale_date) = 1 THEN amount ELSE 0 END) AS q1,
  SUM(CASE WHEN QUARTER(sale_date) = 2 THEN amount ELSE 0 END) AS q2,
  SUM(CASE WHEN QUARTER(sale_date) = 3 THEN amount ELSE 0 END) AS q3,
  SUM(CASE WHEN QUARTER(sale_date) = 4 THEN amount ELSE 0 END) AS q4,
  SUM(amount) AS total
FROM sales
WHERE YEAR(sale_date) = 2024
GROUP BY product_category
ORDER BY total DESC
LIMIT 10;`,
    mockRows: [
      { product_category: "Electronics", q1: 45200, q2: 52100, q3: 48900, q4: 61300, total: 207500 },
      { product_category: "Apparel", q1: 28400, q2: 31200, q3: 29800, q4: 42100, total: 131500 },
    ],
  },
  {
    name: "JSON Aggregation",
    dialect: "PostgreSQL",
    sql: `SELECT
  c.id,
  c.name,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'order_id', o.id,
      'amount', o.total_amount,
      'date', o.created_at
    ) ORDER BY o.created_at DESC
  ) AS recent_orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY c.id, c.name
ORDER BY COUNT(o.id) DESC
LIMIT 5;`,
    mockRows: [
      { id: 101, name: "Acme Corp", recent_orders: '[{"order_id":5012,"amount":890.00},{"order_id":4988,"amount":450.50}]' },
    ],
  },
  {
    name: "Self-Join: Find Duplicates",
    dialect: "SQLite",
    sql: `SELECT
  a.id AS id_1,
  b.id AS id_2,
  a.email,
  a.created_at AS first_created,
  b.created_at AS duplicate_created
FROM users a
JOIN users b
  ON a.email = b.email
  AND a.id < b.id
ORDER BY a.email;`,
    mockRows: [
      { id_1: 12, id_2: 87, email: "test@example.com", first_created: "2024-01-15", duplicate_created: "2024-03-22" },
    ],
  },
];

export default function PlaygroundPage() {
  const [selected, setSelected] = useState(PLAYGROUND_QUERIES[0]);
  const [sql, setSql]           = useState(PLAYGROUND_QUERIES[0].sql);
  const [running, setRunning]   = useState(false);
  const [results, setResults]   = useState<Record<string, any>[] | null>(null);
  const [copied, setCopied]     = useState(false);
  const [dialect, setDialect]   = useState("PostgreSQL");

  const handleRun = useCallback(() => {
    setRunning(true);
    setResults(null);
    // FIX #9: track usage so it surfaces in universal Analytics
    fetch("/api/conversions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: "playground_run", success: true, dialect, metadata: { pattern: selected.name } }),
    }).catch(() => {});
    setTimeout(() => {
      setResults(selected.mockRows);
      setRunning(false);
      toast.success(`Query executed — ${selected.mockRows.length} rows returned (simulated)`);
    }, 700);
  }, [selected, dialect]);

  const loadQuery = (q: typeof PLAYGROUND_QUERIES[0]) => {
    setSelected(q); setSql(q.sql); setResults(null); setDialect(q.dialect);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sql).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 1600);
    toast.success("Copied to clipboard!");
  };

  const columns = results?.[0] ? Object.keys(results[0]) : [];

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Terminal className="w-6 h-6 text-amber-400"/> Playground
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">β BETA</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Experiment with advanced SQL patterns in a safe, simulated environment — no database connection required
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Query templates sidebar */}
        <div className="xl:col-span-1">
          <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">Pattern Library</div>
          <div className="space-y-1.5">
            {PLAYGROUND_QUERIES.map((q, i) => (
              <button key={i} onClick={() => loadQuery(q)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                  selected.name === q.name ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-violet-500/15 text-slate-400 hover:border-violet-500/30 hover:text-slate-200"
                }`}>
                <div className="font-medium">{q.name}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{q.dialect}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor + results */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#08081a] rounded-2xl border border-violet-500/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/10">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-500"/>
                <span className="text-xs font-semibold text-slate-300">{selected.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-300 rounded">{dialect}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copySql} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-300 transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                  {copied ? "Copied!" : "Copy SQL"}
                </button>
              </div>
            </div>
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              className="w-full bg-transparent text-[12px] font-mono text-slate-300 resize-none p-4 outline-none leading-7"
              style={{ minHeight: 280 }}
              spellCheck={false}
            />
            <div className="flex items-center justify-between px-4 py-3 bg-violet-500/5 border-t border-violet-500/10">
              <span className="text-[10px] text-slate-600">{sql.split("\n").length} lines · simulated execution</span>
              <button onClick={handleRun} disabled={running}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all">
                {running ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Running…</> : <><Play className="w-3.5 h-3.5"/> Run Query</>}
              </button>
            </div>
          </div>

          {/* Results table */}
          {results && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#06061a] rounded-2xl border border-emerald-500/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/15 bg-emerald-500/5">
                <Check className="w-3.5 h-3.5 text-emerald-400"/>
                <span className="text-[11px] text-emerald-300">{results.length} rows returned (simulated data for demonstration)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-violet-500/10">
                      {columns.map(col => <th key={col} className="text-left px-4 py-2 text-slate-500 font-medium font-mono">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} className="border-b border-violet-500/5 hover:bg-violet-500/3">
                        {columns.map(col => (
                          <td key={col} className="px-4 py-2 font-mono text-slate-300">{String(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {!results && (
            <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0"/>
              <p className="text-[11px] text-slate-400">
                This is a safe simulation environment — query results shown are illustrative sample data, not connected to a live database. Use it to study advanced SQL patterns like window functions, recursive CTEs, and JSON aggregation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
