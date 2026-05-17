"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function setAuthCookies(accessToken: string, refreshToken: string, expiresIn: number) {
  const expiry = new Date(Date.now() + expiresIn * 1000).toUTCString();
  document.cookie = `supabase_access_token=${accessToken}; path=/; expires=${expiry}; sameSite=lax`;
  document.cookie = `supabase_refresh_token=${refreshToken}; path=/; expires=${expiry}; sameSite=lax`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Please sign in with your email and password.");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("Signing in...");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session?.access_token && data.session.refresh_token) {
      setAuthCookies(data.session.access_token, data.session.refresh_token, data.session.expires_in ?? 3600);
      router.push("/");
      return;
    }

    setMessage("Check your email for confirmation or try logging in again.");
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Access your social feed, friends, and chat.</p>
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">{message}</p>
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
            Create one.
          </Link>
        </p>
      </div>
    </div>
  );
}
