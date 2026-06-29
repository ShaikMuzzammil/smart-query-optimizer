"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", icon: "⊞", label: "Dashboard" },
  { href: "/optimizer", icon: "⚡", label: "SQL Optimizer" },
  { href: "/nl2sql", icon: "💬", label: "NL to SQL", badge: "NEW" },
  { href: "/schema", icon: "🗄️", label: "Schema Vault", badge: "NEW" },
  { href: "/playground", icon: "▶️", label: "Playground", badge: "β" },
  { href: "/examples", icon: "📚", label: "Examples", badge: "99+" },
  { href: "/history", icon: "🕐", label: "History" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside style={{ width: 240, background: "rgba(10,0,20,0.95)", borderRight: "1px solid rgba(45,15,78,0.6)", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50 }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
              <span style={{ color: "#fff" }}>Smart</span><span style={{ color: "#a855f7" }}>Query</span>
            </div>
            <div style={{ fontSize: 9, color: "#7c6f94", letterSpacing: 1 }}>SQL Intelligence Platform</div>
          </div>
        </Link>
      </div>

      {/* Back to Home */}
      <div style={{ padding: "12px 12px 4px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "#7c6f94", fontSize: 13, transition: "all 0.15s" }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(124,58,237,0.1)"; e.currentTarget.style.color = "#c084fc"; }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7c6f94"; }}>
          ← Back to Home
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 12px", overflowY: "auto" }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2,
              textDecoration: "none", transition: "all 0.15s",
              background: active ? "rgba(124,58,237,0.2)" : "transparent",
              color: active ? "#c084fc" : "#7c6f94",
              border: active ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
            }}>
              <span style={{ fontSize: 16, minWidth: 20, textAlign: "center" }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: active ? "rgba(124,58,237,0.4)" : "rgba(124,58,237,0.15)", color: "#c084fc", fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* New Optimization CTA */}
      <div style={{ padding: "12px" }}>
        <Link href="/optimizer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
          ⚡ New Optimization
        </Link>
      </div>

      {/* User */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(45,15,78,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2d9f3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user?.name || "User"}
            </div>
            <div style={{ fontSize: 11, color: "#7c6f94", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user?.email}
            </div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "none", border: "none", color: "#7c6f94", fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7c6f94"; }}>
          → Sign out
        </button>
      </div>
    </aside>
  );
}
