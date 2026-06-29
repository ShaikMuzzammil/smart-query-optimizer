"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Upload, Edit3, Check, X, Copy, ExternalLink, ChevronDown, ChevronRight, Table, Link2, Key } from "lucide-react";
import Link from "next/link";

const EXAMPLE_SCHEMAS = [
  {
    name: "E-Commerce",
    emoji: "🛒",
    ddl: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  stock_qty INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  qty INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);`,
  },
  {
    name: "Healthcare",
    emoji: "🏥",
    ddl: `CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100),
  license_no VARCHAR(50) UNIQUE
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled'
);

CREATE TABLE lab_tests (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) NOT NULL,
  test_type VARCHAR(100) NOT NULL,
  result VARCHAR(20),
  flagged BOOLEAN DEFAULT FALSE,
  tested_at TIMESTAMP DEFAULT NOW()
);`,
  },
  {
    name: "HR System",
    emoji: "👥",
    ddl: `CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  budget DECIMAL(15,2)
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary DECIMAL(10,2),
  hire_date DATE NOT NULL,
  manager_id INTEGER REFERENCES employees(id)
);

CREATE TABLE performance_reviews (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) NOT NULL,
  reviewer_id INTEGER REFERENCES employees(id),
  score INTEGER CHECK (score BETWEEN 1 AND 10),
  review_date DATE NOT NULL,
  notes TEXT
);`,
  },
];

interface Column {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign: boolean;
  foreignRef?: string;
  notNull: boolean;
}

interface TableInfo {
  name: string;
  columns: Column[];
}

function parseDDL(ddl: string): TableInfo[] {
  const tables: TableInfo[] = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([^;]+)\)/gi;
  let match;
  while ((match = tableRegex.exec(ddl)) !== null) {
    const name = match[1];
    const body = match[2];
    const columns: Column[] = [];
    const lines = body.split(",").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^\s*(PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\s*\(/i.test(line)) continue;
      if (/^\s*FOREIGN\s+KEY/i.test(line)) {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)/i);
        if (fkMatch) {
          const col = columns.find((c) => c.name === fkMatch[1]);
          if (col) { col.isForeign = true; col.foreignRef = fkMatch[2]; }
        }
        continue;
      }
      const colMatch = line.match(/^\s*["'`]?(\w+)["'`]?\s+([A-Z][A-Z0-9\s(),]*?)(?:\s+(.*))?$/i);
      if (!colMatch) continue;
      const colName = colMatch[1].toUpperCase();
      if (["PRIMARY","UNIQUE","CHECK","INDEX","KEY","CONSTRAINT"].includes(colName)) continue;
      const rest = (colMatch[3] ?? "").toUpperCase();
      const typeRaw = colMatch[2].trim().toUpperCase().split(/\s/)[0];
      const isPrimary = rest.includes("PRIMARY KEY") || typeRaw.includes("SERIAL");
      const isForeign = rest.includes("REFERENCES");
      const foreignRef = isForeign ? (rest.match(/REFERENCES\s+["'`]?(\w+)/i)?.[1] ?? undefined) : undefined;
      columns.push({
        name: colMatch[1],
        type: colMatch[2].trim().split(/\s/)[0],
        isPrimary,
        isForeign,
        foreignRef,
        notNull: isPrimary || rest.includes("NOT NULL"),
      });
    }
    tables.push({ name, columns });
  }
  return tables;
}

function ERDiagram({ tables }: { tables: TableInfo[] }) {
  const COLS = Math.max(Math.min(tables.length, 3), 1);
  const W = 220, H_ROW = 28, H_HEADER = 40, GAP_X = 60, GAP_Y = 40;
  const positions: Record<string, { x: number; y: number; h: number }> = {};
  tables.forEach((t, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const h = H_HEADER + t.columns.length * H_ROW + 12;
    positions[t.name] = { x: col * (W + GAP_X) + 20, y: row * (300 + GAP_Y) + 20, h };
  });
  const totalW = COLS * (W + GAP_X) + 20;
  const totalH = Math.ceil(tables.length / COLS) * (300 + GAP_Y) + 40;

  const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
  tables.forEach((t) => {
    t.columns.filter((c) => c.isForeign && c.foreignRef).forEach((c) => {
      const src = positions[t.name];
      const tgt = positions[c.foreignRef!];
      if (!src || !tgt) return;
      const srcIdx = t.columns.findIndex((col) => col.name === c.name);
      connections.push({
        x1: src.x + W,
        y1: src.y + H_HEADER + srcIdx * H_ROW + H_ROW / 2,
        x2: tgt.x,
        y2: tgt.y + H_HEADER / 2,
      });
    });
  });

  return (
    <svg width={totalW} height={totalH} className="w-full" style={{ minHeight: totalH }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" opacity={0.6} />
        </marker>
      </defs>
      {connections.map((c, i) => (
        <path key={i}
          d={`M${c.x1},${c.y1} C${c.x1 + 40},${c.y1} ${c.x2 - 40},${c.y2} ${c.x2},${c.y2}`}
          fill="none" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5,3"
          markerEnd="url(#arrow)" opacity={0.5} />
      ))}
      {tables.map((t) => {
        const p = positions[t.name];
        const h = p.h;
        return (
          <g key={t.name} transform={`translate(${p.x},${p.y})`}>
            <rect x={0} y={0} width={W} height={h} rx={12}
              fill="#0d0d1f" stroke="#4c1d95" strokeWidth={1.5} />
            <rect x={0} y={0} width={W} height={H_HEADER} rx={12}
              fill="#1e1b4b" />
            <rect x={0} y={H_HEADER - 12} width={W} height={12} fill="#1e1b4b" />
            <text x={W / 2} y={H_HEADER / 2 + 5} textAnchor="middle"
              fill="#a78bfa" fontSize={13} fontWeight={700} fontFamily="monospace">
              {t.name}
            </text>
            {t.columns.map((col, ci) => {
              const cy = H_HEADER + ci * H_ROW;
              return (
                <g key={col.name} transform={`translate(0,${cy})`}>
                  <rect x={0} y={0} width={W} height={H_ROW}
                    fill={ci % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent"} />
                  {col.isPrimary && (
                    <text x={10} y={H_ROW / 2 + 4} fontSize={11} fill="#fbbf24">🔑</text>
                  )}
                  {col.isForeign && !col.isPrimary && (
                    <text x={10} y={H_ROW / 2 + 4} fontSize={11} fill="#7c3aed">🔗</text>
                  )}
                  <text x={col.isPrimary || col.isForeign ? 28 : 12} y={H_ROW / 2 + 4}
                    fontSize={11} fill={col.isPrimary ? "#fbbf24" : col.isForeign ? "#a78bfa" : "#94a3b8"}
                    fontFamily="monospace">
                    {col.name}
                  </text>
                  <text x={W - 8} y={H_ROW / 2 + 4} textAnchor="end"
                    fontSize={10} fill="#475569" fontFamily="monospace">
                    {col.type}{col.notNull && !col.isPrimary ? "!" : ""}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function SchemaVaultPage() {
  const [ddl, setDDL] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editDDL, setEditDDL] = useState("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeTab, setActiveTab] = useState<"er" | "tables">("er");
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const MAX_CHARS = 50_000;
  const charCount = ddl.length;
  const remaining = MAX_CHARS - charCount;
  const tokens = Math.round(charCount / 4);

  const loadSchema = useCallback((input: string) => {
    const parsed = parseDDL(input);
    setTables(parsed);
    setDDL(input);
    setSchemaLoaded(parsed.length > 0);
    if (parsed.length > 0) {
      sessionStorage.setItem("smartquery_schema_context", input);
    }
  }, []);

  const handleLoad = () => loadSchema(editMode ? editDDL : ddl);

  const handleEdit = () => {
    setEditDDL(ddl);
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    loadSchema(editDDL);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditDDL("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ddl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setDDL("");
    setTables([]);
    setSchemaLoaded(false);
    sessionStorage.removeItem("smartquery_schema_context");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string ?? "";
      setDDL(text);
      setEditDDL(text);
    };
    reader.readAsText(file);
  };

  const totalCols = tables.reduce((s, t) => s + t.columns.length, 0);
  const totalRels = tables.reduce((s, t) => s + t.columns.filter((c) => c.isForeign).length, 0);

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />Schema Vault
            <span className="text-xs font-normal px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-lg">NEW</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Upload your Data Definition Language (DDL) → get a visual Entity-Relationship (ER) diagram · Schema injected into Natural Language to SQL for accurate generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {schemaLoaded && (
            <Link href="/nl2sql"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all">
              Use in NL to SQL →
            </Link>
          )}
          {ddl && (
            <button onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-500/20 text-red-400 hover:border-red-500/40 rounded-xl text-xs transition-all">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats row (when loaded) */}
      {schemaLoaded && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: <Table className="w-4 h-4" />,   label: "Tables",        value: tables.length, color: "emerald" },
            { icon: <Database className="w-4 h-4" />, label: "Columns",       value: totalCols,     color: "sky"     },
            { icon: <Link2 className="w-4 h-4" />,    label: "Relationships", value: totalRels,     color: "violet"  },
          ].map((s) => (
            <div key={s.label} className={`glass-card rounded-2xl p-4 flex items-center gap-3 border ${
              s.color === "emerald" ? "border-emerald-500/20 text-emerald-400" :
              s.color === "sky"     ? "border-sky-500/20 text-sky-400" :
                                      "border-violet-500/20 text-violet-400"
            }`}>
              {s.icon}
              <div>
                <div className="text-xl font-black">{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schema context banner */}
      {schemaLoaded && (
        <div className="mb-5 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <Check className="w-4 h-4" />
            Schema context saved — Natural Language to SQL will use your exact table and column names
          </div>
          <Link href="/nl2sql" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
            Open NL to SQL <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* LEFT: Input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Char usage meter */}
          <div className="glass-card rounded-2xl p-4 border border-emerald-500/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">DDL Usage</span>
              <span className={`text-xs font-mono ${remaining < 5000 ? "text-amber-400" : "text-slate-400"}`}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
              </span>
            </div>
            <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all"
                style={{ width: `${Math.min((charCount / MAX_CHARS) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>~{tokens.toLocaleString()} tokens</span>
              <span>{remaining.toLocaleString()} chars remaining</span>
            </div>
          </div>

          {/* DDL input or edit mode */}
          <div className="glass-card rounded-2xl p-4 border border-emerald-500/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold">Data Definition Language (DDL)</span>
              <div className="flex items-center gap-2">
                {ddl && !editMode && (
                  <>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-300 transition-colors">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button onClick={handleEdit}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg border border-violet-500/15 hover:border-violet-500/40">
                      <Edit3 className="w-3 h-3" />Edit DDL
                    </button>
                  </>
                )}
                {editMode && (
                  <>
                    <button onClick={handleSaveEdit}
                      className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-lg border border-emerald-500/20">
                      <Check className="w-3 h-3" />Save
                    </button>
                    <button onClick={handleCancelEdit}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg border border-slate-500/15">
                      <X className="w-3 h-3" />Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {editMode ? (
              <textarea
                value={editDDL}
                onChange={(e) => setEditDDL(e.target.value)}
                className="w-full h-72 bg-[#07071a] rounded-xl border border-emerald-500/20 text-xs font-mono text-slate-200 p-3 resize-none focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                placeholder="Edit your DDL here..."
              />
            ) : (
              <textarea
                value={ddl}
                onChange={(e) => { setDDL(e.target.value); setSchemaLoaded(false); }}
                className="w-full h-72 bg-[#07071a] rounded-xl border border-emerald-500/15 text-xs font-mono text-slate-200 p-3 resize-none focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-700 leading-relaxed"
                placeholder={`Paste CREATE TABLE statements here...\n\nExample:\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL\n);`}
              />
            )}

            <div className="flex gap-2 mt-3">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-emerald-300 transition-colors cursor-pointer px-2 py-1.5 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30">
                <Upload className="w-3 h-3" />Upload .sql
                <input type="file" accept=".sql,.txt,.ddl" className="hidden" onChange={handleUpload} />
              </label>
              <button onClick={handleLoad} disabled={!ddl.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
                <Database className="w-3.5 h-3.5" />Load Schema & Generate ER Diagram
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="glass-card rounded-2xl p-4 border border-violet-500/10">
            <div className="text-xs font-bold mb-3 text-slate-400">Load an Example Schema</div>
            <div className="space-y-2">
              {EXAMPLE_SCHEMAS.map((ex) => (
                <button key={ex.name}
                  onClick={() => { setDDL(ex.ddl); setEditDDL(ex.ddl); loadSchema(ex.ddl); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-violet-500/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left group">
                  <span className="text-xl">{ex.emoji}</span>
                  <div>
                    <div className="text-xs font-semibold group-hover:text-white transition-colors">{ex.name}</div>
                    <div className="text-[10px] text-slate-500">{parseDDL(ex.ddl).length} tables · click to load</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: ER diagram / tables */}
        <div className="lg:col-span-3">
          {schemaLoaded ? (
            <div className="glass-card rounded-2xl p-5 border border-emerald-500/15">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setActiveTab("er")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${activeTab === "er" ? "bg-emerald-600 border-emerald-500 text-white" : "border-violet-500/15 text-slate-400 hover:text-white"}`}>
                  🗺️ ER Diagram
                </button>
                <button onClick={() => setActiveTab("tables")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${activeTab === "tables" ? "bg-violet-600 border-violet-500 text-white" : "border-violet-500/15 text-slate-400 hover:text-white"}`}>
                  📋 Tables
                </button>
              </div>

              {activeTab === "er" ? (
                <div className="overflow-auto rounded-xl bg-[#07071a] p-4 border border-emerald-500/10" style={{ minHeight: 320 }}>
                  <ERDiagram tables={tables} />
                  <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">🔑 Primary Key (PK)</span>
                    <span className="flex items-center gap-1">🔗 Foreign Key (FK)</span>
                    <span className="flex items-center gap-1">
                      <span className="w-6 border-t border-dashed border-violet-500 inline-block align-middle" />Relationship
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">! Not Null</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {tables.map((t) => (
                    <div key={t.name} className="glass-card rounded-xl p-4 border border-violet-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="w-4 h-4 text-violet-400" />
                        <span className="font-bold text-sm font-mono text-violet-300">{t.name}</span>
                        <span className="text-[10px] text-slate-600 ml-auto">{t.columns.length} columns</span>
                      </div>
                      <div className="space-y-1">
                        {t.columns.map((col) => (
                          <div key={col.name} className="flex items-center gap-2 py-1 border-b border-violet-500/5 last:border-0">
                            <span className="text-sm w-5 flex-shrink-0">
                              {col.isPrimary ? "🔑" : col.isForeign ? "🔗" : "·"}
                            </span>
                            <span className={`text-xs font-mono flex-1 ${col.isPrimary ? "text-yellow-300" : col.isForeign ? "text-violet-300" : "text-slate-300"}`}>
                              {col.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{col.type}</span>
                            {col.foreignRef && (
                              <span className="text-[9px] text-violet-500">→ {col.foreignRef}</span>
                            )}
                            {col.notNull && !col.isPrimary && (
                              <span className="text-[9px] text-amber-500">NOT NULL</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 border border-emerald-500/10 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <Database className="w-12 h-12 text-emerald-400/30 mb-4" />
              <h3 className="font-bold text-slate-300 mb-2">No Schema Loaded</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
                Paste your CREATE TABLE statements on the left, or load an example schema to see the Entity-Relationship diagram.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Auto FK Detection",    icon: <Link2 className="w-4 h-4" /> },
                  { label: "PK / FK Icons",         icon: <Key className="w-4 h-4" />  },
                  { label: "NL to SQL Injection",   icon: <Database className="w-4 h-4" /> },
                ].map((f) => (
                  <div key={f.label} className="glass-card rounded-xl p-3 border border-emerald-500/10 text-center">
                    <div className="flex justify-center mb-1.5 text-emerald-400">{f.icon}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
