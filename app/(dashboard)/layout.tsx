"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0014" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#7c6f94", fontSize: 14 }}>Loading Smart Query Optimizer...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0014" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, minHeight: "100vh", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
