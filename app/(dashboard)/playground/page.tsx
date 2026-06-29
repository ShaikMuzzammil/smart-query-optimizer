"use client";
import { useState, useEffect } from "react";

const DEMO_DATABASES: Record<string, { label: string; icon: string; schema: string; tables: Record<string, Record<string, string>[]> }> = {
  ecommerce: {
    label: "E-Commerce",
    icon: "🛒",
    schema: `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, country TEXT, joined_at TEXT);
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, category TEXT, stock INTEGER);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total REAL, status TEXT, created_at TEXT);
CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, qty INTEGER, price REAL);`,
    tables: {
      users: [
        { id: "1", name: "Alice Johnson", email: "alice@email.com", country: "US", joined_at: "2024-01-15" },
        { id: "2", name: "Bob Smith", email: "bob@email.com", country: "UK", joined_at: "2024-02-20" },
        { id: "3", name: "Carol White", email: "carol@email.com", country: "US", joined_at: "2024-03-10" },
        { id: "4", name: "Dave Brown", email: "dave@email.com", country: "CA", joined_at: "2024-04-05" },
        { id: "5", name: "Eve Davis", email: "eve@email.com", country: "AU", joined_at: "2024-05-12" },
      ],
      products: [
        { id: "1", name: "Laptop Pro 15", price: "1299.99", category: "Electronics", stock: "42" },
        { id: "2", name: "Wireless Mouse", price: "49.99", category: "Electronics", stock: "150" },
        { id: "3", name: "Standing Desk", price: "449.00", category: "Furniture", stock: "20" },
        { id: "4", name: "Coffee Maker", price: "89.99", category: "Appliances", stock: "75" },
        { id: "5", name: "Headphones XR", price: "199.99", category: "Electronics", stock: "60" },
        { id: "6", name: "Desk Chair", price: "299.00", category: "Furniture", stock: "30" },
      ],
      orders: [
        { id: "1", user_id: "1", total: "1349.98", status: "delivered", created_at: "2024-06-01" },
        { id: "2", user_id: "2", total: "449.00", status: "shipped", created_at: "2024-06-05" },
        { id: "3", user_id: "1", total: "89.99", status: "delivered", created_at: "2024-06-10" },
        { id: "4", user_id: "3", total: "499.98", status: "processing", created_at: "2024-06-15" },
        { id: "5", user_id: "4", total: "299.00", status: "pending", created_at: "2024-06-18" },
      ],
      order_items: [
        { id: "1", order_id: "1", product_id: "1", qty: "1", price: "1299.99" },
        { id: "2", order_id: "1", product_id: "2", qty: "1", price: "49.99" },
        { id: "3", order_id: "2", product_id: "3", qty: "1", price: "449.00" },
        { id: "4", order_id: "3", product_id: "4", qty: "1", price: "89.99" },
        { id: "5", order_id: "4", product_id: "5", qty: "1", price: "199.99" },
        { id: "6", order_id: "4", product_id: "2", qty: "6", price: "49.99" },
      ],
    },
  },
  hr: {
    label: "HR & Payroll",
    icon: "👔",
    schema: `CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT, budget REAL);
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, email TEXT, department_id INTEGER, salary REAL, role TEXT, hire_date TEXT);
CREATE TABLE payroll (id INTEGER PRIMARY KEY, employee_id INTEGER, month TEXT, gross REAL, deductions REAL, net REAL);`,
    tables: {
      departments: [
        { id: "1", name: "Engineering", budget: "500000" },
        { id: "2", name: "Marketing", budget: "200000" },
        { id: "3", name: "Sales", budget: "300000" },
        { id: "4", name: "HR", budget: "150000" },
      ],
      employees: [
        { id: "1", name: "Alice Chen", email: "alice@co.com", department_id: "1", salary: "95000", role: "Senior Engineer", hire_date: "2022-03-01" },
        { id: "2", name: "Bob Kumar", email: "bob@co.com", department_id: "1", salary: "80000", role: "Engineer", hire_date: "2023-01-15" },
        { id: "3", name: "Carol Ross", email: "carol@co.com", department_id: "2", salary: "65000", role: "Marketing Manager", hire_date: "2021-06-10" },
        { id: "4", name: "Dave Lee", email: "dave@co.com", department_id: "3", salary: "70000", role: "Sales Lead", hire_date: "2022-09-20" },
        { id: "5", name: "Eve Park", email: "eve@co.com", department_id: "4", salary: "58000", role: "HR Specialist", hire_date: "2023-04-05" },
      ],
      payroll: [
        { id: "1", employee_id: "1", month: "2024-06", gross: "7916.67", deductions: "1583.33", net: "6333.34" },
        { id: "2", employee_id: "2", month: "2024-06", gross: "6666.67", deductions: "1333.33", net: "5333.34" },
        { id: "3", employee_id: "3", month: "2024-06", gross: "5416.67", deductions: "1083.33", net: "4333.34" },
        { id: "4", employee_id: "4", month: "2024-06", gross: "5833.33", deductions: "1166.67", net: "4666.66" },
      ],
    },
  },
  education: {
    label: "Education",
    icon: "🎓",
    schema: `CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, credits INTEGER, instructor TEXT);
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, email TEXT, gpa REAL, enrolled_at TEXT);
CREATE TABLE enrollments (id INTEGER PRIMARY KEY, student_id INTEGER, course_id INTEGER, term TEXT);
CREATE TABLE grades (id INTEGER PRIMARY KEY, student_id INTEGER, course_id INTEGER, assignment TEXT, score REAL, max_score REAL);`,
    tables: {
      courses: [
        { id: "1", title: "Database Systems", credits: "3", instructor: "Dr. Smith" },
        { id: "2", title: "Algorithms", credits: "4", instructor: "Dr. Jones" },
        { id: "3", title: "Web Development", credits: "3", instructor: "Dr. Brown" },
        { id: "4", title: "Machine Learning", credits: "4", instructor: "Dr. Chen" },
      ],
      students: [
        { id: "1", name: "Alex Rivera", email: "alex@uni.edu", gpa: "3.8", enrolled_at: "2023-09-01" },
        { id: "2", name: "Sam Taylor", email: "sam@uni.edu", gpa: "3.2", enrolled_at: "2023-09-01" },
        { id: "3", name: "Jordan Lee", email: "jordan@uni.edu", gpa: "3.5", enrolled_at: "2022-09-01" },
        { id: "4", name: "Morgan Kim", email: "morgan@uni.edu", gpa: "2.9", enrolled_at: "2024-01-15" },
      ],
      enrollments: [
        { id: "1", student_id: "1", course_id: "1", term: "Fall 2024" },
        { id: "2", student_id: "1", course_id: "2", term: "Fall 2024" },
        { id: "3", student_id: "2", course_id: "1", term: "Fall 2024" },
        { id: "4", student_id: "3", course_id: "4", term: "Fall 2024" },
        { id: "5", student_id: "4", course_id: "3", term: "Fall 2024" },
      ],
      grades: [
        { id: "1", student_id: "1", course_id: "1", assignment: "Midterm", score: "88", max_score: "100" },
        { id: "2", student_id: "1", course_id: "1", assignment: "Final", score: "92", max_score: "100" },
        { id: "3", student_id: "2", course_id: "1", assignment: "Midterm", score: "74", max_score: "100" },
        { id: "4", student_id: "3", course_id: "4", assignment: "Project", score: "95", max_score: "100" },
        { id: "5", student_id: "4", course_id: "3", assignment: "Midterm", score: "61", max_score: "100" },
      ],
    },
  },
};

