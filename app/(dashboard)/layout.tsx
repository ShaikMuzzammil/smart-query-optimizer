// app/(dashboard)/layout.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#030309] flex">
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none"/>
      <Sidebar/>
      <main className="flex-1 min-w-0 relative z-10">{children}</main>
    </div>
  );
}
