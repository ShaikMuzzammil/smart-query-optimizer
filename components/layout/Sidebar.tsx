"use client";
// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Zap, History, BarChart3, Settings, LogOut, BookOpen,
  Brain, Database, Terminal, Home, FlaskConical,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard",    badge: null },
  { href: "/optimizer",   icon: Zap,             label: "SQL Optimizer", badge: null },
  { href: "/nl2sql",      icon: Brain,           label: "NL to SQL",    badge: "NEW" },
  { href: "/schema",      icon: Database,        label: "Schema Vault", badge: "NEW" },
  { href: "/playground",  icon: Terminal,        label: "Playground",   badge: "β" },
  { href: "/examples",    icon: BookOpen,        label: "Examples",     badge: "99" },
  { href: "/history",     icon: History,         label: "History",      badge: null },
  { href: "/analytics",   icon: BarChart3,       label: "Analytics",    badge: null },
  { href: "/settings",    icon: Settings,        label: "Settings",     badge: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 border-r border-violet-500/15 bg-[#040410]/95 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-violet-500/15">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
          <Zap className="w-4 h-4 text-white"/>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black leading-tight truncate">Smart<span className="text-violet-400">Query</span></div>
          <div className="text-[9px] text-slate-500">SQL Intelligence Platform</div>
        </div>
      </div>

      {/* Home link */}
      <div className="px-3 pt-3 pb-1">
        <Link href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-violet-500/5 rounded-xl transition-colors">
          <Home className="w-3.5 h-3.5"/>Back to Home
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative block">
              {active && (
                <motion.div layoutId="sidebar-active"
                  className="absolute inset-0 bg-violet-500/15 border border-violet-500/30 rounded-xl"
                  transition={{ type: "spring", duration: 0.4 }}/>
              )}
              <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                ${active ? "text-violet-300 font-semibold" : "text-slate-400 hover:text-slate-200 hover:bg-violet-500/5"}`}>
                <Icon className="w-4 h-4 flex-shrink-0"/>
                <span className="flex-1 text-xs">{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.badge === "NEW" ? "bg-violet-500/20 text-violet-300" :
                    item.badge === "β"   ? "bg-amber-500/20 text-amber-300" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick optimize CTA */}
      <div className="px-3 pb-3">
        <Link href="/optimizer"
          className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-xs font-semibold rounded-xl transition-all glow-violet shadow-lg shadow-violet-500/20">
          <Zap className="w-3.5 h-3.5"/> New Optimization
        </Link>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-violet-500/15">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-slate-200 truncate">{session?.user?.name ?? "User"}</div>
            <div className="text-[10px] text-slate-500 truncate">{session?.user?.email}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-2 py-2 text-xs text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/5">
          <LogOut className="w-3.5 h-3.5"/> Sign out
        </button>
      </div>
    </aside>
  );
}