const SAMPLE_QUERIES: Record<string, { label: string; sql: string }[]> = {
  ecommerce: [
    { label: "Top customers by revenue", sql: `SELECT u.name, u.country, COUNT(o.id) AS orders, SUM(o.total) AS total_revenue
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'delivered'
GROUP BY u.id, u.name, u.country
ORDER BY total_revenue DESC;` },
    { label: "Revenue by category", sql: `SELECT p.category, COUNT(oi.id) AS items_sold, SUM(oi.qty * oi.price) AS revenue
FROM products p
JOIN order_items oi ON oi.product_id = p.id
GROUP BY p.category
ORDER BY revenue DESC;` },
    { label: "Low stock products", sql: `SELECT id, name, category, stock, price
FROM products
WHERE stock < 50
ORDER BY stock ASC;` },
    { label: "Orders by status", sql: `SELECT status, COUNT(*) AS count, SUM(total) AS total_value
FROM orders
GROUP BY status
ORDER BY count DESC;` },
  ],
  hr: [
    { label: "Salary by department", sql: `SELECT d.name, COUNT(e.id) AS headcount, AVG(e.salary) AS avg_salary, SUM(e.salary) AS total_cost
FROM departments d
JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name
ORDER BY total_cost DESC;` },
    { label: "Payroll summary", sql: `SELECT e.name, e.role, p.month, p.gross, p.deductions, p.net
FROM employees e
JOIN payroll p ON p.employee_id = e.id
ORDER BY p.month DESC, p.gross DESC;` },
    { label: "Most recent hires", sql: `SELECT e.name, e.role, d.name AS department, e.salary, e.hire_date
FROM employees e
JOIN departments d ON d.id = e.department_id
ORDER BY e.hire_date DESC
LIMIT 10;` },
  ],
  education: [
    { label: "Average grade per course", sql: `SELECT c.title, c.instructor, COUNT(g.id) AS submissions,
  AVG(g.score / g.max_score * 100) AS avg_pct
FROM courses c
LEFT JOIN grades g ON g.course_id = c.id
GROUP BY c.id, c.title, c.instructor
ORDER BY avg_pct DESC;` },
    { label: "Top students by GPA", sql: `SELECT s.name, s.gpa, COUNT(e.id) AS courses_enrolled
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
GROUP BY s.id, s.name, s.gpa
ORDER BY s.gpa DESC;` },
    { label: "Student grade breakdown", sql: `SELECT s.name, c.title, g.assignment, g.score, g.max_score,
  ROUND(g.score / g.max_score * 100, 1) AS percentage
FROM grades g
JOIN students s ON s.id = g.student_id
JOIN courses c ON c.id = g.course_id
ORDER BY s.name, percentage DESC;` },
  ],
};

