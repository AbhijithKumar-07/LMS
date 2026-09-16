"use client";

import type { AuthResponse, User } from "@/types";

const tokenKey = "lms_token";
const userKey = "lms_user";

export function saveAuth(auth: AuthResponse) {
  try {
    sessionStorage.setItem(tokenKey, auth.token);
    sessionStorage.setItem(userKey, JSON.stringify(auth.user));
    localStorage.setItem(tokenKey, auth.token);
    localStorage.setItem(userKey, JSON.stringify(auth.user));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lms_auth_changed"));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAuth() {
  try {
    sessionStorage.clear();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("lms_") || k === "token" || k === "user")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lms_auth_changed"));
    }
  } catch {
    // Ignore
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey);
  } catch {
    return null;
  }
}

export function getUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = sessionStorage.getItem(userKey) || localStorage.getItem(userKey);
    if (!value || value === "undefined" || value === "null") {
      return null;
    }
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}
