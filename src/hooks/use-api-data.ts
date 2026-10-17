"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/client-api";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorCode?: string;
  reload: () => Promise<void>;
}

export function useApiData<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    // Yield first so state updates are not synchronous within an effect.
    await Promise.resolve();

    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(undefined);

    try {
      const result = await apiFetch<T>(url);
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) {
        if (err instanceof ApiRequestError) {
          setError(err.message);
          setErrorCode(err.code);
        } else {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [load]);

  return { data, loading, error, errorCode, reload: load };
}
