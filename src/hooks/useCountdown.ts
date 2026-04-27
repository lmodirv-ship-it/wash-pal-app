import { useEffect, useState } from "react";

/**
 * Returns the remaining seconds between now and target ISO date.
 * Updates every second. Returns null when target is null/undefined.
 * Negative values mean overdue (kept negative so caller can decide UI).
 */
export function useCountdown(targetIso?: string | null): number | null {
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  return Math.round((target - now) / 1000);
}

/** Format seconds as `mm:ss` or `-mm:ss` if overdue. */
export function formatCountdown(secs: number | null): string {
  if (secs === null) return "—";
  const sign = secs < 0 ? "-" : "";
  const abs = Math.abs(secs);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}