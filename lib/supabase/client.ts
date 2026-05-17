import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseInstance() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables not configured");
      return null;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export const supabase = new Proxy(
  {},
  {
    get(target, prop) {
      const instance = getSupabaseInstance();
      if (!instance) {
        throw new Error(
          "Supabase is not initialized. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
      }
      return (instance as any)[prop];
    },
  }
) as ReturnType<typeof createClient>;

export const authCookieNames = {
  accessToken: "supabase_access_token",
  refreshToken: "supabase_refresh_token",
};


