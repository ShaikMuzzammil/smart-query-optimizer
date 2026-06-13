'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function QueriesChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2445" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          stroke="#4B5680"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="#4B5680" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#131630', border: '1px solid #1E2445', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8B9CC8' }}
          itemStyle={{ color: '#E8EDF8' }}
        />
        <Line type="monotone" dataKey="count" name="Queries" stroke="#4F8EF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
