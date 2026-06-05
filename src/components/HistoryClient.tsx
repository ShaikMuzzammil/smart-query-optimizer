'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, ChevronLeft, ChevronRight, Database, RefreshCw, TrendingUp, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import type { HistoryItem } from '../types';
import { timeAgo, truncateSQL, getImprovementColor, formatMs } from '../lib/utils';
import toast from 'react-hot-toast';

const DB_OPTIONS = ['', 'postgresql', 'mysql', 'sqlserver', 'sqlite', 'oracle', 'mongodb', 'cockroachdb', 'supabase'];
const GOAL_OPTIONS = ['', 'speed', 'cost', 'readability', 'balanced'];

function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-12 w-full" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-5 w-16" />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [items, setItems]       = useState<HistoryItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [dbFilter, setDbFilter] = useState('');
  const [goalFilter, setGoal]   = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search)   params.set('search', search);
      if (dbFilter) params.set('dbType', dbFilter);
      if (goalFilter) params.set('goal', goalFilter);

      const res  = await fetch(`/api/history?${params}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error || 'Failed to load history');
      setItems(json.data.items);
      setTotal(json.data.total);
      setPages(json.data.pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, dbFilter, goalFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, dbFilter, goalFilter]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setItems(prev => prev.filter(i => i._id !== id));
      setTotal(t => t - 1);
      toast.success('Entry deleted');
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  return (
    <main>
      <Navbar />
      <section className="min-h-screen pt-28 pb-20">
        <div className="container-max">
          {/* Header */}
          <div className="mb-10">
            <span className="badge badge-cyan mb-3 inline-flex">Query History</span>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-display font-black text-white mb-2">
                  Optimization <span className="text-gradient-cyber">History</span>
                </h1>
                <p className="text-[#8899bb]">
                  {total > 0 ? `${total} optimizations recorded` : 'Your past optimizations will appear here'}
                </p>
              </div>
              <button
                onClick={fetchHistory}
                className="flex items-center gap-2 text-sm text-[#8899bb] hover:text-[#00d4ff] transition-colors"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#445566]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search queries…"
                className="form-input pl-10 w-full text-sm"
              />
            </div>
            <select
              value={dbFilter}
              onChange={e => setDbFilter(e.target.value)}
              className="form-input text-sm w-full sm:w-44"
            >
              <option value="">All Databases</option>
              {DB_OPTIONS.slice(1).map(d => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
            <select
              value={goalFilter}
              onChange={e => setGoal(e.target.value)}
              className="form-input text-sm w-full sm:w-40"
            >
              <option value="">All Goals</option>
              {GOAL_OPTIONS.slice(1).map(g => (
                <option key={g} value={g} className="capitalize">{g}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-[#8899bb] mb-4">{error}</p>
              <button onClick={fetchHistory} className="btn-secondary px-6 py-3 text-sm">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-5">📭</div>
              <h3 className="text-xl font-bold text-white mb-3">No history yet</h3>
              <p className="text-[#8899bb] mb-6">
                {search || dbFilter || goalFilter
                  ? 'No results match your filters.'
                  : 'Start optimizing queries to build your history.'}
              </p>
              <Link href="/optimizer">
                <motion.button whileHover={{ scale: 1.02 }} className="btn-primary px-8 py-3 text-sm">
                  Launch Optimizer
                </motion.button>
              </Link>
            </div>
          ) : (
            <>
              <AnimatePresence>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((item, i) => {
                    const improvColor = getImprovementColor(item.metrics.estimatedImprovement);
                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0  }}
                        transition={{ delay: i * 0.04 }}
                        className="glass-card p-5 group hover:border-[rgba(0,212,255,0.2)] transition-all flex flex-col"
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="badge badge-cyan text-[10px] capitalize">{item.dbType}</span>
                            <span className="badge badge-purple text-[10px] capitalize">{item.optimizationGoal}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="font-display font-bold text-sm"
                              style={{ color: improvColor }}
                            >
                              +{item.metrics.estimatedImprovement}%
                            </span>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="opacity-0 group-hover:opacity-100 text-[#445566] hover:text-[#ff0080] transition-all"
                              aria-label="Delete entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Query preview */}
                        <div className="bg-[#050510] rounded-lg p-3 font-mono text-xs text-[#8899bb] leading-relaxed mb-3 flex-1 overflow-hidden">
                          <div className="line-clamp-3">{truncateSQL(item.originalQuery, 180)}</div>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center justify-between text-xs text-[#445566]">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {timeAgo(item.createdAt)}
                          </span>
                          {item.metrics.estimatedExecMs > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp size={11} />
                              {formatMs(item.metrics.estimatedExecMs)}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(pages, 7))].map((_, i) => {
                      const pg = i + 1;
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                            pg === page
                              ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                              : 'text-[#8899bb] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
