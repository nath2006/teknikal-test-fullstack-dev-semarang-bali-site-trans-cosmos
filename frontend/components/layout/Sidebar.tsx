"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

export function Sidebar({ role }: { role: string }) {
  const [collapsed, setCollapsed] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        {!collapsed && (
          <div>
            <h1 className="text-2xl font-bold text-slate-950">TaskFlow</h1>
            <p className="mt-1 text-sm text-slate-500">Laravel API + Next.js</p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer rounded-xl p-2 transition hover:bg-slate-100"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        <SidebarLink
          href="/dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          collapsed={collapsed}
        />

        <SidebarLink
          href="/dashboard/tasks"
          icon={<CheckSquare className="h-5 w-5" />}
          label="Tasks"
          collapsed={collapsed}
        />

        {role === "admin" && (
          <SidebarLink
            href="/dashboard/users"
            icon={<Users className="h-5 w-5" />}
            label="Users"
            collapsed={collapsed}
          />
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-slate-100"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-slate-100"
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
