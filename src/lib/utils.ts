import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Tailwind class merger ─────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Number formatters ─────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatCost(cost: number): string {
  return cost.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// ─── Date helpers ──────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  const d    = new Date(date);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60)        return `${diff}s ago`;
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000)   return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── SQL utilities ─────────────────────────────────────────
export function truncateSQL(sql: string, maxLen = 120): string {
  const oneLine = sql.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen) + '…';
}

export function countSQLLines(sql: string): number {
  return sql.split('\n').length;
}

export function estimateQueryComplexity(sql: string): 'simple' | 'moderate' | 'complex' | 'very_complex' {
  const upper = sql.toUpperCase();
  const joinCount = (upper.match(/\bJOIN\b/g) || []).length;
  const subqueries = (upper.match(/\bSELECT\b/g) || []).length - 1;
  const hasGroupBy = upper.includes('GROUP BY');
  const hasWindow  = upper.includes('OVER (') || upper.includes('OVER(');
  const hasCTE     = upper.includes('WITH ') && upper.includes('AS (');

  const score = joinCount * 2 + subqueries * 3 + (hasGroupBy ? 1 : 0) + (hasWindow ? 2 : 0) + (hasCTE ? 1 : 0);

  if (score === 0) return 'simple';
  if (score <= 3)  return 'moderate';
  if (score <= 7)  return 'complex';
  return 'very_complex';
}

// ─── Color helpers ─────────────────────────────────────────
export function getImprovementColor(pct: number): string {
  if (pct >= 70) return '#00ff88';
  if (pct >= 40) return '#00d4ff';
  if (pct >= 20) return '#0080ff';
  return '#8b5cf6';
}

export function getComplexityColor(c: string): string {
  const map: Record<string, string> = {
    simple:      '#00ff88',
    moderate:    '#00d4ff',
    complex:     '#ff6600',
    very_complex: '#ff0080',
  };
  return map[c] || '#8b5cf6';
}

export function getImpactColor(impact: 'high' | 'medium' | 'low'): string {
  return { high: '#00ff88', medium: '#00d4ff', low: '#8b5cf6' }[impact];
}

// ─── String helpers ────────────────────────────────────────
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─── Debounce ──────────────────────────────────────────────
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ─── Async sleep ───────────────────────────────────────────
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Random ID ─────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Hash (for IP anonymization) ──────────────────────────
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.JWT_SECRET || 'salt'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
