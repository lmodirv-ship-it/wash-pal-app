/**
 * Lightweight client metadata for audit logs.
 * IP is intentionally NOT collected client-side (untrustworthy + adds a 3rd-party request).
 * The DB/edge layer is the right place to capture the real source IP if needed.
 */
export function getClientMeta(): { user_agent: string | null; ip: null } {
  return {
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    ip: null,
  };
}