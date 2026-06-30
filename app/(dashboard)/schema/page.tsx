"use client";
// app/(dashboard)/schema/page.tsx — FIX #5,#6,#14: code sections, editable, examples
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Upload, X, CheckCircle2, AlertCircle, Edit3, Save,
  ChevronRight, Plus, Trash2, Eye, Code2, Table2, Link2,
  Copy, Check, BookOpen, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const DDL_LIMIT = 50000;

const EXAMPLE_SCHEMAS: Record<string, { name: string; ddl: string; description: string }> = {
  "E-Commerce": {
    name: "E-Commerce Store",
    description: "Products, orders, customers, reviews",
    ddl: `-- E-Commerce Schema
CREATE TABLE customers (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  country    VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  stock_qty   INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status      VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);`,
  },
  "Healthcare": {
    name: "Hospital Management",
    description: "Patients, doctors, appointments, lab results",
    ddl: `-- Healthcare Schema
CREATE TABLE patients (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(50),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE doctors (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  specialty    VARCHAR(100),
  license_no   VARCHAR(50) UNIQUE,
  department   VARCHAR(100)
);

CREATE TABLE appointments (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  doctor_id    INTEGER NOT NULL REFERENCES doctors(id),
  scheduled_at TIMESTAMP NOT NULL,
  type         VARCHAR(100),
  status       VARCHAR(50) DEFAULT 'scheduled',
  notes        TEXT
);

CREATE TABLE lab_results (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  test_name    VARCHAR(255) NOT NULL,
  result_value VARCHAR(100),
  is_abnormal  BOOLEAN DEFAULT FALSE,
  result_date  TIMESTAMP NOT NULL
);

CREATE TABLE prescriptions (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  doctor_id    INTEGER NOT NULL REFERENCES doctors(id),
  medication   VARCHAR(255) NOT NULL,
  dosage       VARCHAR(100),
  issued_at    TIMESTAMP DEFAULT NOW(),
  refill_at    TIMESTAMP
);`,
  },
  "SaaS Platform": {
    name: "SaaS Application",
    description: "Users, subscriptions, features, events",
    ddl: `-- SaaS Platform Schema
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(255),
  plan       VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE subscriptions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  plan            VARCHAR(50) NOT NULL,
  status          VARCHAR(50) DEFAULT 'active',
  billing_cycle   VARCHAR(20) DEFAULT 'monthly',
  current_period_end TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE features (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_premium  BOOLEAN DEFAULT FALSE
);

CREATE TABLE feature_usage (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  feature_id INTEGER NOT NULL REFERENCES features(id),
  used_at    TIMESTAMP DEFAULT NOW(),
  metadata   JSONB DEFAULT '{}'
);

CREATE TABLE audit_events (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  resource   VARCHAR(100),
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);`,
  },
  "HR System": {
    name: "Human Resources",
    description: "Employees, departments, reviews, payroll",
    ddl: `-- HR System Schema
CREATE TABLE departments (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  budget     DECIMAL(15,2),
  manager_id INTEGER
);

CREATE TABLE employees (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  department_id INTEGER REFERENCES departments(id),
  job_title     VARCHAR(100),
  salary        DECIMAL(10,2),
  hire_date     DATE NOT NULL,
  manager_id    INTEGER REFERENCES employees(id)
);

CREATE TABLE performance_reviews (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  reviewer_id INTEGER REFERENCES employees(id),
  review_date DATE NOT NULL,
  rating      VARCHAR(20),
  comments    TEXT
);

CREATE TABLE payroll (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  pay_period  DATE NOT NULL,
  gross_pay   DECIMAL(10,2) NOT NULL,
  deductions  DECIMAL(10,2) DEFAULT 0,
  net_pay     DECIMAL(10,2) NOT NULL
);

CREATE TABLE leave_requests (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  leave_type  VARCHAR(50),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER REFERENCES employees(id)
);`,
  },
};

interface ParsedSchema {
  tables: Array<{
    name: string;
    columns: Array<{ name: string; type: string; constraints: string }>;
  }>;
  relationships: Array<{ from: string; to: string; column: string }>;
}

