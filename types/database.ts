/**
 * Database definitions for Supabase tables used by the social app.
 *
 * Recommended Supabase SQL schema and RLS policies:
 *
 * create table profiles (
 *   id uuid primary key,
 *   username text unique not null,
 *   full_name text,
 *   avatar_url text,
 *   created_at timestamp with time zone default now()
 * );
 *
 * create table friend_requests (
 *   id uuid primary key default gen_random_uuid(),
 *   sender_id uuid references profiles(id) not null,
 *   receiver_id uuid references profiles(id) not null,
 *   status text not null default 'pending',
 *   created_at timestamp with time zone default now()
 * );
 *
 * create table friends (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references profiles(id) not null,
 *   friend_id uuid references profiles(id) not null,
 *   created_at timestamp with time zone default now()
 * );
 *
 * create table messages (
 *   id uuid primary key default gen_random_uuid(),
 *   sender_id uuid references profiles(id) not null,
 *   receiver_id uuid references profiles(id) not null,
 *   content text not null,
 *   is_read boolean default false,
 *   created_at timestamp with time zone default now()
 * );
 *
 * -- Enable RLS
 * alter table profiles enable row level security;
 * alter table friend_requests enable row level security;
 * alter table friends enable row level security;
 * alter table messages enable row level security;
 *
 * -- Policies
 * create policy "Profiles: authenticated users can read" on profiles for select using (auth.role() = 'authenticated');
 * create policy "Profiles: owners can modify their row" on profiles for update using (auth.uid() = id);
 * create policy "Profiles: owners can insert their row" on profiles for insert with check (auth.uid() = id);
 *
 * create policy "Friend requests: sender or receiver can read" on friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
 * create policy "Friend requests: sender can create" on friend_requests for insert with check (auth.uid() = sender_id);
 * create policy "Friend requests: receiver can accept or decline" on friend_requests for update using (auth.uid() = receiver_id);
 *
 * create policy "Friends: users can read their friends" on friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
 * create policy "Friends: user can create friend connections" on friends for insert with check (auth.uid() = user_id);
 *
 * create policy "Messages: sender or receiver can read" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
 * create policy "Messages: sender can send" on messages for insert with check (auth.uid() = sender_id);
 * create policy "Messages: sender or receiver can update read state" on messages for update using (auth.uid() = sender_id or auth.uid() = receiver_id);
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Update: {
          sender_id?: string;
          receiver_id?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FriendRequest = Database["public"]["Tables"]["friend_requests"]["Row"];
export type Friend = Database["public"]["Tables"]["friends"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
