// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export function gainColor(gain: number) {
  if (gain >= 80) return "text-emerald-400";
  if (gain >= 60) return "text-amber-400";
  return "text-rose-400";
}

export function gainBg(gain: number) {
  if (gain >= 80) return "bg-emerald-400/10 border-emerald-400/20";
  if (gain >= 60) return "bg-amber-400/10 border-amber-400/20";
  return "bg-rose-400/10 border-rose-400/20";
}

export const SEVERITY_CONFIG = {
  critical: { color: "text-rose-400",   bg: "bg-rose-400/10",   border: "border-rose-400/30",   dot: "bg-rose-400",   label: "CRIT" },
  high:     { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", dot: "bg-orange-400", label: "HIGH" },
  medium:   { color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30",  dot: "bg-amber-400",  label: "MED"  },
  low:      { color: "text-emerald-400",bg: "bg-emerald-400/10",border: "border-emerald-400/30",dot: "bg-emerald-400",label: "LOW"  },
} as const;

export const DOMAIN_CONFIG: Record<string, { icon: string; color: string }> = {
  "E-Commerce":  { icon: "🛒", color: "#f72585" },
  "Healthcare":  { icon: "🏥", color: "#06d6a0" },
  "Finance":     { icon: "💹", color: "#fbbf24" },
  "HR":          { icon: "👥", color: "#38bdf8" },
  "Analytics":   { icon: "📊", color: "#a78bfa" },
  "Social":      { icon: "💬", color: "#f97316" },
  "Real Estate": { icon: "🏠", color: "#10b981" },
  "Logistics":   { icon: "🚚", color: "#8b5cf6" },
  "General":     { icon: "⚡", color: "#7c3aed" },
};
