'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, Filter } from 'lucide-react';
import { QUERY_EXAMPLES, EXAMPLE_CATEGORIES } from '@/data/examples';
import { useScrollAnimation } from '@/hooks';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     '#00ff88',
  intermediate: '#00d4ff',
  advanced:     '#8b5cf6',
  expert:       '#ff6600',
};

export default function ExamplesBrowser() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const variants   = useScrollAnimation();
  const router     = useRouter();

  const filtered = QUERY_EXAMPLES.filter(ex => {
    const matchCat = activeCategory === 'all' || ex.category === activeCategory;
    const matchSearch = !searchQuery ||
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.tags.some(t => t.includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleTryExample = (ex: typeof QUERY_EXAMPLES[0]) => {
    // Store in sessionStorage and navigate to optimizer
    try {
      sessionStorage.setItem('smart-query-optimizer_example', JSON.stringify({
        query: ex.query,
        dbType: ex.dbType,
        optimizationGoal: ex.optimizationGoal,
        schema: ex.schema || '',
      }));
    } catch {}
    router.push('/optimizer');
  };

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#445566]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search examples…"
            className="form-input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(0,212,255,0.08)] overflow-x-auto">
          {EXAMPLE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]'
                  : 'text-[#8899bb] hover:text-white'
              }`}
            >
              {cat.label}
              <span className={`text-[10px] ${activeCategory === cat.id ? 'text-[#00d4ff]' : 'text-[#333]'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-[#445566]"
          >
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg">No examples match your search.</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeCategory + searchQuery}
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-5"
          >
            {filtered.map((ex) => (
              <motion.div
                key={ex.id}
                variants={variants.fadeUp}
                whileHover={{ y: -4 }}
                className="cyber-card p-6 glass-card-hover group cursor-default flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-base">{ex.badge.split(' ')[0]}</span>
                      <h3 className="text-white font-bold text-base group-hover:text-[#00d4ff] transition-colors">
                        {ex.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-cyan text-[10px] capitalize">{ex.dbType}</span>
                      <span
                        className="badge text-[10px] capitalize"
                        style={{
                          background: `${DIFFICULTY_COLORS[ex.difficulty]}18`,
                          color: DIFFICULTY_COLORS[ex.difficulty],
                          border: `1px solid ${DIFFICULTY_COLORS[ex.difficulty]}25`,
                        }}
                      >
                        {ex.difficulty}
                      </span>
                      <span className="badge badge-purple text-[10px] capitalize">{ex.category}</span>
                    </div>
                  </div>
                  {/* Improvement badge */}
                  <div className="shrink-0 text-center">
                    <div className="text-xl font-display font-black text-[#00ff88]">
                      +{ex.expectedImprovement}%
                    </div>
                    <div className="text-[9px] text-[#445566] uppercase tracking-widest">expected</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[#8899bb] text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                  {ex.description}
                </p>

                {/* Query preview */}
                <div className="bg-[#050510] border border-[rgba(0,212,255,0.08)] rounded-xl p-3 mb-4 font-mono text-xs text-[#8899bb] leading-relaxed overflow-hidden">
                  <div className="line-clamp-3 whitespace-pre">{ex.query}</div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {ex.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[11px] text-[#445566] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  onClick={() => handleTryExample(ex)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary w-full py-3 text-xs justify-center gap-2 mt-auto"
                >
                  Try This Example
                  <ArrowRight size={13} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
