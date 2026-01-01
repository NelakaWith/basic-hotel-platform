"use client";

import { useCallback, useMemo } from "react";

const DEFAULT_API_BASE = "http://localhost:4000/api";

type RequestOptions = RequestInit & {
  authToken?: string | null;
};

type ApiClient = {
  request: <T = unknown>(path: string, options?: RequestOptions) => Promise<T>;
  getHotels: <T = { hotels: unknown[] }>(
    options?: RequestOptions
  ) => Promise<T>;
};

export function useApi(): ApiClient {
  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE,
    []
  );

  const request = useCallback(
    async <T = unknown>(path: string, options: RequestOptions = {}) => {
      const { authToken, headers, ...rest } = options;
      const mergedHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(headers as Record<string, string> | undefined),
      };
      if (authToken) {
        mergedHeaders.Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch(`${baseUrl}${path}`, {
        ...rest,
        headers: mergedHeaders,
      });

      if (!res.ok) {
        const message = await safeErrorMessage(res);
        throw new Error(message || `Request failed (${res.status})`);
      }

      // Handle empty responses
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [baseUrl]
  );

  const getHotels: ApiClient["getHotels"] = useCallback(
    (options) => request("/hotels", options),
    [request]
  );

  return {
    request,
    getHotels,
  };
}

async function safeErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    if (data?.error) return data.error as string;
  } catch (err) {
    // ignore JSON parse errors
  }
  return null;
}