type Row = Record<string, string>;

function runQuery(sql: string, db: typeof DEMO_DATABASES["ecommerce"]): { columns: string[]; rows: Row[]; error: string | null } {
  try {
    const normalized = sql.trim().replace(/\s+/g, " ");
    const upperSQL = normalized.toUpperCase();

    if (upperSQL.includes("DROP") || upperSQL.includes("DELETE") || upperSQL.includes("UPDATE") || upperSQL.includes("INSERT") || upperSQL.includes("ALTER") || upperSQL.includes("CREATE")) {
      return { columns: [], rows: [], error: "Only SELECT queries are supported in the Playground (read-only demo database)." };
    }

    // Simple in-memory SQL execution
    // Supports: SELECT ... FROM table [JOIN table ON cond] [WHERE cond] [GROUP BY cols] [ORDER BY cols] [LIMIT n]
    const fromMatch = normalized.match(/FROM\s+(\w+)/i);
    if (!fromMatch) return { columns: [], rows: [], error: "Could not parse FROM clause" };
    const mainTable = fromMatch[1].toLowerCase();

    if (!db.tables[mainTable]) return { columns: [], rows: [], error: `Table '${mainTable}' not found. Available: ${Object.keys(db.tables).join(", ")}` };

    let rows = [...db.tables[mainTable]];

    // Handle JOINs
    const joinRegex = /(?:INNER\s+|LEFT\s+|RIGHT\s+)?JOIN\s+(\w+)\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi;
    let jm;
    while ((jm = joinRegex.exec(normalized)) !== null) {
      const joinTableName = jm[1].toLowerCase();
      const joinTable = db.tables[joinTableName];
      if (!joinTable) continue;
      const [, , leftCol, rightCol] = jm;
      const [, leftColName] = leftCol.split(".");
      const [, rightColName] = rightCol.split(".");
      rows = rows.flatMap(row => {
        const matches = joinTable.filter(jr => jr[rightColName] === row[leftColName] || jr[leftColName] === row[rightColName]);
        return matches.length ? matches.map(jr => ({ ...row, ...jr })) : [row];
      });
    }

    // WHERE
    const whereMatch = normalized.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const cond = whereMatch[1].trim();
      const eqMatch = cond.match(/(\w+)\s*=\s*'([^']+)'/);
      const numEqMatch = cond.match(/(\w+)\s*=\s*(\d+)/);
      const ltMatch = cond.match(/(\w+)\s*<\s*(\d+)/);
      const gtMatch = cond.match(/(\w+)\s*>\s*(\d+)/);
      if (eqMatch) rows = rows.filter(r => String(r[eqMatch[1]]).toLowerCase() === eqMatch[2].toLowerCase());
      else if (numEqMatch) rows = rows.filter(r => r[numEqMatch[1]] === numEqMatch[2]);
      else if (ltMatch) rows = rows.filter(r => parseFloat(r[ltMatch[1]] || "0") < parseFloat(ltMatch[2]));
      else if (gtMatch) rows = rows.filter(r => parseFloat(r[gtMatch[1]] || "0") > parseFloat(gtMatch[2]));
    }

    // GROUP BY + aggregations
    const groupMatch = normalized.match(/GROUP\s+BY\s+([^ORDER^LIMIT]+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (groupMatch) {
      const groupCols = groupMatch[1].split(",").map(c => c.trim().split(".").pop()!.trim());
      const groups: Record<string, Row[]> = {};
      for (const row of rows) {
        const key = groupCols.map(c => row[c] || "").join("|");
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      }
      const selectMatch = normalized.match(/SELECT\s+(.+?)\s+FROM/i);
      rows = Object.entries(groups).map(([, grpRows]) => {
        const result: Row = {};
        for (const col of groupCols) result[col] = grpRows[0][col] || "";
        if (selectMatch) {
          const selectCols = selectMatch[1].split(",");
          for (const sc of selectCols) {
            const cntMatch = sc.trim().match(/COUNT\s*\(\s*[*\w]+\s*\)\s+AS\s+(\w+)/i);
            const sumMatch = sc.trim().match(/SUM\s*\(\s*(\w+)\s*\)\s+AS\s+(\w+)/i);
            const avgMatch = sc.trim().match(/AVG\s*\(\s*(.+?)\s*\)\s+AS\s+(\w+)/i);
            const rndMatch = sc.trim().match(/ROUND\s*\(\s*(.+?),\s*(\d+)\s*\)\s+AS\s+(\w+)/i);
            if (cntMatch) result[cntMatch[1]] = String(grpRows.length);
            else if (sumMatch) result[sumMatch[2]] = String(grpRows.reduce((s, r) => s + parseFloat(r[sumMatch[1]] || "0"), 0).toFixed(2));
            else if (avgMatch) {
              const parts = avgMatch[1].split("/");
              if (parts.length === 2) {
                const avg = grpRows.reduce((s, r) => {
                  const num = parseFloat(r[parts[0].trim()] || "0");
                  const den = parseFloat(r[parts[1].trim().split("*")[0].trim()] || "1");
                  return s + (den ? num / den * 100 : 0);
                }, 0) / grpRows.length;
                result[avgMatch[2]] = avg.toFixed(1);
              } else {
                const col = parts[0].trim().split(".").pop()!;
                result[avgMatch[2]] = (grpRows.reduce((s, r) => s + parseFloat(r[col] || "0"), 0) / grpRows.length).toFixed(2);
              }
            }
            else if (rndMatch) result[rndMatch[3]] = parseFloat(grpRows.reduce((s, r) => s + parseFloat(r[rndMatch[1].split("/")[0].trim()] || "0"), 0) / grpRows.length > 0 ? "1" : "0").toFixed(parseInt(rndMatch[2]));
          }
        }
        return result;
      });
    }

    // ORDER BY
    const orderMatch = normalized.match(/ORDER\s+BY\s+([^LIMIT]+?)(?:\s+LIMIT|$)/i);
    if (orderMatch) {
      const parts = orderMatch[1].trim().split(",")[0].trim().split(/\s+/);
      const col = parts[0].split(".").pop()!;
      const desc = parts[1]?.toUpperCase() === "DESC";
      rows = [...rows].sort((a, b) => {
        const av = parseFloat(a[col] || "0") || 0;
        const bv = parseFloat(b[col] || "0") || 0;
        if (!isNaN(av) && !isNaN(bv)) return desc ? bv - av : av - bv;
        return desc ? String(b[col] || "").localeCompare(String(a[col] || "")) : String(a[col] || "").localeCompare(String(b[col] || ""));
      });
    }

    // LIMIT
    const limitMatch = normalized.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1]));

    // SELECT columns
    const selectMatch = normalized.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    let columns: string[] = [];
    if (selectMatch && selectMatch[1].trim() !== "*") {
      columns = selectMatch[1].split(",").map(c => {
        const aliasMatch = c.trim().match(/AS\s+(\w+)$/i);
        if (aliasMatch) return aliasMatch[1];
        return c.trim().split(".").pop()!.trim().replace(/\s+.*$/, "");
      });
      rows = rows.map(r => {
        const newRow: Row = {};
        for (const col of columns) newRow[col] = r[col] !== undefined ? r[col] : "";
        return newRow;
      });
    } else {
      columns = rows.length ? Object.keys(rows[0]) : [];
    }

    return { columns, rows, error: null };
  } catch (e) {
    return { columns: [], rows: [], error: String(e) };
  }
}

