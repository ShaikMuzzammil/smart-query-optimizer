'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function SentimentChart({ data }: { data: { date: string; positive: number; negative: number; neutral: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2445" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} stroke="#4B5680" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#4B5680" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#131630', border: '1px solid #1E2445', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8B9CC8' }}
          itemStyle={{ color: '#E8EDF8' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8B9CC8' }} />
        <Area type="monotone" dataKey="positive" stackId="1" name="Positive" stroke="#22C55E" fill="#22C55E" fillOpacity={0.25} />
        <Area type="monotone" dataKey="neutral" stackId="1" name="Neutral" stroke="#8B9CC8" fill="#8B9CC8" fillOpacity={0.18} />
        <Area type="monotone" dataKey="negative" stackId="1" name="Negative" stroke="#EF4444" fill="#EF4444" fillOpacity={0.25} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
