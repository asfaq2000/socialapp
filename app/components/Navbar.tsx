"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "supabase_access_token=; path=/; max-age=0";
    document.cookie = "supabase_refresh_token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold text-slate-900 hover:text-slate-700">
          Social App
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          <Link href="/" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100">
            Home
          </Link>
          <Link href="/friends" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100">
            Friend Requests
          </Link>
          <Link href="/my-friends" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100">
            My Friends
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
