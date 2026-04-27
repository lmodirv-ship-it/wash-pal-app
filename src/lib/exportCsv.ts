import { supabase } from "@/integrations/supabase/client";

type ExportType = "services" | "employees" | "work_entries" | "shops" | "audit_logs" | "subscriptions";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvCell(r[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export rows from one of the v_*_export views, scoped to a shop (RLS enforces this).
 * Owner may pass null to fetch all rows visible to them.
 * After download, an audit row is recorded via log_export_action().
 */
export async function exportFromView(opts: {
  view: "v_services_export" | "v_employees_export" | "v_work_entries_export";
  type: ExportType;
  shopId: string | null;
  filenamePrefix: string;
}): Promise<{ count: number }> {
  let q = supabase.from(opts.view).select("*").order("created_at", { ascending: false });
  if (opts.shopId) q = q.eq("shop_id", opts.shopId);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data as Record<string, unknown>[]) ?? [];
  const csv = rowsToCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`${opts.filenamePrefix}-${stamp}.csv`, csv || "no_data\n");
  // Best-effort audit log (don't block download on RPC failure)
  try {
    await supabase.rpc("log_export_action", {
      _shop_id: opts.shopId,
      _export_type: opts.type,
      _row_count: rows.length,
    });
  } catch {
    /* audit failure is non-fatal */
  }
  return { count: rows.length };
}

/** Audit-log a CSV export of generic rows (e.g. audit_logs themselves). */
export async function logExport(type: ExportType, shopId: string | null, count: number) {
  try {
    await supabase.rpc("log_export_action", {
      _shop_id: shopId,
      _export_type: type,
      _row_count: count,
    });
  } catch {
    /* non-fatal */
  }
}