function parseDDL(ddl: string): ParsedSchema {
  const tables: ParsedSchema["tables"] = [];
  const relationships: ParsedSchema["relationships"] = [];

  const tableBlocks = ddl.match(/CREATE\s+TABLE\s+(\w+)\s*\(([^;]+)\)/gi) ?? [];
  for (const block of tableBlocks) {
    const nameMatch = block.match(/CREATE\s+TABLE\s+(\w+)/i);
    if (!nameMatch) continue;
    const tableName = nameMatch[1];
    const bodyMatch = block.match(/\(([^]*)\)$/);
    if (!bodyMatch) continue;

    const columns: ParsedSchema["tables"][0]["columns"] = [];
    const lines = bodyMatch[1].split(",").map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (/^\s*(PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX)/i.test(line)) continue;
      const fkMatch = line.match(/FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)/i);
      if (fkMatch) { relationships.push({ from: tableName, to: fkMatch[2], column: fkMatch[1] }); continue; }

      const colMatch = line.match(/^(\w+)\s+([A-Z_]+(?:\([^)]*\))?)(.*)/i);
      if (colMatch) {
        const constraints = colMatch[3] ?? "";
        const refMatch = constraints.match(/REFERENCES\s+(\w+)/i);
        if (refMatch) relationships.push({ from: tableName, to: refMatch[1], column: colMatch[1] });
        columns.push({
          name: colMatch[1],
          type: colMatch[2].toUpperCase(),
          constraints: constraints.trim(),
        });
      }
    }
    if (columns.length > 0) tables.push({ name: tableName, columns });
  }
  return { tables, relationships };
}

