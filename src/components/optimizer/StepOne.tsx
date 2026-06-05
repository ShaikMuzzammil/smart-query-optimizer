'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Database, Target, FileCode, Lightbulb, BookOpen } from 'lucide-react';
import type { OptimizeRequest, DbType, OptimizationGoal } from '../../types';
import { QUERY_EXAMPLES } from '../../data/examples';

const DB_OPTIONS: { id: DbType; label: string; icon: string; color: string }[] = [
  { id: 'postgresql',   label: 'PostgreSQL',   icon: '🐘', color: '#336791' },
  { id: 'mysql',        label: 'MySQL',         icon: '🐬', color: '#4479a1' },
  { id: 'sqlserver',    label: 'SQL Server',    icon: '🖥️', color: '#cc2927' },
  { id: 'sqlite',       label: 'SQLite',        icon: '💎', color: '#003b57' },
  { id: 'oracle',       label: 'Oracle',        icon: '🔴', color: '#c74634' },
  { id: 'mongodb',      label: 'MongoDB',       icon: '🍃', color: '#47a248' },
  { id: 'cockroachdb',  label: 'CockroachDB',   icon: '🪳', color: '#6933ff' },
  { id: 'supabase',     label: 'Supabase',      icon: '⚡', color: '#3ecf8e' },
];

const GOAL_OPTIONS: { id: OptimizationGoal; label: string; icon: string; desc: string }[] = [
  { id: 'speed',       label: 'Maximize Speed',    icon: '⚡', desc: 'Minimize execution time' },
  { id: 'cost',        label: 'Reduce Cost',       icon: '💰', desc: 'Lower I/O and memory usage' },
  { id: 'readability', label: 'Improve Clarity',   icon: '📖', desc: 'Refactor for maintainability' },
  { id: 'balanced',    label: 'Balanced',          icon: '⚖️', desc: 'Speed + cost + clarity' },
];

interface Props {
  onNext: (data: Partial<OptimizeRequest>) => void;
  initialData?: Partial<OptimizeRequest>;
}

