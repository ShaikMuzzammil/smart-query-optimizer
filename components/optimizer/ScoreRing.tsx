"use client";
// components/optimizer/ScoreRing.tsx
export function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size / 2) - 12, circ = 2 * Math.PI * r;
  const s = Math.max(0, Math.min(100, score || 0));
  const color = s >= 80 ? "#06d6a0" : s >= 55 ? "#fbbf24" : "#f72585";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={7}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${(s/100)*circ} ${circ}`} strokeLinecap="round"
          className="score-ring-fill"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-bold font-mono leading-none" style={{ color }}>+{s}%</div>
        <div className="text-[8px] text-slate-500 uppercase tracking-wider mt-1">Est. Gain</div>
      </div>
    </div>
  );
}
