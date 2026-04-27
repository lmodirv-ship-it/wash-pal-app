import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/PageSkeleton";
import { rowsToCsv, downloadCsv, logExport } from "@/lib/exportCsv";
import { toast } from "sonner";

interface Attempt {
  id: string;
  admin_email: string;
  ip_address: string | null;
  intruder_photo: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

export default function OwnerSecurity() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["owner-security-login-attempts", page],
    staleTime: 45_000,
    queryFn: async ({ signal }) => {
      const { data, count, error } = await supabase
        .from("login_attempts")
        .select("id,admin_email,ip_address,intruder_photo,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
        .abortSignal(signal);
      if (error) throw error;
      return { rows: (data || []) as Attempt[], count: count ?? 0 };
    },
  });

  const attempts = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCsv = async () => {
    try {
      const csv = rowsToCsv(attempts as any);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`login-attempts-${stamp}.csv`, csv || "no_data\n");
      await logExport("audit_logs", null, attempts.length);
      toast.success(`تم تصدير ${attempts.length} سجل`);
    } catch (e: any) {
      toast.error(e?.message ?? "فشل التصدير");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-warning" />
            مركز الأمان
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total.toLocaleString("ar-MA")} محاولة دخول مسجلة في قاعدة البيانات.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCsv} variant="outline" className="gap-2" disabled={attempts.length === 0}>
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
          <Button onClick={() => refetch()} variant="outline" className="gap-2" disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> تحديث
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="text-xs text-muted-foreground mb-2">إجمالي المحاولات</div>
          <div className="text-3xl font-bold tabular-nums">{total.toLocaleString("ar-MA")}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="text-xs text-muted-foreground mb-2">صور دخيل في الصفحة</div>
          <div className="text-3xl font-bold tabular-nums text-destructive">{attempts.filter((a) => a.intruder_photo).length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="text-xs text-muted-foreground mb-2">عناوين IP فريدة في الصفحة</div>
          <div className="text-3xl font-bold tabular-nums">{new Set(attempts.map((a) => a.ip_address).filter(Boolean)).size}</div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          فشل تحميل محاولات الدخول. <Button variant="outline" size="sm" onClick={() => refetch()} className="ms-2">إعادة المحاولة</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-semibold">سجل محاولات الدخول</h3>
          </div>
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={8} /></div>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">لا توجد محاولات مسجلة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold">البريد</th>
                    <th className="text-right px-4 py-3 font-semibold">IP</th>
                    <th className="text-right px-4 py-3 font-semibold">صورة</th>
                    <th className="text-right px-4 py-3 font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-b border-border/70 hover:bg-muted/30">
                      <td className="px-4 py-3">{a.admin_email}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.ip_address || "—"}</td>
                      <td className="px-4 py-3">{a.intruder_photo ? <span className="text-destructive text-xs">📷 موجودة</span> : <span className="text-muted-foreground text-xs">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ar-MA")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