export default function StepOne({ onNext, initialData }: Props) {
  const [query, setQuery]             = useState(initialData?.query || '');
  const [naturalLang, setNaturalLang] = useState(initialData?.naturalLanguage || '');
  const [mode, setMode]               = useState<'sql' | 'natural'>('sql');
  const [dbType, setDbType]           = useState<DbType>(initialData?.dbType || 'postgresql');
  const [dbVersion, setDbVersion]     = useState(initialData?.dbVersion || '');
  const [goal, setGoal]               = useState<OptimizationGoal>(initialData?.optimizationGoal || 'balanced');
  const [schema, setSchema]           = useState(initialData?.schema || '');
  const [schemaOpen, setSchemaOpen]   = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [error, setError]             = useState('');

  const loadExample = (ex: typeof QUERY_EXAMPLES[0]) => {
    setQuery(ex.query);
    setDbType(ex.dbType);
    setGoal(ex.optimizationGoal);
    if (ex.schema) { setSchema(ex.schema); setSchemaOpen(true); }
    setExampleOpen(false);
    setMode('sql');
  };

  const handleNext = () => {
    const text = mode === 'sql' ? query.trim() : naturalLang.trim();
    if (!text) { setError('Please enter a SQL query or description.'); return; }
    if (text.length > 5000) { setError('Query must be under 5,000 characters.'); return; }
    setError('');
    onNext({
      query: mode === 'sql' ? query.trim() : '',
      naturalLanguage: mode === 'natural' ? naturalLang.trim() : '',
      dbType, dbVersion: dbVersion.trim() || undefined,
      optimizationGoal: goal,
      schema: schema.trim() || undefined,
      options: { temperature: 0.2, includeExplain: true, includeIndexes: true },
    });
  };

  return (
    <div className="space-y-7">

      {/* Mode Toggle */}
      <div>
        <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.04)] rounded-xl w-fit border border-[rgba(0,212,255,0.1)]">
          {[
            { id: 'sql',     label: 'SQL Query',        icon: <FileCode size={14} /> },
            { id: 'natural', label: 'Natural Language',  icon: <Lightbulb size={14} /> },
          ].map(m => (
            <motion.button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m.id
                  ? 'bg-gradient-to-r from-[#00d4ff]/20 to-[#0080ff]/20 text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                  : 'text-[#8899bb] hover:text-white'
              }`}
            >
              {m.icon}
              {m.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-white">
            {mode === 'sql' ? 'SQL Query' : 'Describe Your Query'} <span className="text-[#ff0080]">*</span>
          </label>
          <button
            onClick={() => setExampleOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-[#00d4ff] hover:text-white transition-colors"
          >
            <BookOpen size={12} />
            Load Example
          </button>
        </div>

        {/* Example picker */}
        <AnimatePresence>
          {exampleOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="bg-[#0d0d1e] border border-[rgba(0,212,255,0.15)] rounded-xl p-3 grid md:grid-cols-2 gap-2">
                {QUERY_EXAMPLES.slice(0, 6).map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => loadExample(ex)}
                    className="text-left p-3 rounded-lg hover:bg-[rgba(0,212,255,0.08)] border border-transparent hover:border-[rgba(0,212,255,0.15)] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{ex.badge.split(' ')[0]}</span>
                      <span className="text-sm font-medium text-white group-hover:text-[#00d4ff] transition-colors">{ex.title}</span>
                    </div>
                    <p className="text-xs text-[#8899bb] line-clamp-2">{ex.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="badge badge-cyan py-0 text-[10px]">{ex.dbType}</span>
                      <span className="text-[10px] text-[#00ff88]">+{ex.expectedImprovement}% expected</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'sql' ? (
          <textarea
            value={query}
            onChange={e => { setQuery(e.target.value); setError(''); }}
            className="sql-editor w-full h-48 resize-y"
            placeholder={`SELECT o.id, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.status = 'pending'\nORDER BY o.created_at DESC;`}
            spellCheck={false}
            aria-label="SQL query input"
          />
        ) : (
          <textarea
            value={naturalLang}
            onChange={e => { setNaturalLang(e.target.value); setError(''); }}
            className="form-input h-32 resize-y font-body"
            placeholder="Get the top 10 customers by total spend in the last 90 days, grouped by region, excluding cancelled orders..."
            aria-label="Natural language query description"
          />
        )}

        {query && mode === 'sql' && (
          <div className="mt-1.5 flex items-center gap-3 text-xs text-[#445566]">
            <span>{query.length} chars</span>
            <span>·</span>
            <span>{query.split('\n').length} lines</span>
            {query.length > 4000 && (
              <span className="text-[#ff6600]">⚠ Approaching 5K limit</span>
            )}
          </div>
        )}
      </div>

      {/* Database selector */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">
          <Database size={14} className="inline mr-1.5 mb-0.5" />
          Database Engine
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DB_OPTIONS.map(db => (
            <motion.button
              key={db.id}
              onClick={() => setDbType(db.id)}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 p-3 rounded-xl text-sm border transition-all ${
                dbType === db.id
                  ? 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.4)] text-[#00d4ff] shadow-neon-cyan'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[#8899bb] hover:border-[rgba(0,212,255,0.2)] hover:text-white'
              }`}
            >
              <span className="text-lg leading-none">{db.icon}</span>
              <span className="font-medium text-xs truncate">{db.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="text"
            value={dbVersion}
            onChange={e => setDbVersion(e.target.value)}
            className="form-input text-sm py-2 w-40"
            placeholder="Version (e.g. 15)"
            aria-label="Database version"
          />
        </div>
      </div>

      {/* Optimization goal */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">
          <Target size={14} className="inline mr-1.5 mb-0.5" />
          Optimization Goal
        </label>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map(g => (
            <motion.button
              key={g.id}
              onClick={() => setGoal(g.id)}
              whileTap={{ scale: 0.97 }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                goal === g.id
                  ? 'bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.35)] shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.2)]'
              }`}
            >
              <span className="text-xl leading-none mt-0.5">{g.icon}</span>
              <div>
                <div className={`font-semibold text-sm ${goal === g.id ? 'text-[#00d4ff]' : 'text-white'}`}>{g.label}</div>
                <div className="text-[#8899bb] text-xs mt-0.5">{g.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Schema (collapsible) */}
      <div>
        <button
          onClick={() => setSchemaOpen(v => !v)}
          className="flex items-center gap-2 text-sm text-[#8899bb] hover:text-[#00d4ff] transition-colors"
          aria-expanded={schemaOpen}
        >
          <motion.span animate={{ rotate: schemaOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={14} />
          </motion.span>
          <Sparkles size={13} />
          Schema Context <span className="text-[#445566]">(optional — improves accuracy)</span>
        </button>
        <AnimatePresence>
          {schemaOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-3"
            >
              <textarea
                value={schema}
                onChange={e => setSchema(e.target.value)}
                className="sql-editor w-full h-36 resize-y text-xs"
                placeholder={`CREATE TABLE orders (\n  id BIGSERIAL PRIMARY KEY,\n  customer_id BIGINT REFERENCES customers(id),\n  status VARCHAR(50),\n  total NUMERIC(12,2),\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`}
                spellCheck={false}
                aria-label="Database schema (optional)"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[#ff0080] text-sm flex items-center gap-2"
          >
            <span>⚠</span> {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Next button */}
      <motion.button
        onClick={handleNext}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="btn-primary w-full py-4 text-sm justify-center"
      >
        Continue to Confirm
        <ChevronRight size={16} />
      </motion.button>
    </div>
  );
}
