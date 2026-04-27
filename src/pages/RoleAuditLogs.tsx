import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, RefreshCw, Download } from "lucide-react";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { rowsToCsv, downloadCsv, logExport } from "@/lib/exportCsv";
import { toast } from "sonner";

type LogRow = {
  id: string;
  target_user_id: string;
  changed_by: string | null;
  source_table: string;
  old_role: string | null;
  new_role: string | null;
  action: string;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-success/10 text-success border-success/30",
  UPDATE: "bg-warning/10 text-warning border-warning/30",
  DELETE: "bg-destructive/10 text-destructive border-destructive/30",
};
const PAGE_SIZE = 50;

export default function RoleAuditLogs() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["owner-role-audit-logs", page],
    staleTime: 45_000,
    queryFn: async ({ signal }) => {
      const { data, count, error } = await supabase
        .from("role_audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
        .abortSignal(signal);
      if (error) throw error;
      return { rows: (data || []) as LogRow[], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCsv = async () => {
    const csv = rowsToCsv(rows as any);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`role-audit-logs-${stamp}.csv`, csv || "no_data\n");
    await logExport("audit_logs", null, rows.length);
    toast.success(`تم تصدير ${rows.length} سجل`);
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ScrollText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل تدقيق الأدوار</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString("ar-MA")} حدث من قاعدة البيانات</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCsv} variant="outline" className="gap-2" disabled={rows.length === 0}>
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
          <Button onClick={() => refetch()} variant="outline" className="gap-2" disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> تحديث
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          فشل تحميل سجل الأدوار. <Button variant="outline" size="sm" onClick={() => refetch()} className="ms-2">إعادة المحاولة</Button>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="لا توجد أحداث" description="لم يتم تسجيل أي تغيير للأدوار حتى الآن" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card/70">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start p-3 font-semibold">التاريخ</th>
                  <th className="text-start p-3 font-semibold">المصدر</th>
                  <th className="text-start p-3 font-semibold">الإجراء</th>
                  <th className="text-start p-3 font-semibold">من</th>
                  <th className="text-start p-3 font-semibold">إلى</th>
                  <th className="text-start p-3 font-semibold">المستخدم المستهدف</th>
                  <th className="text-start p-3 font-semibold">من قام بالتغيير</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/70 hover:bg-muted/30">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString("ar")}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{r.source_table}</Badge></td>
                    <td className="p-3"><Badge variant="outline" className={ACTION_COLORS[r.action] || ""}>{r.action}</Badge></td>
                    <td className="p-3 text-muted-foreground">{r.old_role || "—"}</td>
                    <td className="p-3 font-semibold text-foreground">{r.new_role || "—"}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{r.target_user_id.slice(0, 8)}…</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{r.changed_by ? r.changed_by.slice(0, 8) + "…" : "system"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>صفحة {(page + 1).toLocaleString("ar-MA")} من {pageCount.toLocaleString("ar-MA")}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0 || isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>السابق</Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= pageCount || isFetching} onClick={() => setPage((p) => p + 1)}>التالي</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
