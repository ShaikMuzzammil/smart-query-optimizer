'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Download, RefreshCw, Share2, BookOpen, BarChart3, Lightbulb, FileText } from 'lucide-react';
import type { OptimizeResult } from '../../types';
import { useClipboard } from '../../hooks';
import { getImprovementColor } from '../../lib/utils';
import DiffViewer from './DiffViewer';
import { MetricsPanel, IndexSuggestions } from './MetricsPanel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'diff',        label: 'Diff View',   icon: <FileText  size={14} /> },
  { id: 'metrics',     label: 'Metrics',      icon: <BarChart3 size={14} /> },
  { id: 'indexes',     label: 'Indexes',      icon: <Lightbulb size={14} /> },
  { id: 'explanation', label: 'Explanation',  icon: <BookOpen  size={14} /> },
];

interface Props {
  result: OptimizeResult;
  onReset: () => void;
}

export default function StepThree({ result, onReset }: Props) {
  const [activeTab, setActiveTab]   = useState('diff');
  const { copy, copied }            = useClipboard();
  const improvColor                 = getImprovementColor(result.metrics.estimatedImprovement);

  // Confetti for high improvements
  useEffect(() => {
    if (result.metrics.estimatedImprovement >= 50) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#00d4ff', '#0080ff', '#8b5cf6', '#00ff88'],
          gravity: 0.8,
          scalar: 0.9,
        });
      });
    }
  }, [result.metrics.estimatedImprovement]);

  const handleDownload = useCallback(() => {
    const content = [
      '-- ============================================================',
      '-- Smart Query Optimizer — Optimization Report',
      `-- Generated: ${new Date().toISOString()}`,
      `-- Database: ${result.optimizedQuery.includes('LIMIT') ? 'Various' : 'Various'}`,
      `-- Estimated Improvement: ${result.metrics.estimatedImprovement}%`,
      '-- ============================================================',
      '',
      '-- ORIGINAL QUERY',
      '-- ' + '-'.repeat(60),
      result.originalQuery,
      '',
      '-- OPTIMIZED QUERY',
      '-- ' + '-'.repeat(60),
      result.optimizedQuery,
      '',
    ].join('\n');

    if (result.indexSuggestions.length > 0) {
      const idx = ['', '-- INDEX SUGGESTIONS', '-- ' + '-'.repeat(60),
        ...result.indexSuggestions.map(s => `-- [${s.impact.toUpperCase()}] ${s.reason}\n${s.sql}`),
        '',
      ].join('\n');
      const blob = new Blob([content + idx], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `smart-query-optimizer-optimized-${Date.now()}.sql`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `smart-query-optimizer-optimized-${Date.now()}.sql`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success('Optimization report downloaded!');
  }, [result]);

  const handleShare = useCallback(() => {
    const text = `I just optimized a SQL query with Smart Query Optimizer and got a ${result.metrics.estimatedImprovement}% performance improvement! 🚀\n\n${window.location.origin}/optimizer`;
    navigator.clipboard.writeText(text);
    toast.success('Share text copied to clipboard!');
  }, [result.metrics.estimatedImprovement]);

  return (
    <div className="space-y-6">

      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1,    y: 0    }}
        className="relative overflow-hidden rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${improvColor}10, transparent)`,
          borderColor: `${improvColor}30`,
          boxShadow: `0 0 30px ${improvColor}10`,
        }}
      >
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-display font-black shrink-0"
              style={{ background: improvColor, color: '#000' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {result.metrics.estimatedImprovement}%
            </motion.div>
            <div>
              <div className="text-white font-bold text-base">Optimization Complete!</div>
              <div className="text-[#8899bb] text-sm">
                Estimated {result.metrics.estimatedImprovement}% performance improvement
                {result.queryComplexity && (
                  <> · <span className="capitalize">{result.queryComplexity.replace('_', ' ')}</span> query</>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              onClick={() => { copy(result.optimizedQuery); toast.success('Optimized query copied!'); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] text-xs font-medium hover:bg-[rgba(0,212,255,0.18)] transition-all"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy SQL'}
            </motion.button>
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#8899bb] text-xs hover:text-white transition-all"
            >
              <Download size={13} />
              .sql
            </motion.button>
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#8899bb] text-xs hover:text-white transition-all"
            >
              <Share2 size={13} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(0,212,255,0.08)]">
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.97 }}
            className={`relative flex items-center gap-1.5 flex-1 justify-center py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'text-[#00d4ff]'
                : 'text-[#8899bb] hover:text-white'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'indexes' && result.indexSuggestions?.length > 0 && (
                <span className="badge badge-purple py-0 px-1.5 text-[9px] leading-none">
                  {result.indexSuggestions.length}
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{   opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'diff' && (
            <DiffViewer original={result.originalQuery} optimized={result.optimizedQuery} />
          )}
          {activeTab === 'metrics' && (
            <MetricsPanel
              metrics={result.metrics}
              queryComplexity={result.queryComplexity}
              warnings={result.warnings}
            />
          )}
          {activeTab === 'indexes' && (
            <IndexSuggestions suggestions={result.indexSuggestions || []} />
          )}
          {activeTab === 'explanation' && (
            <div className="prose prose-invert max-w-none">
              <div className="bg-[#0a0a16] border border-[rgba(0,212,255,0.1)] rounded-xl p-6 text-sm leading-relaxed text-[#c8d8e8]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({children}) => (
                      <h2 className="text-[#00d4ff] font-display font-bold text-base mt-5 mb-2 first:mt-0">
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-white font-semibold text-sm mt-4 mb-1.5">{children}</h3>
                    ),
                    p:  ({children}) => <p className="text-[#c8d8e8] mb-3 leading-relaxed">{children}</p>,
                    li: ({children}) => <li className="text-[#c8d8e8] mb-1">{children}</li>,
                    ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-3 pl-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-3 pl-2">{children}</ol>,
                    code: ({inline, children}: any) => inline
                      ? <code className="font-mono text-[#00d4ff] bg-[rgba(0,212,255,0.08)] px-1.5 py-0.5 rounded text-xs">{children}</code>
                      : <pre className="bg-[#050510] border border-[rgba(0,212,255,0.1)] rounded-lg p-4 overflow-auto font-mono text-xs text-[#c8d8e8] mb-3"><code>{children}</code></pre>,
                    strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-2 border-[#00d4ff] pl-4 text-[#8899bb] italic my-3">{children}</blockquote>
                    ),
                  }}
                >
                  {result.explanation}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Optimize another */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-2 border-t border-[rgba(0,212,255,0.08)]"
      >
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary w-full py-3.5 gap-2 justify-center text-sm"
        >
          <RefreshCw size={15} />
          Optimize Another Query
        </motion.button>
      </motion.div>
    </div>
  );
}