export default function PlaygroundPage() {
  const [dbKey, setDbKey] = useState("ecommerce");
  const [sql, setSql] = useState(SAMPLE_QUERIES["ecommerce"][0].sql);
  const [result, setResult] = useState<{ columns: string[]; rows: Row[]; error: string | null } | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [schemaView, setSchemaView] = useState(false);

  const db = DEMO_DATABASES[dbKey];
  const samples = SAMPLE_QUERIES[dbKey] || [];

  const run = () => {
    if (!sql.trim()) return;
    setRunning(true);
    const t = Date.now();
    setTimeout(() => {
      const res = runQuery(sql, db);
      setResult(res);
      setElapsed(Date.now() - t);
      setRunning(false);
    }, 60);
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>SQL Playground</h1>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.2)", color: "#f59e0b", fontWeight: 700 }}>β</span>
        </div>
        <p style={{ color: "#7c6f94", fontSize: 14 }}>Run SQL queries in-browser against real demo databases — zero setup, instant results</p>
      </div>

      {/* DB Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {Object.entries(DEMO_DATABASES).map(([key, d]) => (
          <button key={key} onClick={() => { setDbKey(key); setSql(SAMPLE_QUERIES[key][0].sql); setResult(null); }} style={{
            padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14,
            background: dbKey === key ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(26,0,51,0.6)",
            color: dbKey === key ? "#fff" : "#9ca3af", fontWeight: dbKey === key ? 700 : 400,
            border: `1px solid ${dbKey === key ? "transparent" : "rgba(45,15,78,0.6)"}`, display: "flex", alignItems: "center", gap: 8,
          }}>
            {d.icon} {d.label}
          </button>
        ))}
        <button onClick={() => setSchemaView(!schemaView)} style={{ marginLeft: "auto", padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(45,15,78,0.6)", background: "transparent", color: "#7c6f94", cursor: "pointer", fontSize: 13 }}>
          {schemaView ? "▲ Hide Schema" : "▼ Show Schema"}
        </button>
      </div>

      {/* Schema view */}
      {schemaView && (
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.6)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 2, marginBottom: 10 }}>DATABASE SCHEMA</div>
          <pre style={{ fontSize: 12, color: "#c3e88d", margin: 0, lineHeight: 1.7 }}>{db.schema}</pre>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Editor + Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* SQL Editor */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 2 }}>SQL EDITOR</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => copy(sql)} style={{ fontSize: 11, color: copied ? "#10b981" : "#7c6f94", background: "none", border: "none", cursor: "pointer" }}>
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
                <button onClick={() => { setSql(""); setResult(null); }} style={{ fontSize: 11, color: "#7c6f94", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
              </div>
            </div>
            <textarea value={sql} onChange={e => setSql(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
              style={{ width: "100%", minHeight: 220, background: "transparent", border: "none", outline: "none", color: "#e2d9f3", fontSize: 13, fontFamily: "monospace", padding: 16, resize: "vertical", lineHeight: 1.7 }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: "1px solid rgba(45,15,78,0.3)", fontSize: 12, color: "#7c6f94" }}>
              <span>{sql.length} chars · {db.label} demo database</span>
              <span>Command+Enter (Mac) / Ctrl+Enter (Windows)</span>
            </div>
          </div>

          <button onClick={run} disabled={running || !sql.trim()} style={{
            padding: "14px", borderRadius: 12, border: "none", cursor: sql.trim() ? "pointer" : "not-allowed",
            background: sql.trim() ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(45,15,78,0.3)",
            color: sql.trim() ? "#fff" : "#7c6f94", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s",
            boxShadow: sql.trim() ? "0 0 20px rgba(124,58,237,0.3)" : "none",
          }}>
            {running ? <><span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Running...</> : "▶ Run Query"}
          </button>

          {/* Results */}
          {result && (
            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
                {result.error ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>⚠ Error</span>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>✓ {result.rows.length} row{result.rows.length !== 1 ? "s" : ""} returned {elapsed !== null ? `in ${elapsed}ms` : ""}</span>
                )}
              </div>
              {result.error ? (
                <div style={{ padding: 16, fontSize: 13, color: "#f87171", lineHeight: 1.6 }}>{result.error}</div>
              ) : result.rows.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#7c6f94", fontSize: 13 }}>No rows returned</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {result.columns.map(col => (
                          <th key={col} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 1, background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(45,15,78,0.4)", whiteSpace: "nowrap" }}>
                            {col.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(45,15,78,0.2)" }}>
                          {result.columns.map(col => (
                            <td key={col} style={{ padding: "8px 14px", fontSize: 13, color: "#e2d9f3", fontFamily: /id$|_id$|count|total|price|salary|score|gpa|revenue/i.test(col) ? "monospace" : "inherit", whiteSpace: "nowrap" }}>
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Sample Queries */}
        <div>
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 2, marginBottom: 14 }}>SAMPLE QUERIES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {samples.map((s, i) => (
                <div key={i} onClick={() => { setSql(s.sql); setResult(null); }}
                  style={{ padding: 12, borderRadius: 8, cursor: "pointer", background: "rgba(45,15,78,0.3)", border: "1px solid rgba(45,15,78,0.5)", transition: "all 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(45,15,78,0.5)"; e.currentTarget.style.background = "rgba(45,15,78,0.3)"; }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#c084fc", marginBottom: 4 }}>{s.label}</div>
                  <pre style={{ fontSize: 10, color: "#7c6f94", margin: 0, overflow: "hidden", maxHeight: 40, lineHeight: 1.4 }}>{s.sql.split("\n")[0]}</pre>
                  <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 4 }}>→ Load query</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "rgba(45,15,78,0.2)", borderRadius: 8, fontSize: 12, color: "#7c6f94", lineHeight: 1.6 }}>
              <strong style={{ color: "#c084fc" }}>Note:</strong> This is an in-browser demo engine. It supports SELECT queries with JOIN, WHERE, GROUP BY, ORDER BY, and LIMIT. No server connection required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
