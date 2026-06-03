'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, TrendingUp, Clock, Cpu, AlertTriangle, Zap } from 'lucide-react';
import type { OptimizationMetrics, IndexSuggestion } from '@/types';
import { useClipboard } from '@/hooks';
import { formatCost, formatMs, formatPercent, getImprovementColor, getImpactColor } from '@/lib/utils';

// ══════════════════════════════════════════════════════════
// METRICS PANEL
// ══════════════════════════════════════════════════════════
interface MetricsProps {
  metrics: OptimizationMetrics;
  queryComplexity?: string;
  warnings?: string[];
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function MetricsPanel({ metrics, queryComplexity, warnings }: MetricsProps) {
  const improvColor = getImprovementColor(metrics.estimatedImprovement);
  const costReductionPct = metrics.beforeCost > 0
    ? ((metrics.beforeCost - metrics.afterCost) / metrics.beforeCost) * 100
    : 0;

  const cards = [
    {
      label: 'Estimated Improvement',
      icon:  <TrendingUp size={16} />,
      value: formatPercent(metrics.estimatedImprovement),
      sub:   'Overall performance gain',
      color: improvColor,
      pct:   metrics.estimatedImprovement,
    },
    {
      label: 'Query Cost',
      icon:  <Cpu size={16} />,
      value: formatCost(metrics.afterCost),
      sub:   `Was ${formatCost(metrics.beforeCost)} (−${Math.round(costReductionPct)}%)`,
      color: '#0080ff',
      pct:   Math.max(0, 100 - costReductionPct),
    },
    {
      label: 'Est. Execution Time',
      icon:  <Clock size={16} />,
      value: formatMs(metrics.estimatedExecMs),
      sub:   'With proposed optimizations',
      color: '#8b5cf6',
      pct:   Math.min(metrics.estimatedExecMs / 10, 100),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="metric-card"
          >
            <div className="flex items-center justify-center gap-1.5 mb-2" style={{ color: card.color }}>
              {card.icon}
              <span className="text-[10px] uppercase tracking-widest font-semibold">{card.label}</span>
            </div>
            <div className="text-3xl font-display font-black mb-1" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-[11px] text-[#8899bb] mb-3">{card.sub}</div>
            <AnimatedBar value={card.pct} color={card.color} />
          </motion.div>
        ))}
      </div>

      {queryComplexity && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#8899bb]">Query complexity:</span>
          <span className={`badge capitalize ${
            queryComplexity === 'simple'      ? 'badge-green'  :
            queryComplexity === 'moderate'    ? 'badge-cyan'   :
            queryComplexity === 'complex'     ? 'badge-orange' :
            'badge-purple'
          }`}>
            {queryComplexity.replace('_', ' ')}
          </span>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-[rgba(255,102,0,0.2)] bg-[rgba(255,102,0,0.04)] rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-[#ff6600] font-semibold text-sm">
            <AlertTriangle size={14} />
            <span>Warnings</span>
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-[#c8d8e8] text-xs leading-relaxed pl-5">• {w}</p>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// INDEX SUGGESTIONS
// ══════════════════════════════════════════════════════════
interface IndexProps {
  suggestions: IndexSuggestion[];
}

export function IndexSuggestions({ suggestions }: IndexProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { copy } = useClipboard();

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-[#445566]">
        <div className="text-3xl mb-3">✅</div>
        <p className="text-sm">No additional indexes needed — query is already well-indexed.</p>
      </div>
    );
  }

  const handleCopy = async (sql: string, i: number) => {
    await copy(sql);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-3">
      {suggestions.map((s, i) => {
        const impactColor = getImpactColor(s.impact);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0    }}
            transition={{ delay: i * 0.1 }}
            className="cyber-card p-4 hover:border-[rgba(0,212,255,0.2)] transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: impactColor }} />
                <span
                  className="badge text-[10px]"
                  style={{
                    background: `${impactColor}18`,
                    color: impactColor,
                    border: `1px solid ${impactColor}25`,
                  }}
                >
                  {s.impact.toUpperCase()} IMPACT
                </span>
              </div>
              <button
                onClick={() => handleCopy(s.sql, i)}
                className="flex items-center gap-1 text-xs text-[#8899bb] hover:text-[#00d4ff] transition-colors shrink-0"
              >
                {copiedIdx === i ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                {copiedIdx === i ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-[#050510] border border-[rgba(0,212,255,0.1)] rounded-lg p-3 font-mono text-xs text-[#00d4ff] overflow-auto leading-relaxed mb-3">
              {s.sql}
            </pre>
            <p className="text-[#8899bb] text-xs leading-relaxed">{s.reason}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
