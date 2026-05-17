"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface FriendRequestRow {
  id: string;
  sender_id: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
}

export default function FriendRequestsPage() {
  const [requests, setRequests] = useState<FriendRequestRow[]>([]);
  const [message, setMessage] = useState("Loading incoming friend requests...");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setMessage("Unable to load friend requests.");
      setLoading(false);
      return;
    }

    const userId = sessionData.session.user.id;
    setCurrentUserId(userId);

    const { data, error } = await supabase
      .from("friend_requests")
      .select("id,sender_id,created_at,sender:sender_id(id,username,full_name,avatar_url)")
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setRequests(data || []);
    setMessage((data && data.length > 0) ? "" : "No incoming friend requests.");
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleRequest(id: string, senderId: string, accept: boolean) {
    if (!currentUserId) return;
    setLoading(true);

    const { error: updateError } = await supabase.from("friend_requests").update({ status: accept ? "accepted" : "declined" }).eq("id", id);
    if (updateError) {
      setMessage(updateError.message);
      setLoading(false);
      return;
    }

    if (accept) {
      const { error: friendError } = await supabase.from("friends").insert([
        { user_id: currentUserId, friend_id: senderId },
        { user_id: senderId, friend_id: currentUserId },
      ]);
      if (friendError) {
        setMessage(friendError.message);
        setLoading(false);
        return;
      }
    }

    loadRequests();
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
          <h1 className="text-3xl font-semibold">Friend Requests</h1>
          <p className="mt-2 text-slate-600">Review people who want to connect and decide whether to accept or decline.</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-lg shadow-slate-200">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-lg shadow-slate-200">{message}</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{request.sender[0]?.full_name || request.sender[0]?.username}</p>
                  <p className="mt-1 text-sm text-slate-600">@{request.sender[0]?.username}</p>
                  <p className="mt-3 text-sm text-slate-500">Sent {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <div className="mt-5 flex gap-3 sm:mt-0">
                  <button
                    onClick={() => handleRequest(request.id, request.sender_id, true)}
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequest(request.id, request.sender_id, false)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
