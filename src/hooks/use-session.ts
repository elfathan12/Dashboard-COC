"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

export interface SessionInfo {
  email: string;
}

export function useSession() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<{ email: string }>("/api/auth/session")
      .then((data) => {
        if (active) setSession({ email: data.email });
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { session, loading };
}
