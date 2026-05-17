"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const PUBLIC_ROUTES = ["/login", "/signup"];

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData.session;
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      if (!hasSession && !isPublicRoute) {
        router.push("/login");
        return;
      }

      if (hasSession && isPublicRoute) {
        router.push("/");
        return;
      }
    }

    checkAuth();
  }, [pathname, router]);

  return <>{children}</>;
}
