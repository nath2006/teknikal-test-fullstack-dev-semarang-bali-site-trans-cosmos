"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";

import type { PaginatedResponse, Role, User } from "@/types";

export default function UsersPage() {
  const { canManageUsers, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member" as Role,
  });

  async function fetchUsers() {
    const response = await api.get<PaginatedResponse<User>>("/users");
    setUsers(response.data.data);
  }

  async function submitUser(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });

        Swal.fire("Updated", "User updated successfully", "success");
      } else {
        await api.post("/users", form);

        Swal.fire("Created", "User created successfully", "success");
      }

      resetForm();
      fetchUsers();
    } catch {
      Swal.fire("Error", "Failed to save user", "error");
    }
  }

  async function deleteUser(id: number) {
    const result = await Swal.fire({
      title: "Delete user?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/users/${id}`);
      Swal.fire("Deleted", "User deleted successfully", "success");
      fetchUsers();
    } catch {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
  }

  function resetForm() {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "member",
    });
  }

  useEffect(() => {
    if (canManageUsers) fetchUsers();
  }, [canManageUsers]);

  if (authLoading) return <div>Loading...</div>;

  if (!canManageUsers) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-soft">
        You do not have access to this page.
      </div>
    );
  }

  return (
    <>
      <Topbar title="Users" description="Admin area to manage system users." />

      <section className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={submitUser}
          className="rounded-2xl bg-white p-6 shadow-soft"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Plus className="h-5 w-5" />
            {editingUser ? "Edit User" : "Create User"}
          </h2>

          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              placeholder={editingUser ? "New password optional" : "Password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingUser}
            />

            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>

            <div className="flex gap-3">
              <Button type="submit">{editingUser ? "Update" : "Create"}</Button>

              {editingUser && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="cursor-pointer rounded-xl bg-slate-100 p-2 transition hover:bg-slate-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        className="cursor-pointer rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
