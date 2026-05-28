"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={user.role} />

      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>
  );
}
