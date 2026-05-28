"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    } catch {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchMe);
  }, [fetchMe]);

  const role = user?.role;

  return {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isMember: role === "member",
    canCreateTask: role === "admin" || role === "manager",
    canDeleteTask: role === "admin" || role === "manager",
    canUpdateTask: role === "admin" || role === "manager" || role === "member",
    canManageUsers: role === "admin",
  };
}
