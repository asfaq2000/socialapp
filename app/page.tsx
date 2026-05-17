"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export default function HomePage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading users...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setMessage("Unable to load users. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = sessionData.session.user.id;
    setCurrentUserId(userId);

    const [profilesResult, requestsResult, friendsResult] = await Promise.all([
      supabase.from("profiles").select("*").neq("id", userId).order("created_at", { ascending: false }),
      supabase.from("friend_requests").select("receiver_id,status").eq("sender_id", userId).in("status", ["pending", "accepted"]),
      supabase.from("friends").select("friend_id").eq("user_id", userId),
    ]);

    if (profilesResult.error) {
      setMessage(profilesResult.error.message);
      setLoading(false);
      return;
    }

    setUsers(profilesResult.data ?? []);
    setSentRequests((requestsResult.data ?? []).map((request) => request.receiver_id));
    setFriends((friendsResult.data ?? []).map((friend) => friend.friend_id));
    setMessage("Explore everyone in your network and send a friend request.");
    setLoading(false);
  }

  async function sendFriendRequest(receiverId: string) {
    if (!currentUserId) return;
    setLoading(true);
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: currentUserId,
      receiver_id: receiverId,
      status: "pending",
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setSentRequests((current) => [...current, receiverId]);
    setMessage("Friend request sent.");
    setLoading(false);
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
          <h1 className="text-3xl font-semibold">People nearby</h1>
          <p className="mt-2 text-slate-600">Browse users and send friend requests to start chatting.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-lg shadow-slate-200">{message}</div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-lg shadow-slate-200">No other users are available yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => {
              const isFriend = friends.includes(user.id);
              const requested = sentRequests.includes(user.id);
              return (
                <div key={user.id} className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-xl font-semibold text-slate-700">
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{user.full_name || user.username}</p>
                      <p className="text-sm text-slate-600">@{user.username}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                  <button
                    type="button"
                    onClick={() => sendFriendRequest(user.id)}
                    disabled={isFriend || requested}
                    className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${isFriend ? "bg-emerald-500 text-white" : requested ? "bg-slate-300 text-slate-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                  >
                    {isFriend ? "Friends" : requested ? "Requested" : "Send Friend Request"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
