"use client";

const AUTH_KEY = "auth/session";

type AuthUser = {
  id: number;
  username: string;
};

export type AuthSession = {
  user: AuthUser;
};

export function getAuth(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession & { token?: string }>;
    if (parsed && parsed.user) {
      return { user: parsed.user };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function setAuth(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
}
