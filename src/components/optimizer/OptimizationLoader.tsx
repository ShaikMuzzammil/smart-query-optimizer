'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { id: 'parse',    label: 'Parsing Query AST',          icon: '🔬', color: '#00d4ff', pct: 15 },
  { id: 'analyze',  label: 'Analyzing Execution Plan',   icon: '📊', color: '#0080ff', pct: 40 },
  { id: 'optimize', label: 'Generating Optimizations',   icon: '⚡', color: '#8b5cf6', pct: 75 },
  { id: 'finalize', label: 'Building Index Suggestions', icon: '🗂️', color: '#00ff88', pct: 95 },
];

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: i * 30,
  radius: 70 + (i % 3) * 20,
  delay: i * 0.1,
  size: i % 2 === 0 ? 6 : 4,
}));

interface Props {
  dbType?: string;
}

export default function OptimizationLoader({ dbType = 'postgresql' }: Props) {
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [progress, setProgress]   = useState(0);
  const [typedText, setTypedText] = useState('');

  const currentPhase = PHASES[phaseIdx];

  // Advance phases
  useEffect(() => {
    const intervals = [800, 1200, 1500, 800];
    let idx = 0;
    const advance = () => {
      idx++;
      if (idx < PHASES.length) {
        setPhaseIdx(idx);
        const t = setTimeout(advance, intervals[idx]);
        return () => clearTimeout(t);
      }
    };
    const t = setTimeout(advance, intervals[0]);
    return () => clearTimeout(t);
  }, []);

  // Smooth progress bar
  useEffect(() => {
    const target = currentPhase.pct;
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= target) { clearInterval(timer); return target; }
        return p + 1;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [phaseIdx, currentPhase.pct]);

  // Typewriter for terminal lines
  const terminalLines = [
    `CONNECT ${dbType.toUpperCase()} > parsing token stream...`,
    'SCANNER > 43 tokens extracted',
    'PLANNER > building cost model...',
    'OPTIMIZER > evaluating join strategies...',
    'INDEX_ADV > scanning predicate columns...',
    'GPT4o > generating optimizations...',
    'FORMATTER > applying style rules...',
  ];
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => Math.min(i + 1, terminalLines.length - 1)), 550);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 select-none">

      {/* Quantum orb + orbiting particles */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-10">

        {/* Background rings */}
        {[1, 2, 3].map(ring => (
          <motion.div
            key={ring}
            className="absolute rounded-full border"
            style={{
              width:  ring * 52,
              height: ring * 52,
              borderColor: `${currentPhase.color}${ring === 1 ? '40' : ring === 2 ? '20' : '10'}`,
            }}
            animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2 + ring * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Orbiting particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: currentPhase.color,
              boxShadow: `0 0 ${p.size * 2}px ${currentPhase.color}`,
              top: '50%',
              left: '50%',
              marginTop: -p.size / 2,
              marginLeft: -p.size / 2,
            }}
            animate={{
              x: [
                Math.cos((p.angle * Math.PI) / 180) * p.radius,
                Math.cos(((p.angle + 360) * Math.PI) / 180) * p.radius,
              ],
              y: [
                Math.sin((p.angle * Math.PI) / 180) * p.radius,
                Math.sin(((p.angle + 360) * Math.PI) / 180) * p.radius,
              ],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          />
        ))}

        {/* Central orb */}
        <motion.div
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${currentPhase.color}, ${currentPhase.color}80)`,
            boxShadow: `0 0 40px ${currentPhase.color}80, 0 0 80px ${currentPhase.color}30, inset 0 0 20px rgba(255,255,255,0.15)`,
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPhase.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentPhase.icon}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{   opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-6"
        >
          <div
            className="text-lg font-display font-bold tracking-wide mb-1"
            style={{ color: currentPhase.color }}
          >
            {currentPhase.label}
          </div>
          <div className="text-[#8899bb] text-sm">AI analysis in progress…</div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-8">
        <div className="flex justify-between text-xs text-[#445566] mb-2">
          <span>Processing</span>
          <span style={{ color: currentPhase.color }}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${currentPhase.color}, ${currentPhase.color}aa)`,
              boxShadow: `0 0 10px ${currentPhase.color}80`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear', duration: 0.05 }}
          />
        </div>
      </div>

      {/* Terminal */}
      <div className="w-full max-w-sm terminal">
        <div className="terminal-header">
          <div className="terminal-dot bg-[#ff5f57]" />
          <div className="terminal-dot bg-[#febc2e]" />
          <div className="terminal-dot bg-[#28c840]" />
          <span className="ml-3 text-[#445566] text-xs font-mono">smart-query-optimizer — optimizer</span>
        </div>
        <div className="terminal-body space-y-1.5 min-h-[120px]">
          {terminalLines.slice(0, lineIdx + 1).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-mono text-xs flex gap-2"
            >
              <span className="text-[#00d4ff] shrink-0">$</span>
              <span className={i === lineIdx ? 'text-[#e8f4ff]' : 'text-[#445566]'}>{line}</span>
              {i === lineIdx && (
                <span className="animate-type-cursor inline-block w-1.5 h-3.5 bg-[#00d4ff] align-middle" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Phase step indicators */}
      <div className="flex items-center gap-3 mt-8">
        {PHASES.map((ph, i) => (
          <div key={ph.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                animate={{
                  background: i < phaseIdx
                    ? '#00ff88'
                    : i === phaseIdx
                    ? ph.color
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: i === phaseIdx
                    ? `0 0 15px ${ph.color}80`
                    : 'none',
                }}
              >
                {i < phaseIdx ? '✓' : ph.icon}
              </motion.div>
              <span className="text-[9px] text-[#445566] whitespace-nowrap hidden sm:block">{ph.label.split(' ')[0]}</span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className="w-6 h-0.5 rounded-full transition-all duration-700"
                style={{ background: i < phaseIdx ? '#00ff88' : 'rgba(255,255,255,0.08)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
