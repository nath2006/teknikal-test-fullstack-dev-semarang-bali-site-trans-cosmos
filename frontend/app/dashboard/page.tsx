"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, ListTodo, Users } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/Button";
import { TaskCard } from "@/components/TaskCard";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";

import type { PaginatedResponse, Task, User } from "@/types";

export default function DashboardPage() {
  const { isAdmin } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    try {
      const taskResponse = await api.get<PaginatedResponse<Task>>("/tasks", {
        params: { per_page: 100 },
      });

      setTasks(taskResponse.data.data);

      if (isAdmin) {
        const userResponse = await api.get<PaginatedResponse<User>>("/users", {
          params: { per_page: 100 },
        });

        setUsers(userResponse.data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, [isAdmin]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      progress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length,
      users: users.length,
    };
  }, [tasks, users]);

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <Topbar
          title="Dashboard"
          description="Overview of your task management system."
        />

        <Link href="/dashboard/tasks">
          <Button>Manage Tasks</Button>
        </Link>
      </div>

      <section
        className={`grid gap-6 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}
      >
        <StatCard title="Total Tasks" value={stats.total} icon={<ListTodo />} />
        <StatCard title="In Progress" value={stats.progress} icon={<Clock3 />} />
        <StatCard title="Completed" value={stats.done} icon={<CheckCircle2 />} />

        {isAdmin && (
          <StatCard title="Total Users" value={stats.users} icon={<Users />} />
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Recent Tasks</h2>
            <p className="text-sm text-slate-500">
              Latest tasks from your workspace.
            </p>
          </div>

          <Link href="/dashboard/tasks">
            <Button variant="ghost">View all</Button>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-soft">
            Loading dashboard...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tasks.slice(0, 6).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
      </div>

      <h2 className="mt-4 text-4xl font-bold text-slate-950">{value}</h2>
    </div>
  );
}