export default function SchemaVaultPage() {
  const [ddl, setDdl]           = useState("");
  const [editDdl, setEditDdl]   = useState("");
  const [editing, setEditing]   = useState(false);
  const [parsed, setParsed]     = useState<ParsedSchema | null>(null);
  const [view, setView]         = useState<"er"|"tables">("er");
  const [copied, setCopied]     = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const charCount  = ddl.length;
  const charPct    = Math.min(100, (charCount / DDL_LIMIT) * 100);
  const charColor  = charPct > 90 ? "red" : charPct > 70 ? "amber" : "violet";

  const handleLoad = useCallback((src: string) => {
    const trimmed = src.trim();
    if (!trimmed) { toast.error("Paste some DDL first."); return; }
    const schema = parseDDL(trimmed);
    if (schema.tables.length === 0) { toast.error("No tables found — make sure your DDL uses CREATE TABLE syntax."); return; }
    setDdl(trimmed);
    setParsed(schema);
    setEditing(false);
    // Save schema context for NL to SQL
    if (typeof window !== "undefined") sessionStorage.setItem("schemaContext", trimmed);
    // FIX #9: track usage so it surfaces in universal Analytics
    fetch("/api/conversions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature: "schema_upload", success: true,
        metadata: { tableCount: schema.tables.length, relCount: schema.relationships.length },
      }),
    }).catch(() => {});
    toast.success(`Loaded ${schema.tables.length} tables, ${schema.relationships.length} relationships!`);
  }, []);

  const handleClear = () => {
    setDdl(""); setEditDdl(""); setParsed(null); setEditing(false);
    if (typeof window !== "undefined") sessionStorage.removeItem("schemaContext");
    toast.success("Schema cleared.");
  };

  const copyDdl = () => {
    navigator.clipboard.writeText(ddl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
    toast.success("DDL copied!");
  };

  const saveEdit = () => {
    handleLoad(editDdl);
  };

  const totalCols  = parsed?.tables.reduce((s, t) => s + t.columns.length, 0) ?? 0;
  const totalRels  = parsed?.relationships.length ?? 0;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400"/> Schema Vault
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">NEW</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload your{" "}
            <span className="text-emerald-400">Data Definition Language (DDL)</span> → visual{" "}
            <span className="text-emerald-400">Entity-Relationship (ER)</span> diagram ·
            Schema injected into Natural Language to SQL for accurate generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {parsed && (
            <a href="/nl2sql" onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors">
              Use in Natural Language to SQL <ChevronRight className="w-3.5 h-3.5"/>
            </a>
          )}
          {parsed && (
            <button onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 border border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs rounded-xl transition-colors">
              <X className="w-3.5 h-3.5"/> Clear
            </button>
          )}
        </div>
      </div>

      {/* FIX #5: Character usage section at top — always visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Data Definition Language (DDL) Characters", value: `${charCount.toLocaleString()} / ${DDL_LIMIT.toLocaleString()}`, sub: `${charPct.toFixed(1)}% used`, color: charColor, bar: charPct },
          { label: "Tables Detected",    value: parsed?.tables.length ?? 0,   sub: parsed ? "from your DDL" : "load DDL to parse",    color: "emerald" },
          { label: "Relationships Found",value: totalRels,                     sub: parsed ? "Primary Key/Foreign Key (PK/FK) links"  : "load DDL to parse",    color: "sky"     },
        ].map((card, i) => (
          <div key={i} className="bg-[#08081a] rounded-xl border border-violet-500/15 p-4">
            <div className="flex items-start justify-between">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{card.label}</div>
            </div>
            <div className={`text-2xl font-black mt-1 text-${card.color === "violet" ? "violet-300" : card.color === "emerald" ? "emerald-300" : card.color === "sky" ? "sky-300" : "red-300"}`}>
              {card.value}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{card.sub}</div>
            {i === 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  charColor === "red" ? "bg-red-500" : charColor === "amber" ? "bg-amber-500" : "bg-violet-500"
                }`} style={{ width: `${charPct}%` }}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FIX #5: Editable DDL input section */}
      {!parsed ? (
        <div className="space-y-4">
          {/* Example schemas */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Paste your Data Definition Language (DDL)</h2>
            <button onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 border border-violet-500/25 hover:border-violet-500/45 px-3 py-1.5 rounded-lg transition-colors">
              <BookOpen className="w-3.5 h-3.5"/> Load Example Schema
            </button>
          </div>

          <AnimatePresence>
            {showExamples && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2">
                  {Object.entries(EXAMPLE_SCHEMAS).map(([key, schema]) => (
                    <button key={key} onClick={() => { setEditDdl(schema.ddl); setShowExamples(false); handleLoad(schema.ddl); }}
                      className="text-left px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all">
                      <div className="text-xs font-semibold text-emerald-300">{schema.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{schema.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-[#08081a] rounded-2xl border border-violet-500/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/10">
              <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider">DDL Input</span>
              <span className={`text-[10px] font-mono ${charColor === "red" ? "text-red-400" : "text-slate-500"}`}>
                {charCount} / {DDL_LIMIT} chars
              </span>
            </div>
            <textarea
              value={editDdl}
              onChange={e => setEditDdl(e.target.value)}
              placeholder={`Paste your CREATE TABLE statements here…\n\nExample:\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  name VARCHAR(255),\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE TABLE orders (\n  id SERIAL PRIMARY KEY,\n  user_id INTEGER NOT NULL REFERENCES users(id),\n  total DECIMAL(10,2),\n  created_at TIMESTAMP DEFAULT NOW()\n);`}
              className="w-full bg-transparent text-[12px] font-mono text-slate-300 placeholder-slate-700 resize-none p-4 outline-none leading-7"
              style={{ minHeight: 320 }}
              spellCheck={false}
            />
            <div className="flex items-center justify-between px-4 py-3 bg-violet-500/5 border-t border-violet-500/10">
              <div className="text-[10px] text-slate-600">
                Supports PostgreSQL, MySQL, SQLite · Primary Key/Foreign Key (PK/FK) auto-detected
              </div>
              <button onClick={() => handleLoad(editDdl)}
                disabled={!editDdl.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors">
                <Database className="w-3.5 h-3.5"/> Load Schema
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* FIX #5: Editable code section — DDL code shown at top with edit option */}
          <div className="bg-[#06061a] rounded-2xl border border-violet-500/15 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/10">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-violet-400"/>
                <span className="text-xs font-semibold text-slate-300">Your Data Definition Language (DDL)</span>
                <span className="text-[10px] text-slate-500">{charCount.toLocaleString()} chars · {parsed.tables.length} tables</span>
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <>
                    <button onClick={copyDdl}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-300 transition-colors">
                      {copied ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => { setEditDdl(ddl); setEditing(true); }}
                      className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 border border-violet-500/25 hover:border-violet-500/45 px-2.5 py-1 rounded-lg transition-colors">
                      <Edit3 className="w-3 h-3"/> Edit
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(false)} className="text-[10px] text-slate-500 hover:text-white px-2.5 py-1 transition-colors">
                      Cancel
                    </button>
                    <button onClick={saveEdit}
                      className="flex items-center gap-1 text-[10px] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 px-2.5 py-1 rounded-lg transition-colors">
                      <Save className="w-3 h-3"/> Save & Reload
                    </button>
                  </>
                )}
              </div>
            </div>
            {editing ? (
              <textarea
                value={editDdl}
                onChange={e => setEditDdl(e.target.value)}
                className="w-full bg-transparent text-[11px] font-mono text-slate-300 resize-none p-4 outline-none leading-7"
                style={{ minHeight: 240 }}
                spellCheck={false}
              />
            ) : (
              <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto leading-7" style={{ maxHeight: 200 }}>
                {ddl}
              </pre>
            )}
            {!editing && (
              <div className="px-4 py-2 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
                <span className="text-[10px] text-emerald-300">Schema context saved — Natural Language to SQL will use your exact table and column names</span>
                <a href="/nl2sql" className="ml-auto text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  Open Natural Language to SQL <ChevronRight className="w-3 h-3"/>
                </a>
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button onClick={() => setView("er")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                view === "er" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "border-violet-500/15 text-slate-400 hover:text-slate-200"
              }`}>
              <Link2 className="w-3.5 h-3.5"/> Entity-Relationship (ER) Diagram
            </button>
            <button onClick={() => setView("tables")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                view === "tables" ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "border-violet-500/15 text-slate-400 hover:text-slate-200"
              }`}>
              <Table2 className="w-3.5 h-3.5"/> Tables
            </button>
          </div>

          {/* ER Diagram view */}
          {view === "er" && (
            <div className="bg-[#04040f] rounded-2xl border border-violet-500/15 p-6 min-h-96 relative overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {parsed.tables.map((table, ti) => (
                  <div key={table.name} className="rounded-xl border border-violet-500/30 bg-[#0a0a1e] overflow-hidden">
                    <div className="px-3 py-2 bg-violet-500/15 border-b border-violet-500/20">
                      <div className="text-xs font-bold text-violet-300 font-mono">{table.name}</div>
                    </div>
                    <div className="p-1">
                      {table.columns.map((col, ci) => {
                        const isPK  = col.constraints.match(/PRIMARY\s+KEY/i) || col.name === "id";
                        const isFK  = parsed.relationships.some(r => r.from === table.name && r.column === col.name);
                        return (
                          <div key={ci} className="flex items-center justify-between px-2 py-1 rounded hover:bg-violet-500/5 group">
                            <div className="flex items-center gap-1.5">
                              {isPK && <span title="Primary Key (PK)" className="text-yellow-400 text-[9px]">🔑</span>}
                              {isFK && !isPK && <span title="Foreign Key (FK)" className="text-violet-400 text-[9px]">🔗</span>}
                              {!isPK && !isFK && <span className="w-3"/>}
                              <span className={`text-[10px] font-mono ${isPK ? "text-yellow-300" : isFK ? "text-violet-300" : "text-slate-300"}`}>
                                {col.name}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-600 font-mono">
                              {col.type.replace("CHARACTER VARYING","VARCHAR").slice(0,12)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Relationships legend */}
              {parsed.relationships.length > 0 && (
                <div className="mt-4 p-3 bg-violet-500/5 rounded-xl border border-violet-500/10">
                  <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                    Foreign Key (FK) Relationships ({parsed.relationships.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsed.relationships.map((r,i) => (
                      <span key={i} className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <span className="text-violet-300">{r.from}.{r.column}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-emerald-300">{r.to}.id</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tables view */}
          {view === "tables" && (
            <div className="space-y-3">
              {parsed.tables.map(table => (
                <div key={table.name} className="bg-[#06061a] rounded-xl border border-violet-500/15 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/10">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-violet-400"/>
                      <span className="text-sm font-bold text-white font-mono">{table.name}</span>
                      <span className="text-[10px] text-slate-500">{table.columns.length} columns</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-violet-500/8">
                          <th className="text-left px-4 py-2 text-slate-500 font-medium">Column</th>
                          <th className="text-left px-4 py-2 text-slate-500 font-medium">Type</th>
                          <th className="text-left px-4 py-2 text-slate-500 font-medium">Constraints</th>
                          <th className="text-left px-4 py-2 text-slate-500 font-medium">Key</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.columns.map((col, i) => {
                          const isPK  = /PRIMARY\s+KEY/i.test(col.constraints) || (col.name === "id" && i === 0);
                          const isFK  = parsed.relationships.some(r => r.from === table.name && r.column === col.name);
                          return (
                            <tr key={i} className="border-b border-violet-500/5 hover:bg-violet-500/3">
                              <td className="px-4 py-2 font-mono text-slate-200">{col.name}</td>
                              <td className="px-4 py-2 font-mono text-sky-300">{col.type}</td>
                              <td className="px-4 py-2 text-slate-500">{col.constraints || "—"}</td>
                              <td className="px-4 py-2">
                                {isPK && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/15 text-yellow-300 rounded">Primary Key (PK)</span>}
                                {isFK && <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-300 rounded ml-1">Foreign Key (FK)</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
