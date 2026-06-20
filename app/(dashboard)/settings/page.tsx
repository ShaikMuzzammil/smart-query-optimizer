"use client";
// app/(dashboard)/settings/page.tsx
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Mail, Shield, Database, Zap, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-violet-400"/>
            <h2 className="text-sm font-semibold">Profile</h2>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-xl font-bold text-white">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="font-bold">{session?.user?.name}</div>
              <div className="text-sm text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/>{session?.user?.email}</div>
            </div>
          </div>
        </motion.div>

        {/* System status */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.05}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-violet-400"/>
            <h2 className="text-sm font-semibold">System Status</h2>
          </div>
          <div className="space-y-3">
            {[
              { label:"Database", desc:"Neon PostgreSQL — Serverless", icon:<Database className="w-4 h-4"/> },
              { label:"AI Engine", desc:"Advanced AI optimization engine", icon:<Zap className="w-4 h-4"/> },
              { label:"Rate Limit", desc:"20 optimizations per hour", icon:<Shield className="w-4 h-4"/> },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-violet-500/5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0">{item.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          className="glass-card rounded-2xl p-6 border-rose-500/25">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-400"/>
            <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Sign out of all devices</div>
              <div className="text-xs text-slate-500">This will end your current session</div>
            </div>
            <button onClick={()=>signOut({callbackUrl:"/"})}
              className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-sm font-medium rounded-lg transition-colors">
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
