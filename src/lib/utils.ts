export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
export function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms/1000).toFixed(2)}s` : `${ms}ms`;
}
export function formatPct(n: number) { return `${Math.round(n)}%`; }
export function formatCost(n: number) { return n.toLocaleString(); }
export function truncateSQL(sql: string, max = 100) {
  const s = sql.replace(/\s+/g,' ').trim();
  return s.length <= max ? s : s.slice(0, max) + '…';
}
export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
export function getImprovColor(pct: number) {
  if (pct >= 70) return '#00E676';
  if (pct >= 40) return '#00C6FF';
  if (pct >= 20) return '#7B2FBE';
  return '#FF6B35';
}
export function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
export function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
