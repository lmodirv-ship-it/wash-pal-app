import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "hl_referral_code";

/**
 * Detects ?ref=CODE in the URL, stores it in localStorage,
 * and tracks a click event server-side. Call once in App.
 */
export function useReferralTracking() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;
    const cleaned = code.trim().toUpperCase().slice(0, 32);
    if (!/^[A-Z0-9]+$/.test(cleaned)) return;

    try {
      localStorage.setItem(STORAGE_KEY, cleaned);
      localStorage.setItem(STORAGE_KEY + "_at", String(Date.now()));
    } catch {}

    // Fire-and-forget click tracking
    supabase.rpc("track_referral_click", { _code: cleaned }).then(() => {});
  }, []);
}

export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + "_at");
  } catch {}
}