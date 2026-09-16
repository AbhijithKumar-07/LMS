"use client";

/**
 * High-performance client-side cache helper for instant UI rendering across page refreshes.
 * Stores and hydrates data instantly to eliminate empty state flashing on cloud deployments.
 */

export function getLocalCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setLocalCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
  } catch {
    // Ignore storage quota limits
  }
}

export function removeLocalCache(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
