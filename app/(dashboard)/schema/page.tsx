"use client";
// app/(dashboard)/schema/page.tsx — Schema Vault with usage stats + editable DDL sections
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Database, Upload, FileUp, Trash2, Save, ChevronRight, Table,
  Key, Link2, Eye, EyeOff, Code2, ArrowRight, CheckCircle2,
  AlertTriangle, Info, Edit3, BarChart3, Zap, FileText,
  Plus, X, RefreshCw, Copy, ChevronDown, ChevronUp,
} from "lucide-react";
import NextLink from "next/link";

// ── Token estimation (rough: 1 token ≈ 4 chars) ──────────────────────────────
const MAX_CONTEXT_CHARS = 32000; // ~8000 tokens — safe NL2SQL context limit
function estimateTokens(text: string) { return Math.ceil(text.length / 4); }
function charPercent(text: string) { return Math.min((text.length / MAX_CONTEXT_CHARS) * 100, 100); }

// ── DDL Parser ────────────────────────────────────────────────────────────────
interface Column { name: string; type: string; nullable: boolean; primary: boolean; unique: boolean; references?: { table: string; column: string } }
interface SchemaTable { name: string; columns: Column[]; primaryKeys: string[] }
interface Schema { tables: SchemaTable[]; relationships: Array<{ from: string; fromCol: string; to: string; toCol: string }> }

function parseDDL(ddl: string): Schema {
  const tables: SchemaTable[] = [];
  const relationships: Schema["relationships"] = [];
  const tableRx = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([^;]+)\)/gim;
  let tMatch;
  while ((tMatch = tableRx.exec(ddl)) !== null) {
    const tableName = tMatch[1].toLowerCase();
    const body = tMatch[2];
    const columns: Column[] = [];
    const primaryKeys: string[] = [];
    const lines = body.split(",").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^\s*PRIMARY\s+KEY\s*\(/i.test(line)) {
        const cols = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i)?.[1]
          .split(",").map(c => c.replace(/["'`]/g, "").trim().toLowerCase()) ?? [];
        primaryKeys.push(...cols); continue;
      }
      const fkRx = /FOREIGN\s+KEY\s*\(["'`]?(\w+)["'`]?\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(["'`]?(\w+)["'`]?\)/i;
      const fkM = line.match(fkRx);
      if (fkM) { relationships.push({ from: tableName, fromCol: fkM[1].toLowerCase(), to: fkM[2].toLowerCase(), toCol: fkM[3].toLowerCase() }); continue; }
      const colRx = /["'`]?(\w+)["'`]?\s+(\w+(?:\s*\([^)]+\))?)(.*)/i;
      const cM = line.match(colRx);
      if (cM && !/(CONSTRAINT|INDEX|KEY|CHECK|UNIQUE)\s/i.test(cM[1])) {
        const colName = cM[1].toLowerCase(), colType = cM[2].toUpperCase(), rest = cM[3].toUpperCase();
        const isPk = /PRIMARY\s+KEY/i.test(rest), isNullable = !/NOT\s+NULL|PRIMARY\s+KEY/i.test(rest), isUnique = /UNIQUE/i.test(rest);
        if (isPk) primaryKeys.push(colName);
        const inlineFk = rest.match(/REFERENCES\s+["'`]?(\w+)["'`]?\s*\(["'`]?(\w+)["'`]?\)/i);
        if (inlineFk) relationships.push({ from: tableName, fromCol: colName, to: inlineFk[1].toLowerCase(), toCol: inlineFk[2].toLowerCase() });
        columns.push({ name: colName, type: colType, nullable: isNullable, primary: isPk, unique: isUnique, references: inlineFk ? { table: inlineFk[1].toLowerCase(), column: inlineFk[2].toLowerCase() } : undefined });
      }
    }
    tables.push({ name: tableName, columns, primaryKeys: [...new Set(primaryKeys)] });
  }
  return { tables, relationships };
}

