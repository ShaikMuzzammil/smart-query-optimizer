'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TopTermsChart({ data }: { data: { term: string; score: number }[] }) {
  if (data.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-ink-faint">No indexed terms yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <XAxis type="number" stroke="#4B5680" fontSize={11} tickLine={false} axisLine={false} hide />
        <YAxis type="category" dataKey="term" stroke="#8B9CC8" fontSize={12} tickLine={false} axisLine={false} width={100} />
        <Tooltip
          contentStyle={{ background: '#131630', border: '1px solid #1E2445', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8B9CC8' }}
          itemStyle={{ color: '#E8EDF8' }}
          formatter={(value: number) => [value.toFixed(3), 'TF-IDF score']}
        />
        <Bar dataKey="score" name="TF-IDF score" fill="#4F8EF7" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
