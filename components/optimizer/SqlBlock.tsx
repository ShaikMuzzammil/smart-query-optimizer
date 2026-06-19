"use client";
// components/optimizer/SqlBlock.tsx
import { useState } from "react";
import { Copy, Check } from "lucide-react";

const KW = new Set("SELECT FROM WHERE JOIN LEFT RIGHT INNER OUTER FULL CROSS ON GROUP BY ORDER HAVING LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE CREATE DROP ALTER INDEX DISTINCT AS AND OR NOT IN EXISTS BETWEEN LIKE IS NULL UNION ALL WITH RECURSIVE CASE WHEN THEN ELSE END PRIMARY KEY FOREIGN REFERENCES DEFAULT TRUE FALSE ASC DESC PARTITION OVER RETURNING USING NULLS INTERVAL CURRENT_DATE TABLE".split(" "));
const FN = new Set("COUNT SUM AVG MAX MIN COALESCE NULLIF CAST EXTRACT DATE_TRUNC NOW CURRENT_TIMESTAMP LENGTH LOWER UPPER TRIM ROUND FLOOR CEIL ABS ROW_NUMBER RANK DENSE_RANK LAG LEAD FIRST_VALUE LAST_VALUE PERCENTILE_CONT STDDEV VARIANCE GREATEST LEAST NTILE FILTER WITHIN".split(" "));

function highlightLine(line: string, key: number) {
  if (!line.trim()) return <span key={key}>&nbsp;</span>;
  if (line.trim().startsWith("--")) return <span key={key} className="sql-comment">{line}</span>;
  const rx = /'[^']*'|"[^"]*"|\b[A-Za-z_][A-Za-z0-9_]*\b|\d+(?:\.\d+)?|[^\w\s]|\s+/g;
  const tokens: JSX.Element[] = [];
  let m: RegExpExecArray | null; let i = 0;
  while ((m = rx.exec(line)) !== null) {
    const tok = m[0], up = tok.toUpperCase().trim();
    let cls = "text-slate-300";
    if (tok.startsWith("'") || tok.startsWith('"')) cls = "sql-string";
    else if (/^\d/.test(tok) && tok.trim()) cls = "sql-number";
    else if (FN.has(up)) cls = "sql-function";
    else if (KW.has(up)) cls = "sql-keyword";
    tokens.push(<span key={i++} className={cls}>{tok}</span>);
  }
  return <div key={key}>{tokens}</div>;
}

export function SqlBlock({ sql, label, maxH = 320 }: { sql: string; label: string; maxH?: number }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(sql).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="rounded-xl overflow-hidden border border-violet-500/20 bg-[#020208]">
      <div className="flex items-center justify-between px-4 py-2 bg-violet-500/10 border-b border-violet-500/20">
        <span className="text-[10px] text-violet-400 font-mono tracking-widest">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-violet-300 transition-colors">
          {copied ? <><Check className="w-3 h-3 text-emerald-400"/><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3"/>Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-auto text-[11.5px] leading-7 font-mono" style={{ maxHeight: maxH }}>
        {sql.split("\n").map((ln, i) => highlightLine(ln, i))}
      </pre>
    </div>
  );
}
