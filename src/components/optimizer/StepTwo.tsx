'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Rocket, Settings2, Eye, EyeOff, Gauge } from 'lucide-react';
import type { OptimizeRequest, DbType, OptimizationGoal } from '@/types';
import { truncateSQL } from '@/lib/utils';

const DB_ICONS: Record<DbType, string> = {
  postgresql: '🐘', mysql: '🐬', sqlserver: '🖥️', sqlite: '💎',
  oracle: '🔴', mongodb: '🍃', cockroachdb: '🪳', supabase: '⚡',
};
const GOAL_ICONS: Record<OptimizationGoal, string> = {
  speed: '⚡', cost: '💰', readability: '📖', balanced: '⚖️',
};

interface Props {
  data: Partial<OptimizeRequest>;
  onBack: () => void;
  onLaunch: (opts: OptimizeRequest['options']) => void;
}

export default function StepTwo({ data, onBack, onLaunch }: Props) {
  const [temperature, setTemperature]   = useState(data.options?.temperature ?? 0.2);
  const [includeExplain, setExplain]    = useState(data.options?.includeExplain ?? true);
  const [includeIndexes, setIndexes]    = useState(data.options?.includeIndexes ?? true);
  const [launching, setLaunching]       = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    // small delay for the animation to show
    setTimeout(() => {
      onLaunch({ temperature, includeExplain, includeIndexes });
    }, 600);
  };

  const queryPreview = data.naturalLanguage
    ? data.naturalLanguage
    : truncateSQL(data.query || '', 200);

  return (
    <div className="space-y-7">

      {/* Query summary */}
      <div>
        <div className="text-xs font-semibold text-[#445566] uppercase tracking-widest mb-3">Query Preview</div>
        <div className="bg-[#050510] border border-[rgba(0,212,255,0.12)] rounded-xl p-5 font-mono text-sm text-[#c8d8e8] leading-relaxed overflow-hidden">
          <div className="line-clamp-3">{queryPreview}</div>
        </div>
      </div>

      {/* Settings grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="cyber-card p-4 flex items-center gap-3">
          <span className="text-2xl">{DB_ICONS[data.dbType as DbType] || '🛢️'}</span>
          <div>
            <div className="text-[10px] text-[#445566] uppercase tracking-widest mb-0.5">Database</div>
            <div className="text-white font-semibold text-sm capitalize">
              {data.dbType}{data.dbVersion ? ` v${data.dbVersion}` : ''}
            </div>
          </div>
        </div>
        <div className="cyber-card p-4 flex items-center gap-3">
          <span className="text-2xl">{GOAL_ICONS[data.optimizationGoal as OptimizationGoal] || '⚖️'}</span>
          <div>
            <div className="text-[10px] text-[#445566] uppercase tracking-widest mb-0.5">Goal</div>
            <div className="text-white font-semibold text-sm capitalize">{data.optimizationGoal}</div>
          </div>
        </div>
        {data.schema && (
          <div className="cyber-card p-4 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <div className="text-[10px] text-[#445566] uppercase tracking-widest mb-0.5">Schema</div>
              <div className="text-[#00ff88] font-semibold text-sm">Provided ✓</div>
            </div>
          </div>
        )}
        {data.naturalLanguage && (
          <div className="cyber-card p-4 flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <div className="text-[10px] text-[#445566] uppercase tracking-widest mb-0.5">Mode</div>
              <div className="text-[#8b5cf6] font-semibold text-sm">Natural Language</div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced options */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={15} className="text-[#8899bb]" />
          <span className="text-sm font-semibold text-white">Advanced Options</span>
        </div>
        <div className="space-y-4">

          {/* Temperature slider */}
          <div className="cyber-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Gauge size={14} className="text-[#00d4ff]" />
                  <span className="text-sm font-semibold text-white">AI Creativity</span>
                </div>
                <p className="text-xs text-[#8899bb] mt-0.5">
                  Lower = more conservative. Higher = more creative rewrites.
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-display font-bold text-[#00d4ff]">{temperature.toFixed(1)}</span>
                <div className="text-[10px] text-[#445566]">
                  {temperature <= 0.2 ? 'Conservative' : temperature <= 0.5 ? 'Balanced' : 'Creative'}
                </div>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00d4ff ${temperature * 100}%, rgba(255,255,255,0.1) ${temperature * 100}%)`,
                }}
                aria-label="AI creativity temperature"
              />
              <div className="flex justify-between mt-1.5 text-[10px] text-[#445566]">
                <span>0.0</span><span>0.5</span><span>1.0</span>
              </div>
            </div>
          </div>

          {/* Toggle: Execution plan */}
          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {includeExplain ? <Eye size={14} className="text-[#00d4ff]" /> : <EyeOff size={14} className="text-[#8899bb]" />}
                <span className="text-sm font-semibold text-white">EXPLAIN Analysis</span>
              </div>
              <p className="text-xs text-[#8899bb] mt-0.5">Include simulated execution plan breakdown</p>
            </div>
            <motion.button
              onClick={() => setExplain(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${includeExplain ? 'bg-[#00d4ff]' : 'bg-[rgba(255,255,255,0.1)]'}`}
              whileTap={{ scale: 0.95 }}
              aria-pressed={includeExplain}
              aria-label="Toggle execution plan"
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                animate={{ left: includeExplain ? '1.5rem' : '0.25rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Toggle: Index suggestions */}
          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🗂️</span>
                <span className="text-sm font-semibold text-white">Index Suggestions</span>
              </div>
              <p className="text-xs text-[#8899bb] mt-0.5">Generate CREATE INDEX recommendations</p>
            </div>
            <motion.button
              onClick={() => setIndexes(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${includeIndexes ? 'bg-[#8b5cf6]' : 'bg-[rgba(255,255,255,0.1)]'}`}
              whileTap={{ scale: 0.95 }}
              aria-pressed={includeIndexes}
              aria-label="Toggle index suggestions"
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                animate={{ left: includeIndexes ? '1.5rem' : '0.25rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Back / Launch */}
      <div className="flex gap-3 pt-2">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary flex-1 py-4 justify-center gap-2"
          disabled={launching}
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>
        <motion.button
          onClick={handleLaunch}
          whileHover={!launching ? { scale: 1.02, y: -2 } : {}}
          whileTap={!launching ? { scale: 0.97 } : {}}
          disabled={launching}
          className="btn-primary flex-[2] py-4 text-sm justify-center gap-2 relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            {launching ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 rounded-full border-2 border-black border-t-transparent"
                />
                Launching…
              </>
            ) : (
              <>
                <Rocket size={16} />
                Launch Optimizer
              </>
            )}
          </span>
          {/* Shimmer sweep */}
          {!launching && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
        </motion.button>
      </div>
    </div>
  );
}
