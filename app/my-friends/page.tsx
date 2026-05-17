"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export default function MyFriendsPage() {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [message, setMessage] = useState("Loading your friends...");
  const [loading, setLoading] = useState(true);

  async function loadFriends() {
    setLoading(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setMessage("Unable to load friends.");
      setLoading(false);
      return;
    }

    const userId = sessionData.session.user.id;
    const { data: friendLinks, error: friendsError } = await (supabase.from("friends") as any).select("friend_id").eq("user_id", userId);
    if (friendsError) {
      setMessage(friendsError.message);
      setLoading(false);
      return;
    }

    const friendIds = friendLinks?.map((friend: any) => friend.friend_id) ?? [];
    if (friendIds.length === 0) {
      setFriends([]);
      setMessage("You don't have any friends yet.");
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await (supabase.from("profiles") as any).select("*").in("id", friendIds);
    if (profilesError) {
      setMessage(profilesError.message);
      setLoading(false);
      return;
    }

    setFriends(profiles || []);
    setMessage("");
    setLoading(false);
  }

  useEffect(() => {
    loadFriends();
  }, []);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
          <h1 className="text-3xl font-semibold">My Friends</h1>
          <p className="mt-2 text-slate-600">All accepted friends are shown below. Tap a friend to start chatting.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-lg shadow-slate-200">Loading friends…</div>
        ) : friends.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-lg shadow-slate-200">{message}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/chat/${friend.id}`}
                className="group rounded-3xl bg-white p-6 shadow-lg shadow-slate-200 transition hover:-translate-y-1 hover:border hover:border-slate-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-xl font-semibold text-slate-700">
                    {friend.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{friend.full_name || friend.username}</p>
                    <p className="mt-1 text-sm text-slate-600">{friend.username}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">Open chat with {friend.full_name || friend.username}.</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
