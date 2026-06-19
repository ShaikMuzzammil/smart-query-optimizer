"use client";
// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Zap, History, BarChart3, Settings, LogOut, Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/optimizer",  icon: Zap,             label: "Optimizer" },
  { href: "/history",    icon: History,         label: "History" },
  { href: "/analytics",  icon: BarChart3,       label: "Analytics" },
  { href: "/settings",   icon: Settings,        label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 border-r border-violet-500/15 bg-[#040410]/95 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-violet-500/15">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
          <Zap className="w-4 h-4 text-violet-400"/>
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">SmartQuery <span className="text-violet-400">Pro</span></div>
          <div className="text-[9px] text-slate-500 tracking-wider">GODMODE</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative block">
              {active && (
                <motion.div layoutId="sidebar-active"
                  className="absolute inset-0 bg-violet-500/15 border border-violet-500/30 rounded-lg"
                  transition={{ type: "spring", duration: 0.4 }}/>
              )}
              <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${active ? "text-violet-300 font-medium" : "text-slate-400 hover:text-slate-200"}`}>
                <Icon className="w-4 h-4"/>{item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick optimize CTA */}
      <div className="px-3 pb-3">
        <Link href="/optimizer"
          className="flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all glow-violet">
          <Sparkles className="w-4 h-4"/> Quick Optimize
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
