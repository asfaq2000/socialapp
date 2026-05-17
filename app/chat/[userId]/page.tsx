"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile, Message } from "@/types/database";

interface ChatPageProps {
  params: {
    userId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const [friend, setFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [errorMessage, setErrorMessage] = useState("Loading conversation...");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            (newMessage.sender_id === currentUserId && newMessage.receiver_id === params.userId) ||
            (newMessage.sender_id === params.userId && newMessage.receiver_id === currentUserId)
          ) {
            setMessages((current) => [...current, newMessage]);
          }
        }
      );

    void channel.subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, [currentUserId, params.userId]);

  useEffect(() => {
    async function loadChat() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setErrorMessage("Unable to authenticate user.");
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;
      setCurrentUserId(userId);

      const [{ data: friendData, error: friendError }, { data: messageData, error: messagesError }] = await Promise.all([
        (supabase.from("profiles") as any).select("*").eq("id", params.userId).single(),
        (supabase
          .from("messages") as any)
          .select("*")
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${userId})`)
          .order("created_at", { ascending: true }),
      ]);

      if (friendError || !friendData) {
        setErrorMessage("Unable to load chat participant.");
        setLoading(false);
        return;
      }

      if (messagesError) {
        setErrorMessage(messagesError.message);
      }

      setFriend(friendData);
      setMessages(messageData || []);
      setErrorMessage("");
      setLoading(false);
    }

    loadChat();
  }, [params.userId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageText.trim() || !currentUserId) return;
    const content = messageText.trim();

    const { error } = await (supabase.from("messages") as any).insert({
      sender_id: currentUserId,
      receiver_id: params.userId,
      content,
      is_read: false,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessageText("");
  }

  const friendName = useMemo(() => friend?.full_name || friend?.username || "Chat", [friend]);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
          <h1 className="text-3xl font-semibold">Chat with {friendName}</h1>
          <p className="mt-2 text-slate-600">Messages appear instantly for both sides of the conversation.</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200">
          {loading ? (
            <div className="text-slate-600">{errorMessage || "Loading conversation..."}</div>
          ) : errorMessage ? (
            <div className="text-red-600">{errorMessage}</div>
          ) : (
            <div className="space-y-6">
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                {messages.length === 0 ? (
                  <div className="rounded-3xl bg-slate-100 p-6 text-slate-600">No messages yet. Say hello!</div>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_id === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm ${mine ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                          <p>{message.content}</p>
                          <p className="mt-2 text-right text-[11px] text-slate-500">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={`Message ${friendName}`}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
