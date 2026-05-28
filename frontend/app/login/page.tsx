"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("user1@example.com");

  const [password, setPassword] = useState("password");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      setError("");


      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem(
        "token",
        response.data.token
      );

      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Task Management
          </h1>

          <p className="mt-2 text-slate-500">
            Login to continue
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base"
          >
            {loading ? "Loading..." : "Login"}
          </Button>
        </div>
      </form>
    </main>
  );
}
