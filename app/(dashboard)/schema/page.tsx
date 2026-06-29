"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const MAX_DDL = 50000;

const EXAMPLE_SCHEMAS: Record<string, { label: string; ddl: string }> = {
  ecommerce: {
    label: "E-Commerce",
    ddl: `-- E-Commerce Schema
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(20),
  country    VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  slug      VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  stock_qty   INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) NOT NULL,
  status      VARCHAR(50) DEFAULT 'pending',
  total       DECIMAL(10,2),
  discount    DECIMAL(10,2) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER REFERENCES orders(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  qty        INTEGER NOT NULL,
  price      DECIMAL(10,2) NOT NULL
);

CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  rating     SMALLINT CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  },
  hr: {
    label: "HR & Payroll",
    ddl: `-- HR & Payroll Schema
CREATE TABLE departments (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  budget     DECIMAL(12,2),
  manager_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employees (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary        DECIMAL(10,2) NOT NULL,
  hire_date     DATE NOT NULL,
  role          VARCHAR(100),
  is_active     BOOLEAN DEFAULT TRUE,
  manager_id    INTEGER REFERENCES employees(id)
);

CREATE TABLE payroll (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) NOT NULL,
  period      DATE NOT NULL,
  gross       DECIMAL(10,2),
  deductions  DECIMAL(10,2),
  net         DECIMAL(10,2),
  paid_at     TIMESTAMP
);

CREATE TABLE performance_reviews (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) NOT NULL,
  reviewer_id INTEGER REFERENCES employees(id),
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes       TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);`,
  },
  education: {
    label: "Education",
    ddl: `-- Education Schema
CREATE TABLE instructors (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100),
  hire_date  DATE
);

CREATE TABLE courses (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  credits       SMALLINT DEFAULT 3,
  instructor_id INTEGER REFERENCES instructors(id),
  max_capacity  INTEGER DEFAULT 30
);

CREATE TABLE students (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  dob        DATE,
  gpa        DECIMAL(3,2),
  enrolled_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enrollments (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) NOT NULL,
  course_id  INTEGER REFERENCES courses(id) NOT NULL,
  term       VARCHAR(20),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id, term)
);

CREATE TABLE grades (
  id            SERIAL PRIMARY KEY,
  student_id    INTEGER REFERENCES students(id) NOT NULL,
  course_id     INTEGER REFERENCES courses(id) NOT NULL,
  assignment    VARCHAR(255),
  score         DECIMAL(5,2),
  max_score     DECIMAL(5,2) DEFAULT 100,
  graded_at     TIMESTAMP DEFAULT NOW()
);`,
  },
};

type Column = { name: string; type: string; isPrimary: boolean; isForeign: boolean; notNull: boolean; ref?: string };
type Table = { name: string; columns: Column[]; x: number; y: number };

function parseDDL(ddl: string): Table[] {
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([^;]+)\)/gi;
  const tables: Table[] = [];
  let tIdx = 0;

  let match;
  while ((match = tableRegex.exec(ddl)) !== null) {
    const name = match[1];
    const body = match[2];
    const columns: Column[] = [];

    const lines = body.split(",").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(PRIMARY\s+KEY|UNIQUE|CHECK|INDEX|CONSTRAINT)/i.test(line)) continue;
      const colMatch = line.match(/^["'`]?(\w+)["'`]?\s+(\w+(?:\([^)]*\))?)(.*)/i);
      if (!colMatch) continue;
      const [, colName, colType, rest] = colMatch;
      const restU = rest.toUpperCase();
      const isPrimary = restU.includes("PRIMARY KEY");
      const isForeign = /REFERENCES\s+(\w+)/i.test(line);
      const ref = (line.match(/REFERENCES\s+(\w+)/i) || [])[1];
      columns.push({
        name: colName,
        type: colType.toUpperCase(),
        isPrimary,
        isForeign,
        notNull: restU.includes("NOT NULL") || isPrimary,
        ref,
      });
    }

    const cols = Math.max(tables.length % 3, 0);
    const row = Math.floor(tIdx / 3);
    tables.push({ name, columns, x: 40 + cols * 300, y: 40 + row * 320 });
    tIdx++;
  }
  return tables;
}

