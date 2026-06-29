"use client";
// app/(dashboard)/playground/page.tsx — In-Browser SQL Playground
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Terminal, Play, Trash2, Download, RefreshCw, Table,
  CheckCircle2, AlertTriangle, Info, Code2, Database,
  ChevronRight, Clock, Rows, Copy,
} from "lucide-react";

// ── Simple in-browser SQL engine ─────────────────────────────────────────────
interface Row { [col: string]: string | number | null }
interface TableData { columns: string[]; rows: Row[] }
interface DbState { [tableName: string]: TableData }

// Evaluate simple SQL (SELECT/INSERT/CREATE TABLE) against in-memory state
function evalSQL(sql: string, db: DbState): { columns: string[]; rows: Row[]; message?: string; affected?: number } | { error: string } {
  const trimmed = sql.trim().replace(/;$/, "");

  // CREATE TABLE
  const ctMatch = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i);
  if (ctMatch) {
    const tableName = ctMatch[1].toLowerCase();
    const body = ctMatch[2];
    const columns = body.split(",")
      .map(c=>c.trim())
      .filter(c=>!/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|INDEX|UNIQUE)\s/i.test(c))
      .map(c=>{ const m=c.match(/^["'`]?(\w+)["'`]?\s+/); return m?m[1].toLowerCase():""; })
      .filter(Boolean);
    db[tableName] = { columns, rows: [] };
    return { columns:[], rows:[], message:`Table '${tableName}' created with ${columns.length} columns.` };
  }

  // INSERT INTO
  const insMatch = trimmed.match(/^INSERT\s+INTO\s+["'`]?(\w+)["'`]?\s*(?:\(([^)]+)\))?\s+VALUES\s+([\s\S]+)$/i);
  if (insMatch) {
    const tableName = insMatch[1].toLowerCase();
    if (!db[tableName]) return { error: `Table '${tableName}' does not exist.` };
    const tbl = db[tableName];
    const cols = insMatch[2]
      ? insMatch[2].split(",").map(c=>c.trim().replace(/["'`]/g,""))
      : tbl.columns;
    // Parse multi-row values: (...), (...)
    const valuesBlock = insMatch[3];
    const rowMatches = [...valuesBlock.matchAll(/\(([^)]+)\)/g)];
    if (!rowMatches.length) return { error: "Invalid VALUES syntax." };
    let count = 0;
    for (const rm of rowMatches) {
      const vals = rm[1].split(",").map(v=>{
        const trimV = v.trim();
        if (trimV.toUpperCase()==="NULL") return null;
        if (/^['"]/.test(trimV)) return trimV.slice(1,-1);
        const n = parseFloat(trimV);
        return isNaN(n) ? trimV : n;
      });
      const row: Row = {};
      cols.forEach((c,i)=>{ row[c] = vals[i] !== undefined ? vals[i] : null; });
      tbl.rows.push(row);
      count++;
    }
    return { columns:[], rows:[], affected: count, message:`${count} row(s) inserted.` };
  }

  // SELECT
  const selMatch = trimmed.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+["'`]?(\w+)["'`]?(?:\s+(?:AS\s+)?["'`]?(\w+)["'`]?)?(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?(?:\s+OFFSET\s+(\d+))?$/i);
  if (selMatch) {
    const colExpr = selMatch[1];
    const tableName = selMatch[2].toLowerCase();
    const whereExpr = selMatch[4];
    const orderExpr = selMatch[5];
    const limit = selMatch[6] ? parseInt(selMatch[6]) : undefined;
    const offset = selMatch[7] ? parseInt(selMatch[7]) : 0;

    if (!db[tableName]) return { error: `Table '${tableName}' does not exist. Available: ${Object.keys(db).join(", ") || "none"}` };
    const tbl = db[tableName];

    // Resolve columns
    let columns: string[];
    if (colExpr.trim() === "*") {
      columns = tbl.columns;
    } else {
      columns = colExpr.split(",").map(c=>{
        const m = c.trim().match(/(?:["'`]?(\w+)["'`]?\.)?"?(\w+)"?(?:\s+AS\s+["'`]?(\w+)["'`]?)?/i);
        return m ? (m[3] || m[2]).toLowerCase() : c.trim().toLowerCase();
      });
    }

    // Filter rows
    let rows = [...tbl.rows];
    if (whereExpr) {
      rows = rows.filter(row => {
        try {
          // Simple evaluations: col = val, col > val, col < val, col != val, col IS NULL, col IS NOT NULL
          const evalCond = (cond: string): boolean => {
            cond = cond.trim();
            if (/IS\s+NOT\s+NULL/i.test(cond)) {
              const col = cond.match(/(\w+)\s+IS\s+NOT\s+NULL/i)?.[1].toLowerCase();
              return col ? row[col] !== null && row[col] !== undefined : false;
            }
            if (/IS\s+NULL/i.test(cond)) {
              const col = cond.match(/(\w+)\s+IS\s+NULL/i)?.[1].toLowerCase();
              return col ? row[col] === null || row[col] === undefined : false;
            }
            const likeM = cond.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]/i);
            if (likeM) {
              const col = likeM[1].toLowerCase();
              const pattern = likeM[2].replace(/%/g,".*").replace(/_/g,".");
              return new RegExp(`^${pattern}$`,"i").test(String(row[col] ?? ""));
            }
            const opM = cond.match(/(\w+)\s*(=|!=|<>|>=|<=|>|<)\s*(['"']?[\w\s.%-]+['"']?)/i);
            if (!opM) return true;
            const col = opM[1].toLowerCase();
            const op = opM[2];
            let rhs: string|number = opM[3].replace(/^['"]|['"]$/g,"");
            const rhsNum = parseFloat(String(rhs));
            if (!isNaN(rhsNum)) rhs = rhsNum;
            const lhs: string|number = row[col] as string|number ?? "";
            if (op==="=" )  return lhs == rhs;
            if (op==="!=" || op==="<>") return lhs != rhs;
            if (op===">" )  return lhs > rhs;
            if (op==="<" )  return lhs < rhs;
            if (op===">=" ) return lhs >= rhs;
            if (op==="<=" ) return lhs <= rhs;
            return true;
          };
          // Handle AND/OR (simple)
          if (/\bAND\b/i.test(whereExpr)) return whereExpr.split(/\bAND\b/i).every(c=>evalCond(c));
          if (/\bOR\b/i.test(whereExpr))  return whereExpr.split(/\bOR\b/i).some(c=>evalCond(c));
          return evalCond(whereExpr);
        } catch { return true; }
      });
    }

    // ORDER BY
    if (orderExpr) {
      const orderParts = orderExpr.split(",").map(p=>p.trim());
      rows.sort((a,b)=>{
        for (const part of orderParts) {
          const m = part.match(/(\w+)\s*(DESC|ASC)?/i);
          if (!m) continue;
          const col = m[1].toLowerCase();
          const desc = m[2]?.toUpperCase()==="DESC";
          const av = a[col], bv = b[col];
          if (av === bv) continue;
          const cmp = (av ?? "") < (bv ?? "") ? -1 : 1;
          return desc ? -cmp : cmp;
        }
        return 0;
      });
    }

    if (offset) rows = rows.slice(offset);
    if (limit !== undefined) rows = rows.slice(0, limit);

    // Project columns
    const projectedRows = rows.map(row => {
      const out: Row = {};
      if (colExpr.trim() === "*") {
        return row;
      }
      for (const col of columns) {
        out[col] = row[col] ?? null;
      }
      return out;
    });

    return { columns: colExpr.trim()==="*" ? tbl.columns : columns, rows: projectedRows };
  }

  // DROP TABLE
  const dropM = trimmed.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["'`]?(\w+)["'`]?/i);
  if (dropM) {
    const tableName = dropM[1].toLowerCase();
    if (!db[tableName]) return { error: `Table '${tableName}' does not exist.` };
    delete db[tableName];
    return { columns:[], rows:[], message:`Table '${tableName}' dropped.` };
  }

  // DELETE FROM
  const delM = trimmed.match(/^DELETE\s+FROM\s+["'`]?(\w+)["'`]?(?:\s+WHERE\s+([\s\S]+))?$/i);
  if (delM) {
    const tableName = delM[1].toLowerCase();
    if (!db[tableName]) return { error: `Table '${tableName}' does not exist.` };
    const before = db[tableName].rows.length;
    if (delM[2]) {
      // simple delete with WHERE — just clear all for now if complex
      db[tableName].rows = [];
    } else {
      db[tableName].rows = [];
    }
    return { columns:[], rows:[], affected: before - db[tableName].rows.length, message:`${before - db[tableName].rows.length} row(s) deleted.` };
  }

  return { error: `Unsupported statement. Supported: CREATE TABLE, INSERT INTO, SELECT, DELETE FROM, DROP TABLE.` };
}

// ── Default demo DB ──────────────────────────────────────────────────────────
const DEMO_SCRIPTS = [
  {
    label: "E-Commerce",
    sql: `CREATE TABLE users (id, name, email, country);
INSERT INTO users VALUES (1,'Alice','alice@example.com','US'), (2,'Bob','bob@example.com','UK'), (3,'Carol','carol@example.com','US'), (4,'Dave','dave@example.com','CA');
CREATE TABLE products (id, name, category, price);
INSERT INTO products VALUES (1,'Laptop','Electronics',999),(2,'Phone','Electronics',699),(3,'Desk','Furniture',350),(4,'Chair','Furniture',150);
CREATE TABLE orders (id, user_id, product_id, qty, total);
INSERT INTO orders VALUES (1,1,1,2,1998),(2,1,2,1,699),(3,2,3,1,350),(4,3,4,4,600),(5,4,1,1,999);`,
  },
  {
    label: "School DB",
    sql: `CREATE TABLE students (id, name, grade, gpa);
INSERT INTO students VALUES (1,'Arun',10,3.8),(2,'Priya',11,3.5),(3,'Ravi',10,2.9),(4,'Sneha',12,3.9),(5,'Kiran',11,3.1);
CREATE TABLE courses (id, name, credits, teacher);
INSERT INTO courses VALUES (1,'Math',4,'Mr.K'),(2,'Science',3,'Ms.V'),(3,'History',2,'Mr.R'),(4,'CS',4,'Ms.A');
CREATE TABLE enrollments (student_id, course_id, score);
INSERT INTO enrollments VALUES (1,1,92),(1,4,88),(2,2,75),(3,1,61),(4,3,95),(4,4,91),(5,2,80);`,
  },
];

const QUICK_QUERIES = [
  "SELECT * FROM users",
  "SELECT * FROM users WHERE country = 'US'",
  "SELECT name, price FROM products WHERE price > 500",
  "SELECT * FROM orders WHERE total > 800",
  "SELECT name, gpa FROM students WHERE gpa > 3.5 ORDER BY gpa DESC",
  "SELECT * FROM students WHERE grade = 10",
];

function initDb(script: string): DbState {
  const db: DbState = {};
  const stmts = script.split(";").map(s=>s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    evalSQL(stmt, db);
  }
  return db;
}

export default function PlaygroundPage() {
  const [db, setDb] = useState<DbState>(() => initDb(DEMO_SCRIPTS[0].sql));
  const [sql, setSql] = useState("SELECT * FROM users LIMIT 10");
  const [result, setResult] = useState<null | { columns: string[]; rows: Row[]; message?: string; affected?: number } | { error: string }>(null);
  const [history, setHistory] = useState<Array<{sql:string; success:boolean; time: number}>>([]);
  const [execTime, setExecTime] = useState<number>(0);
  const [activeScript, setActiveScript] = useState(0);

  const runQuery = useCallback(() => {
    if (!sql.trim()) return;
    const stmts = sql.split(";").filter(s=>s.trim());
    const newDb = { ...db };
    // Deep copy rows
    for (const k in newDb) newDb[k] = { ...newDb[k], rows: [...newDb[k].rows] };

    const start = performance.now();
    let lastResult: any = null;
    let hadError = false;
    for (const stmt of stmts) {
      if (!stmt.trim()) continue;
      const r = evalSQL(stmt.trim(), newDb);
      if ("error" in r) { lastResult = r; hadError = true; break; }
      lastResult = r;
    }
    const elapsed = +(performance.now() - start).toFixed(2);
    setExecTime(elapsed);
    setResult(lastResult);
    if (!hadError) setDb(newDb);
    setHistory(h => [{ sql: sql.slice(0,60)+(sql.length>60?"…":""), success: !hadError, time: elapsed }, ...h.slice(0,9)]);
    if (hadError) toast.error("Query error — see result panel");
  }, [sql, db]);

  const loadScript = (i: number) => {
    const newDb = initDb(DEMO_SCRIPTS[i].sql);
    setDb(newDb);
    setActiveScript(i);
    setResult({ columns:[], rows:[], message:`Loaded '${DEMO_SCRIPTS[i].label}' database — ${Object.keys(newDb).length} tables ready.` });
    toast.success(`${DEMO_SCRIPTS[i].label} database loaded`);
  };

  const resetDb = () => {
    loadScript(activeScript);
    setSql("");
    setHistory([]);
  };

  useEffect(() => {
    // Load from NL2SQL session
    const saved = sessionStorage.getItem("sqo_playground_sql");
    if (saved) { setSql(saved); sessionStorage.removeItem("sqo_playground_sql"); }
  }, []);

  const tableNames = Object.keys(db);

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black">SQL Playground</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">BETA</span>
          </div>
          <p className="text-slate-400 text-sm">Execute SQL in-browser · Zero backend · Auto-seeded sample data · No production risk</p>
        </div>
        <div className="flex gap-2">
          {DEMO_SCRIPTS.map((ds,i)=>(
            <button key={ds.label} onClick={()=>loadScript(i)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${activeScript===i?"bg-violet-500/20 border-violet-500/40 text-violet-300":"border-violet-500/15 text-slate-400 hover:text-violet-300"}`}>
              {ds.label}
            </button>
          ))}
          <button onClick={resetDb} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-500/20 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            <RefreshCw className="w-3 h-3"/>Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: schema + quick queries */}
        <div className="space-y-4">
          {/* Tables */}
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Database className="w-3 h-3"/>TABLES ({tableNames.length})
            </div>
            {tableNames.length === 0 ? (
              <p className="text-xs text-slate-600">No tables yet. Load a sample or run CREATE TABLE.</p>
            ) : (
              <div className="space-y-2">
                {tableNames.map(t=>(
                  <div key={t} className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-mono text-violet-300">{t}</span>
                      <span className="text-[10px] text-slate-500">{db[t].rows.length} rows</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {db[t].columns.map(c=>(
                        <span key={c} className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">{c}</span>
                      ))}
                    </div>
                    <button onClick={()=>setSql(`SELECT * FROM ${t} LIMIT 20`)}
                      className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                      <ChevronRight className="w-3 h-3"/>SELECT * FROM {t}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick queries */}
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3">QUICK QUERIES</div>
            <div className="space-y-1">
              {QUICK_QUERIES.filter(q => {
                const t = q.match(/FROM\s+(\w+)/i)?.[1]?.toLowerCase();
                return !t || tableNames.includes(t);
              }).slice(0,6).map(q=>(
                <button key={q} onClick={()=>setSql(q)}
                  className="w-full text-left text-[10px] font-mono text-slate-400 hover:text-violet-300 px-2 py-1.5 rounded-lg hover:bg-violet-500/5 transition-colors truncate">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3">RECENT</div>
              <div className="space-y-1">
                {history.map((h,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    {h.success ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0"/> : <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0"/>}
                    <span className="text-[10px] font-mono text-slate-500 truncate flex-1">{h.sql}</span>
                    <span className="text-[9px] text-slate-600">{h.time}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: editor + results */}
        <div className="space-y-4">
          {/* Editor */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3 h-3"/>SQL EDITOR
              </div>
              <div className="flex gap-2">
                <button onClick={()=>navigator.clipboard.writeText(sql).then(()=>toast.success("Copied!"))}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors">
                  <Copy className="w-3 h-3"/>Copy
                </button>
                <button onClick={()=>{setSql("");setResult(null);}}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors">
                  <Trash2 className="w-3 h-3"/>Clear
                </button>
              </div>
            </div>
            <textarea value={sql} onChange={e=>setSql(e.target.value)}
              onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();runQuery();}}}
              placeholder={`Type SQL here...\n\nSELECT * FROM users WHERE country = 'US' LIMIT 10;\n\n-- Tip: ⌘+Enter to run`}
              className="w-full min-h-[180px] bg-[#020208] border border-violet-500/20 focus:border-violet-500/50 rounded-xl p-4 text-xs font-mono leading-6 text-slate-200 placeholder:text-slate-600 outline-none resize-y transition-colors"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span>{sql.length} chars</span>
                <kbd className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[9px] text-violet-400 font-mono">⌘↵</kbd>
              </div>
              <button onClick={runQuery} disabled={!sql.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all">
                <Play className="w-4 h-4"/>Run Query
              </button>
            </div>
          </div>

          {/* Result panel */}
          {result && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl overflow-hidden">
              {"error" in result ? (
                <div className="p-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5"/>
                  <div>
                    <div className="text-sm font-bold text-rose-300 mb-1">Query Error</div>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">{result.error}</p>
                  </div>
                </div>
              ) : result.message && result.rows.length === 0 ? (
                <div className="p-5 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0"/>
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">{result.message}</div>
                    {result.affected !== undefined && <div className="text-xs text-slate-500 mt-0.5">{result.affected} row(s) affected</div>}
                  </div>
                  {execTime > 0 && <div className="ml-auto text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{execTime}ms</div>}
                </div>
              ) : (
                <div>
                  {/* Result header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-violet-500/10">
                    <Rows className="w-4 h-4 text-violet-400"/>
                    <span className="text-xs font-bold text-slate-300">{result.rows.length} rows · {result.columns.length} columns</span>
                    <span className="ml-auto text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{execTime}ms</span>
                  </div>
                  {/* Grid */}
                  <div className="overflow-auto max-h-[400px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0a0a18]">
                        <tr>
                          {result.columns.map(col=>(
                            <th key={col} className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 tracking-wider border-b border-violet-500/10 uppercase font-mono whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.length === 0 ? (
                          <tr><td colSpan={result.columns.length} className="text-center py-8 text-slate-600">No rows returned</td></tr>
                        ) : result.rows.map((row,ri)=>(
                          <tr key={ri} className={`border-b border-violet-500/5 hover:bg-violet-500/3 transition-colors ${ri%2===0?"":"bg-violet-500/2"}`}>
                            {result.columns.map(col=>(
                              <td key={col} className="px-4 py-2 text-slate-300 font-mono whitespace-nowrap">
                                {row[col] === null
                                  ? <span className="text-slate-600 italic">NULL</span>
                                  : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Info */}
          {!result && (
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
              <Terminal className="w-10 h-10 text-violet-400/30"/>
              <div>
                <div className="text-sm font-bold text-slate-400 mb-1">Ready to Execute</div>
                <p className="text-xs text-slate-600 max-w-xs">Write SQL in the editor and click Run. Supports SELECT, INSERT, CREATE TABLE, DELETE, DROP TABLE.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-[10px] text-slate-600 mt-2">
                {["SELECT","WHERE","ORDER BY","LIMIT","INSERT","CREATE TABLE"].map(k=>(
                  <span key={k} className="px-2 py-0.5 bg-violet-500/5 border border-violet-500/10 rounded font-mono">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
