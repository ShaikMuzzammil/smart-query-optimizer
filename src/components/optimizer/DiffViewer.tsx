'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Columns, AlignLeft } from 'lucide-react';
import { useClipboard } from '@/hooks';

function highlightSQL(sql: string): string {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|AS|WITH|CASE|WHEN|THEN|ELSE|END|INSERT|UPDATE|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CONSTRAINT|USING|INTO|VALUES|SET|ASC|DESC|EXPLAIN|ANALYZE|PARTITION|OVER|RANK|ROW_NUMBER|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE|COUNT|SUM|AVG|MAX|MIN|COALESCE|NULLIF|CAST|DATE_TRUNC|NOW|CURRENT_TIMESTAMP|INTERVAL|CTE|RECURSIVE)\b/gi;
  const strings  = /'[^']*'/g;
  const numbers  = /\b(\d+(\.\d+)?)\b/g;
  const comments = /--[^\n]*/g;

  return sql
    .replace(comments,  m => `<span class="text-[#6a9955] italic">${m}</span>`)
    .replace(strings,   m => `<span class="text-[#ce9178]">${m}</span>`)
    .replace(numbers,   m => `<span class="text-[#b5cea8]">${m}</span>`)
    .replace(keywords,  m => `<span class="text-[#569cd6] font-semibold">${m}</span>`);
}

function computeDiff(original: string, optimized: string) {
  const origLines = original.split('\n');
  const optLines  = optimized.split('\n');
  const result: { orig?: string; opt?: string; type: 'added' | 'removed' | 'same' }[] = [];

  const maxLen = Math.max(origLines.length, optLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const n = optLines[i];
    if (o === n) {
      result.push({ orig: o, opt: n, type: 'same' });
    } else if (o !== undefined && n !== undefined) {
      result.push({ orig: o, type: 'removed' });
      result.push({ opt: n, type: 'added' });
    } else if (o !== undefined) {
      result.push({ orig: o, type: 'removed' });
    } else {
      result.push({ opt: n, type: 'added' });
    }
  }
  return result;
}

interface Props {
  original:  string;
  optimized: string;
}

export default function DiffViewer({ original, optimized }: Props) {
  const [view, setView]               = useState<'split' | 'unified'>('split');
  const { copy: copyOrig, copied: copiedOrig } = useClipboard();
  const { copy: copyOpt,  copied: copiedOpt  } = useClipboard();

  const diff = computeDiff(original, optimized);

  const bgForType = (type: string) => {
    if (type === 'added')   return 'bg-[rgba(0,255,136,0.06)] border-l-2 border-l-[#00ff88]';
    if (type === 'removed') return 'bg-[rgba(255,0,128,0.06)] border-l-2 border-l-[#ff0080]';
    return '';
  };
  const markerForType = (type: string) => {
    if (type === 'added')   return <span className="text-[#00ff88] w-4 shrink-0">+</span>;
    if (type === 'removed') return <span className="text-[#ff0080] w-4 shrink-0">−</span>;
    return <span className="text-[#333] w-4 shrink-0"> </span>;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.04)] rounded-lg border border-[rgba(0,212,255,0.1)]">
            {[
              { id: 'split',   label: 'Split',   Icon: Columns   },
              { id: 'unified', label: 'Unified', Icon: AlignLeft },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  view === id
                    ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
                    : 'text-[#8899bb] hover:text-white'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[#8899bb]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[rgba(255,0,128,0.4)] border border-[#ff0080]/30" />
            Removed
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#8899bb]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[rgba(0,255,136,0.4)] border border-[#00ff88]/30" />
            Added
          </span>
        </div>
      </div>

      {view === 'split' ? (
        <div className="grid md:grid-cols-2 gap-3">
          {/* Original */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff0080]" />
                <span className="text-xs font-semibold text-[#ff0080] uppercase tracking-widest">Before</span>
              </div>
              <button
                onClick={() => copyOrig(original)}
                className="flex items-center gap-1 text-xs text-[#8899bb] hover:text-white transition-colors"
              >
                {copiedOrig ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                {copiedOrig ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-[#050510] border border-[rgba(255,0,128,0.15)] rounded-xl overflow-auto max-h-80 font-mono text-xs leading-relaxed">
              {original.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-[#333] w-8 text-right pr-3 py-0.5 shrink-0 border-r border-[rgba(255,255,255,0.04)] text-[10px]">
                    {i + 1}
                  </span>
                  <span
                    className="pl-3 py-0.5 text-[#c8d8e8] flex-1"
                    dangerouslySetInnerHTML={{ __html: highlightSQL(line) || '&nbsp;' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Optimized */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
                <span className="text-xs font-semibold text-[#00ff88] uppercase tracking-widest">After</span>
              </div>
              <button
                onClick={() => copyOpt(optimized)}
                className="flex items-center gap-1 text-xs text-[#8899bb] hover:text-white transition-colors"
              >
                {copiedOpt ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                {copiedOpt ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-[#050510] border border-[rgba(0,255,136,0.15)] rounded-xl overflow-auto max-h-80 font-mono text-xs leading-relaxed">
              {optimized.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-[#333] w-8 text-right pr-3 py-0.5 shrink-0 border-r border-[rgba(255,255,255,0.04)] text-[10px]">
                    {i + 1}
                  </span>
                  <span
                    className="pl-3 py-0.5 text-[#c8d8e8] flex-1"
                    dangerouslySetInnerHTML={{ __html: highlightSQL(line) || '&nbsp;' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Unified diff */
        <div className="bg-[#050510] border border-[rgba(0,212,255,0.12)] rounded-xl overflow-auto max-h-96 font-mono text-xs leading-relaxed">
          {diff.map((d, i) => {
            const content = d.orig ?? d.opt ?? '';
            return (
              <div key={i} className={`flex ${bgForType(d.type)}`}>
                <span className="select-none text-[#333] w-8 text-right pr-2 py-0.5 shrink-0 border-r border-[rgba(255,255,255,0.04)] text-[10px]">
                  {i + 1}
                </span>
                <span className="px-3 py-0.5 shrink-0">{markerForType(d.type)}</span>
                <span
                  className="py-0.5 text-[#c8d8e8] flex-1"
                  dangerouslySetInnerHTML={{ __html: highlightSQL(content) || '&nbsp;' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