function ERDiagram({ tables }: { tables: Table[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgW = Math.max(tables.reduce((m, t) => Math.max(m, t.x + 280), 600), 900);
  const svgH = Math.max(tables.reduce((m, t) => Math.max(m, t.y + 30 + t.columns.length * 28 + 20), 400), 500);

  const relationships: { from: Table; fromCol: Column; to: Table }[] = [];
  for (const t of tables) {
    for (const c of t.columns) {
      if (c.isForeign && c.ref) {
        const target = tables.find(tt => tt.name.toLowerCase() === c.ref!.toLowerCase());
        if (target) relationships.push({ from: t, fromCol: c, to: target });
      }
    }
  }

  const TABLE_W = 260;
  const ROW_H = 28;
  const HEADER_H = 38;

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, background: "rgba(10,0,20,0.8)", border: "1px solid rgba(45,15,78,0.4)" }}
      onWheel={e => setScale(s => Math.max(0.3, Math.min(2.5, s - e.deltaY * 0.001)))}
      onMouseDown={e => { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); }}
      onMouseMove={e => { if (dragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}>
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 10 }}>
        {[["−", () => setScale(s => Math.max(0.3, s - 0.2))], ["+", () => setScale(s => Math.min(2.5, s + 0.2))], ["⟲", () => { setScale(1); setOffset({ x: 0, y: 0 }); }]].map(([label, fn]) => (
          <button key={String(label)} onClick={fn as () => void} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(45,15,78,0.6)", border: "1px solid rgba(124,58,237,0.3)", color: "#c084fc", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>{String(label)}</button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#4a3d5c", position: "absolute", bottom: 10, left: 12 }}>Scroll to zoom · Drag to pan · {(scale * 100).toFixed(0)}%</div>
      <svg ref={svgRef} width="100%" height={500} viewBox={`0 0 ${svgW} ${svgH}`} style={{ cursor: dragging ? "grabbing" : "grab" }}>
        <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
          {/* Relationship lines */}
          {relationships.map(({ from, fromCol, to }, i) => {
            const fx = from.x + TABLE_W;
            const fy = from.y + HEADER_H + from.columns.indexOf(fromCol) * ROW_H + ROW_H / 2;
            const tx = to.x;
            const ty = to.y + HEADER_H / 2;
            const mx = (fx + tx) / 2;
            return (
              <g key={i}>
                <path d={`M ${fx} ${fy} C ${mx} ${fy} ${mx} ${ty} ${tx} ${ty}`}
                  fill="none" stroke="rgba(124,58,237,0.5)" strokeWidth={1.5} strokeDasharray="5,3" />
                <circle cx={tx} cy={ty} r={3} fill="#7c3aed" />
              </g>
            );
          })}

          {/* Tables */}
          {tables.map((table) => {
            const tableH = HEADER_H + table.columns.length * ROW_H + 10;
            return (
              <g key={table.name} transform={`translate(${table.x},${table.y})`}>
                <rect width={TABLE_W} height={tableH} rx={10} fill="rgba(26,0,51,0.95)" stroke="rgba(124,58,237,0.4)" strokeWidth={1.5} />
                <rect width={TABLE_W} height={HEADER_H} rx={10} fill="rgba(124,58,237,0.25)" />
                <rect y={HEADER_H - 10} width={TABLE_W} height={10} fill="rgba(124,58,237,0.25)" />
                <text x={12} y={24} fontSize={14} fontWeight={700} fill="#e2d9f3" fontFamily="monospace">{table.name}</text>
                <text x={TABLE_W - 12} y={24} fontSize={10} fill="#7c6f94" textAnchor="end">{table.columns.length} cols</text>
                {table.columns.map((col, ci) => (
                  <g key={col.name} transform={`translate(0,${HEADER_H + ci * ROW_H})`}>
                    {ci % 2 === 0 && <rect width={TABLE_W} height={ROW_H} fill="rgba(255,255,255,0.02)" />}
                    <text x={10} y={19} fontSize={11} fill={col.isPrimary ? "#f59e0b" : col.isForeign ? "#c084fc" : "#b8a9cc"} fontFamily="monospace">
                      {col.isPrimary ? "🔑" : col.isForeign ? "🔗" : "  "} {col.name}
                    </text>
                    <text x={TABLE_W - 10} y={19} fontSize={10} fill="#4a3d5c" textAnchor="end" fontFamily="monospace">{col.type}</text>
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default function SchemaPage() {
  const [ddl, setDdl] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [tab, setTab] = useState<"er" | "tables">("er");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const charUsed = ddl.length;
  const charPct = Math.round((charUsed / MAX_DDL) * 100);

  useEffect(() => {
    const saved = localStorage.getItem("sqo_schema_ddl");
    if (saved) { setDdl(saved); setTables(parseDDL(saved)); }
  }, []);

  const handleDDL = (val: string) => {
    setDdl(val);
    const parsed = parseDDL(val);
    setTables(parsed);
    localStorage.setItem("sqo_schema_ddl", val);
  };

  const saveSchema = async () => {
    setLoading(true);
    try {
      const parsed = parseDDL(ddl);
      await fetch("/api/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ddl, name: "My Schema",
          tableCount: parsed.length,
          colCount: parsed.reduce((s, t) => s + t.columns.length, 0),
          relCount: parsed.reduce((s, t) => s + t.columns.filter(c => c.isForeign).length, 0),
        }),
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const totalCols = tables.reduce((s, t) => s + t.columns.length, 0);
  const totalRels = tables.reduce((s, t) => s + t.columns.filter(c => c.isForeign).length, 0);

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>Schema Vault</h1>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(124,58,237,0.2)", color: "#c084fc", fontWeight: 700 }}>NEW</span>
          </div>
          <p style={{ color: "#7c6f94", fontSize: 14 }}>Upload Data Definition Language (DDL) → get a visual Entity-Relationship (ER) diagram · Schema is injected into Natural Language to SQL for accurate generation</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/nl2sql" style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            → Use in NL to SQL
          </Link>
          <button onClick={() => { setDdl(""); setTables([]); localStorage.removeItem("sqo_schema_ddl"); }} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, cursor: "pointer" }}>
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {tables.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "🗂️", label: "Tables", value: tables.length, color: "#7c3aed" },
            { icon: "📋", label: "Columns", value: totalCols, color: "#06b6d4" },
            { icon: "🔗", label: "Relationships", value: totalRels, color: "#10b981" },
            { icon: "📝", label: "Characters Used", value: `${charUsed.toLocaleString()} / ${MAX_DDL.toLocaleString()}`, color: charPct > 80 ? "#ef4444" : "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                {s.label === "Characters Used" && (
                  <div style={{ width: 50, height: 4, background: "rgba(45,15,78,0.5)", borderRadius: 2 }}>
                    <div style={{ width: `${charPct}%`, height: "100%", background: s.color, borderRadius: 2 }} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#7c6f94" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Saved banner */}
      {saved && (
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#10b981" }}>
          ✓ Schema context saved — NL to SQL will use your exact table and column names
          <Link href="/nl2sql" style={{ marginLeft: "auto", color: "#10b981", fontSize: 12 }}>Open NL to SQL →</Link>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20 }}>
        {/* LEFT — DDL Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Example Schemas */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 2, marginBottom: 10 }}>LOAD EXAMPLE SCHEMA</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(EXAMPLE_SCHEMAS).map(([key, { label }]) => (
                <button key={key} onClick={() => handleDDL(EXAMPLE_SCHEMAS[key].ddl)} style={{
                  padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(124,58,237,0.3)",
                  background: "rgba(124,58,237,0.1)", color: "#c084fc", cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* DDL textarea */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 2 }}>Data Definition Language (DDL) EDITOR</span>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ fontSize: 11, color: "#7c6f94", cursor: "pointer" }}>
                  <input type="file" accept=".sql,.txt" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => handleDDL(String(ev.target?.result || "")); r.readAsText(f); } }} />
                  ⬆ Upload
                </label>
                <button onClick={saveSchema} disabled={loading || !ddl.trim()} style={{ fontSize: 11, color: "#10b981", background: "none", border: "none", cursor: "pointer" }}>
                  {loading ? "Saving..." : saved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>
            <textarea value={ddl} onChange={e => handleDDL(e.target.value)}
              placeholder={`Paste CREATE TABLE statements here...\n\nExample:\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);`}
              style={{ width: "100%", minHeight: 420, background: "transparent", border: "none", outline: "none", color: "#e2d9f3", fontSize: 12, fontFamily: "monospace", padding: 16, resize: "vertical", lineHeight: 1.7 }} />
            {charUsed > 0 && (
              <div style={{ padding: "6px 14px", borderTop: "1px solid rgba(45,15,78,0.3)", fontSize: 11, color: "#7c6f94", display: "flex", justifyContent: "space-between" }}>
                <span>{charUsed.toLocaleString()} / {MAX_DDL.toLocaleString()} characters ({charPct}%)</span>
                {tables.length > 0 && <span style={{ color: "#10b981" }}>✓ {tables.length} tables detected</span>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — ER Diagram / Tables */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Tab selector */}
          <div style={{ display: "flex", gap: 4, background: "rgba(26,0,51,0.4)", padding: 4, borderRadius: 10, width: "fit-content" }}>
            {[["er", "🔷 Entity-Relationship (ER) Diagram"], ["tables", "📋 Tables"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as "er" | "tables")} style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                background: tab === id ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "transparent",
                color: tab === id ? "#fff" : "#7c6f94", fontWeight: tab === id ? 700 : 400, transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>

          {tables.length === 0 ? (
            <div style={{ background: "rgba(26,0,51,0.4)", border: "1px dashed rgba(45,15,78,0.6)", borderRadius: 16, padding: 60, textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗄️</div>
              <h3 style={{ color: "#fff", marginBottom: 8 }}>Paste Data Definition Language (DDL) to visualize</h3>
              <p style={{ color: "#7c6f94", fontSize: 14 }}>Load an example schema or paste your own CREATE TABLE statements</p>
            </div>
          ) : tab === "er" ? (
            <ERDiagram tables={tables} />
          ) : (
            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, overflow: "auto", maxHeight: 600 }}>
              {tables.map(table => (
                <div key={table.name} style={{ borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
                  <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#c084fc", fontFamily: "monospace" }}>{table.name}</span>
                    <span style={{ fontSize: 11, color: "#7c6f94" }}>{table.columns.length} columns</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Column", "Type", "Constraints"].map(h => (
                          <th key={h} style={{ padding: "6px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#7c6f94", letterSpacing: 1, borderBottom: "1px solid rgba(45,15,78,0.3)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((col, i) => (
                        <tr key={col.name} style={{ background: i % 2 === 0 ? "transparent" : "rgba(45,15,78,0.1)" }}>
                          <td style={{ padding: "7px 16px", fontSize: 13, fontFamily: "monospace", color: col.isPrimary ? "#f59e0b" : col.isForeign ? "#c084fc" : "#e2d9f3" }}>
                            {col.isPrimary ? "🔑 " : col.isForeign ? "🔗 " : ""}{col.name}
                          </td>
                          <td style={{ padding: "7px 16px", fontSize: 12, fontFamily: "monospace", color: "#7c6f94" }}>{col.type}</td>
                          <td style={{ padding: "7px 16px", fontSize: 11, color: "#4a3d5c" }}>
                            {[col.isPrimary && "PRIMARY KEY", col.notNull && "NOT NULL", col.isForeign && `FK → ${col.ref}`].filter(Boolean).join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