// ── ER Diagram ────────────────────────────────────────────────────────────────
const CARD_W = 200, CARD_H_BASE = 44, COL_H = 22, GUTTER_X = 80, GUTTER_Y = 60;
function ERDiagram({ schema }: { schema: Schema }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const COLS = Math.max(1, Math.ceil(Math.sqrt(schema.tables.length)));
  const layout = schema.tables.map((t, i) => ({
    table: t, x: (i % COLS) * (CARD_W + GUTTER_X) + 20,
    y: Math.floor(i / COLS) * (CARD_H_BASE + t.columns.length * COL_H + GUTTER_Y) + 20,
    h: CARD_H_BASE + t.columns.length * COL_H,
  }));
  const totalW = COLS * (CARD_W + GUTTER_X) + 20;
  const maxH = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0) + 40;
  return (
    <svg viewBox={`0 0 ${totalW} ${maxH}`} className="w-full h-auto" style={{ minHeight: 300 }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" opacity="0.7" />
        </marker>
      </defs>
      {schema.relationships.map((rel, ri) => {
        const from = layout.find(l => l.table.name === rel.from);
        const to = layout.find(l => l.table.name === rel.to);
        if (!from || !to) return null;
        const fromColIdx = from.table.columns.findIndex(c => c.name === rel.fromCol);
        const toColIdx = to.table.columns.findIndex(c => c.name === rel.toCol);
        const x1 = from.x + CARD_W, y1 = from.y + CARD_H_BASE + (fromColIdx + 0.5) * COL_H;
        const x2 = to.x, y2 = to.y + CARD_H_BASE + (toColIdx + 0.5) * COL_H;
        const mx = (x1 + x2) / 2;
        return (
          <path key={ri} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
            stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.6" markerEnd="url(#arrow)" />
        );
      })}
      {layout.map(({ table, x, y, h }) => {
        const isHov = hovered === table.name;
        return (
          <g key={table.name} onMouseEnter={() => setHovered(table.name)} onMouseLeave={() => setHovered(null)}>
            <rect x={x} y={y} width={CARD_W} height={h} rx="8" fill={isHov ? "#1a0a35" : "#0d0a20"} stroke={isHov ? "#7c3aed" : "#2a1a55"} strokeWidth={isHov ? 2 : 1} />
            <rect x={x} y={y} width={CARD_W} height={CARD_H_BASE} rx="8" fill="#1e0f3f" />
            <rect x={x} y={y + CARD_H_BASE - 8} width={CARD_W} height={8} fill="#1e0f3f" />
            <text x={x + 12} y={y + 28} fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#c4b5fd">{table.name}</text>
            {table.columns.map((col, ci) => {
              const isPk = table.primaryKeys.includes(col.name);
              const isFK = !!col.references;
              return (
                <g key={col.name}>
                  <rect x={x} y={y + CARD_H_BASE + ci * COL_H} width={CARD_W} height={COL_H} fill={ci % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"} />
                  <text x={x + 10} y={y + CARD_H_BASE + ci * COL_H + 15} fontSize="9" fontFamily="monospace" fill={isPk ? "#fbbf24" : isFK ? "#38bdf8" : "#94a3b8"}>
                    {isPk ? "🔑 " : isFK ? "🔗 " : "   "}{col.name}
                  </text>
                  <text x={x + CARD_W - 10} y={y + CARD_H_BASE + ci * COL_H + 15} fontSize="8" fontFamily="monospace" fill="#4a3a6a" textAnchor="end">
                    {col.type.replace(/\(.*\)/, "")}
                    {!col.nullable && "!"}
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

const SAMPLE_DDL = `-- E-Commerce Schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  stock_qty INTEGER DEFAULT 0
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);`;

export default function SchemaVaultPage() {
  const [ddl, setDdl] = useState("");
  const [schema, setSchema] = useState<Schema | null>(null);
  const [view, setView] = useState<"diagram" | "tables">("diagram");
  const [dragOver, setDragOver] = useState(false);
  const [editingDdl, setEditingDdl] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");
  const [showAllStats, setShowAllStats] = useState(false);

  // Load saved schema on mount
  useEffect(() => {
    const savedDdl = sessionStorage.getItem("sqo_schema_ddl");
    if (savedDdl) { setDdl(savedDdl); try { setSchema(parseDDL(savedDdl)); } catch {} }
  }, []);

  const totalCols = schema ? schema.tables.reduce((s, t) => s + t.columns.length, 0) : 0;
  const charsUsed = ddl.length;
  const charsRemaining = MAX_CONTEXT_CHARS - charsUsed;
  const tokensUsed = estimateTokens(ddl);
  const tokensRemaining = Math.ceil(MAX_CONTEXT_CHARS / 4) - tokensUsed;
  const usagePct = charPercent(ddl);

  const parseDdlInput = useCallback((input: string) => {
    if (!input.trim()) { toast.error("Paste DDL first"); return; }
    try {
      const result = parseDDL(input);
      if (result.tables.length === 0) { toast.error("No CREATE TABLE statements found"); return; }
      setSchema(result);
      const ctx = result.tables.map(t =>
        `TABLE ${t.name}(\n${t.columns.map(c => `  ${c.name} ${c.type}${c.primary ? " PRIMARY KEY" : ""}${c.nullable ? "" : " NOT NULL"}`).join(",\n")}\n)`
      ).join("\n\n");
      sessionStorage.setItem("sqo_schema_context", ctx);
      sessionStorage.setItem("sqo_schema_ddl", input);
      toast.success(`Parsed ${result.tables.length} tables, ${result.relationships.length} relationships`);
      // Track schema upload
      fetch("/api/conversions", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "schema_upload", metadata: { tables: result.tables.length, relationships: result.relationships.length } }) })
        .catch(() => {});
    } catch { toast.error("Failed to parse DDL — check syntax"); }
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!/\.(sql|txt)$/i.test(file.name)) { toast.error("Upload a .sql or .txt file"); return; }
    const r = new FileReader();
    r.onload = () => { const text = String(r.result ?? ""); setDdl(text); parseDdlInput(text); };
    r.readAsText(file);
  }, [parseDdlInput]);

  const clearSchema = () => {
    setDdl(""); setSchema(null); setEditingDdl(false);
    sessionStorage.removeItem("sqo_schema_context");
    sessionStorage.removeItem("sqo_schema_ddl");
    toast.success("Schema cleared");
  };

  const saveEdit = () => {
    setDdl(editBuffer);
    parseDdlInput(editBuffer);
    setEditingDdl(false);
  };

  const copyDdl = () => { navigator.clipboard.writeText(ddl); toast.success("DDL copied!"); };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black">Schema Vault</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">NEW</span>
          </div>
          <p className="text-slate-400 text-sm">Upload your DDL → visual ER diagram · Schema injected into Natural Language to SQL for accurate generation</p>
        </div>
        <div className="flex gap-2">
          {schema && (
            <NextLink href="/nl2sql" className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />Use in NL to SQL
            </NextLink>
          )}
          {schema && (
            <button onClick={clearSchema} className="flex items-center gap-1.5 px-3 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/8 text-xs font-semibold rounded-xl transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Usage Stats Section (always visible if DDL is loaded) ── */}
      {ddl && (
        <div className="mb-5 glass-card rounded-2xl p-5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold">Schema Context Usage</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                usagePct > 80 ? "bg-rose-500/15 text-rose-400" :
                usagePct > 50 ? "bg-amber-500/15 text-amber-400" :
                "bg-emerald-500/15 text-emerald-400"
              }`}>
                {usagePct.toFixed(0)}% used
              </span>
            </div>
            <button onClick={() => setShowAllStats(v => !v)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              {showAllStats ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More</>}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2.5 bg-violet-500/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                usagePct > 80 ? "bg-gradient-to-r from-amber-500 to-rose-500" :
                "bg-gradient-to-r from-violet-600 to-emerald-500"
              }`} style={{ width: `${usagePct}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-500">0</span>
              <span className="text-[10px] text-slate-500">Context limit (≈8K tokens)</span>
            </div>
          </div>

          {/* Key stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Characters Given",    value: charsUsed.toLocaleString(),      color: "text-violet-300", sub: `of ${MAX_CONTEXT_CHARS.toLocaleString()} max` },
              { label: "Characters Remaining", value: Math.max(0, charsRemaining).toLocaleString(), color: charsRemaining < 0 ? "text-rose-300" : "text-emerald-300", sub: charsRemaining < 0 ? "⚠️ Exceeded" : "available" },
              { label: "Est. Tokens Used",    value: tokensUsed.toLocaleString(),     color: "text-sky-300",    sub: "≈1 token per 4 chars" },
              { label: "Tokens Remaining",    value: Math.max(0, tokensRemaining).toLocaleString(), color: tokensRemaining < 0 ? "text-rose-300" : "text-amber-300", sub: "before limit" },
            ].map(s => (
              <div key={s.label} className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3">
                <div className={`text-lg font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                <div className="text-[9px] text-slate-600">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Expanded stats */}
          <AnimatePresence>
            {showAllStats && schema && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="pt-4 mt-4 border-t border-violet-500/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tables Parsed",      value: schema.tables.length },
                    { label: "Total Columns",      value: totalCols },
                    { label: "Relationships",      value: schema.relationships.length },
                    { label: "Avg Cols / Table",   value: schema.tables.length ? Math.round(totalCols / schema.tables.length) : 0 },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-xl font-black font-mono text-violet-200">{s.value}</div>
                      <div className="text-[10px] text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Table breakdown */}
                <div className="mt-4 space-y-1.5">
                  {schema.tables.map(t => (
                    <div key={t.name} className="flex items-center gap-3 py-1">
                      <span className="font-mono text-[11px] text-violet-300 w-36 truncate">{t.name}</span>
                      <div className="flex-1 h-1.5 bg-violet-500/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-violet-600/50" style={{ width: `${Math.min((t.columns.length / 20) * 100, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-16 text-right">{t.columns.length} cols</span>
                      <span className="text-[10px] text-slate-600 w-20 text-right">{estimateTokens(t.name + t.columns.map(c => c.name).join("")).toLocaleString()} tok</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {usagePct > 80 && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300">Schema is large. Consider removing unused tables to stay within the NL to SQL context limit for best results.</p>
            </div>
          )}
        </div>
      )}

      {!schema ? (
        /* ── Input State ── */
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-400 tracking-wider">PASTE YOUR DDL (CREATE TABLE statements)</div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/35 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3 h-3" />Upload .sql file
                    <input type="file" accept=".sql,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
                  </label>
                  <button onClick={() => { setDdl(SAMPLE_DDL); parseDdlInput(SAMPLE_DDL); }} className="px-2.5 py-1.5 text-[11px] font-medium text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/35 rounded-lg transition-colors">
                    Load Sample
                  </button>
                </div>
              </div>

              {/* Live char counter */}
              {ddl && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-violet-500/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${charPercent(ddl) > 80 ? "bg-rose-500" : "bg-violet-500"}`} style={{ width: `${charPercent(ddl)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{ddl.length}/{MAX_CONTEXT_CHARS} chars ({estimateTokens(ddl)} tokens)</span>
                </div>
              )}

              <div className="relative">
                <textarea value={ddl} onChange={e => setDdl(e.target.value)}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
                  placeholder={`Paste your CREATE TABLE statements here...\n\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) NOT NULL UNIQUE,\n  name VARCHAR(100)\n);\n\nCREATE TABLE posts (\n  id SERIAL PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id),\n  title VARCHAR(500) NOT NULL\n);`}
                  className={`w-full min-h-[360px] bg-[#020208] border rounded-xl p-4 text-xs font-mono leading-6 text-slate-200 placeholder:text-slate-600 outline-none resize-y transition-colors ${dragOver ? "border-violet-400 ring-2 ring-violet-500/30" : "border-violet-500/20 focus:border-violet-500/50"}`}
                />
                {dragOver && (
                  <div className="absolute inset-0 bg-violet-950/80 border-2 border-dashed border-violet-400 rounded-xl flex items-center justify-center gap-2 text-violet-200 text-sm font-semibold pointer-events-none">
                    <FileUp className="w-5 h-5" />Drop .sql file here
                  </div>
                )}
              </div>
              <button onClick={() => parseDdlInput(ddl)} disabled={!ddl.trim()}
                className="w-full mt-3 py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                <Database className="w-4 h-4" />Parse Schema & Generate ER Diagram
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold">What is Schema Vault?</h3>
              </div>
              <div className="space-y-3 text-[12px] text-slate-400 leading-relaxed">
                <p>Schema Vault parses your database DDL (CREATE TABLE statements) and gives you:</p>
                <ul className="space-y-2">
                  {[["🗺️","Visual ER diagram with all table relationships"],["🔑","Primary key and foreign key detection"],["📊","Usage stats — tokens given vs remaining"],["✏️","Editable DDL sections after parsing"],["🧠","Schema injection into Natural Language to SQL — no hallucinated columns"],["🔗","One-click bridge to the Natural Language to SQL converter"]].map(([icon, text]) => (
                    <li key={String(text)} className="flex items-start gap-2"><span className="text-base leading-none">{icon}</span><span>{text}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-violet-500/15">
              <div className="text-xs font-bold text-violet-400 tracking-wider mb-3">SUPPORTED DDL SYNTAX</div>
              <div className="space-y-1.5">
                {["CREATE TABLE ... (columns)","PRIMARY KEY constraints","FOREIGN KEY ... REFERENCES","NOT NULL, UNIQUE constraints","PostgreSQL, MySQL, SQLite syntax"].map(s => (
                  <div key={s} className="flex items-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />{s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Schema Display State ── */
        <div className="space-y-4">
          {/* Top-level stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tables", value: schema.tables.length, icon: Table },
              { label: "Columns", value: totalCols, icon: Database },
              { label: "Relationships", value: schema.relationships.length, icon: Link2 },
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-violet-200">{m.value}</div>
                    <div className="text-[10px] text-slate-500">{m.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schema context saved notice */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300">Schema context saved — Natural Language to SQL will use your exact table and column names</p>
            <NextLink href="/nl2sql" className="ml-auto text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 flex-shrink-0">
              Open NL to SQL <ArrowRight className="w-3 h-3" />
            </NextLink>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 glass-card rounded-2xl p-1.5 max-w-xs">
            {(["diagram", "tables"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${view === v ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {v === "diagram" ? "📊 ER Diagram" : "📋 Tables"}
              </button>
            ))}
          </div>

          {view === "diagram" ? (
            <div className="glass-card rounded-2xl p-4 overflow-auto">
              <div className="min-w-[600px]"><ERDiagram schema={schema} /></div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-violet-500/10 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="text-amber-400">🔑</span>Primary Key</span>
                <span className="flex items-center gap-1"><span className="text-sky-400">🔗</span>Foreign Key</span>
                <span className="flex items-center gap-1"><div className="w-8 border-t border-dashed border-violet-400 opacity-50" /><span>Relationship</span></span>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schema.tables.map(table => (
                <div key={table.name} className="glass-card rounded-2xl overflow-hidden">
                  <div className="bg-violet-500/15 px-4 py-3 flex items-center gap-2 border-b border-violet-500/15">
                    <Table className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <span className="text-xs font-bold text-violet-300 font-mono">{table.name}</span>
                    <span className="ml-auto text-[10px] text-slate-500">{table.columns.length} cols</span>
                  </div>
                  <div className="divide-y divide-violet-500/5">
                    {table.columns.map(col => {
                      const isPK = table.primaryKeys.includes(col.name), isFK = !!col.references;
                      return (
                        <div key={col.name} className="flex items-center gap-2 px-4 py-2">
                          <span className="text-[11px]">{isPK ? "🔑" : isFK ? "🔗" : "  "}</span>
                          <span className={`text-[11px] font-mono flex-1 ${isPK ? "text-amber-300" : isFK ? "text-sky-300" : "text-slate-300"}`}>{col.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{col.type.replace(/\(.*\)/, "")}</span>
                          {!col.nullable && <span className="text-[9px] text-rose-500 font-bold">!</span>}
                        </div>
                      );
                    })}
                  </div>
                  {schema.relationships.filter(r => r.from === table.name).length > 0 && (
                    <div className="px-4 py-2 border-t border-violet-500/10 bg-sky-500/3">
                      {schema.relationships.filter(r => r.from === table.name).map(rel => (
                        <div key={rel.fromCol} className="flex items-center gap-1 text-[10px] text-sky-400">
                          <Link2 className="w-2.5 h-2.5" />{rel.fromCol} → {rel.to}.{rel.toCol}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Editable DDL Section */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-500/15 bg-violet-500/5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold">DDL Source</span>
                <span className="text-[10px] text-slate-500">{ddl.length.toLocaleString()} chars · {estimateTokens(ddl).toLocaleString()} tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyDdl} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-white border border-violet-500/20 hover:border-violet-500/35 rounded-lg transition-colors">
                  <Copy className="w-3 h-3" />Copy
                </button>
                {!editingDdl ? (
                  <button onClick={() => { setEditBuffer(ddl); setEditingDdl(true); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/35 rounded-lg transition-colors">
                    <Edit3 className="w-3 h-3" />Edit DDL
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditingDdl(false)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-white border border-slate-600/30 rounded-lg transition-colors">
                      <X className="w-3 h-3" />Cancel
                    </button>
                    <button onClick={saveEdit} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-colors bg-emerald-500/8">
                      <Save className="w-3 h-3" />Save & Re-parse
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              {editingDdl ? (
                <div>
                  {/* Live char counter in edit mode */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-violet-500/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${charPercent(editBuffer) > 80 ? "bg-rose-500" : "bg-violet-500"}`} style={{ width: `${charPercent(editBuffer)}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{editBuffer.length}/{MAX_CONTEXT_CHARS} chars ({estimateTokens(editBuffer)} tokens used)</span>
                  </div>
                  <textarea value={editBuffer} onChange={e => setEditBuffer(e.target.value)}
                    className="w-full min-h-[320px] bg-[#020208] border border-violet-500/30 rounded-xl p-4 text-xs font-mono leading-6 text-slate-200 outline-none resize-y focus:border-violet-500/60 transition-colors"
                    spellCheck={false}
                    placeholder="Edit your DDL here — click Save & Re-parse to update the diagram"
                  />
                  <p className="text-[10px] text-slate-600 mt-2">Editing the DDL and saving will re-parse the schema and update both the ER diagram and the Natural Language to SQL context.</p>
                </div>
              ) : (
                <pre className="text-xs font-mono text-slate-400 leading-6 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{ddl}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
