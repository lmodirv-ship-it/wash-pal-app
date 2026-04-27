import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, RefreshCw, Download, Search } from "lucide-react";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { rowsToCsv, downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Row = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  old_value: any;
  new_value: any;
  metadata: any;
  created_at: string;
};

const PAGE_SIZE = 50;

export default function OwnerAuditLogs() {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["owner_audit_logs", page, q, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(`action.ilike.${term},actor_email.ilike.${term},target_type.ilike.${term},target_id.ilike.${term}`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data || []) as Row[], count: count || 0 };
    },
  });

  const exportCsv = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      const csv = rowsToCsv((data || []) as any);
      downloadCsv(`audit_logs_${new Date().toISOString().slice(0, 10)}.csv`, csv);
      await supabase.rpc("log_export_action" as any, {
        _shop_id: null, _export_type: "audit_logs", _row_count: (data || []).length,
      });
      toast.success(`تم تصدير ${(data || []).length} صف`);
    } catch (e: any) { toast.error(e.message); }
  };

  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));
  const rows = data?.rows || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            سجل التدقيق
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            كل العمليات الحساسة على المنصة (تصدير، تجميد، أدوار، إعلانات...).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ml-1 ${isFetching ? "animate-spin" : ""}`} /> تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 ml-1" /> تصدير CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setPage(0); setQ(e.target.value); }} placeholder="بحث: action / email / target..." className="pr-9" />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setPage(0); setActionFilter(v); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأحداث</SelectItem>
            <SelectItem value="export.csv">تصدير CSV</SelectItem>
            <SelectItem value="shop.suspend">تجميد متجر</SelectItem>
            <SelectItem value="shop.unsuspend">إلغاء التجميد</SelectItem>
            <SelectItem value="owner.set_role">تغيير دور</SelectItem>
            <SelectItem value="owner.broadcast">إعلان جماعي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-amber-500/10 bg-[hsl(220_25%_9%)] overflow-hidden">
        {isLoading ? <TableSkeleton rows={8} /> : rows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="لا توجد سجلات" description="لم يتم تسجيل أي عملية بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-black/20">
                <tr className="text-right text-muted-foreground">
                  <th className="p-2">التاريخ</th>
                  <th className="p-2">الإجراء</th>
                  <th className="p-2">المنفّذ</th>
                  <th className="p-2">الهدف</th>
                  <th className="p-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-2 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</td>
                    <td className="p-2"><Badge variant="outline" className="font-mono">{r.action}</Badge></td>
                    <td className="p-2 truncate max-w-[180px]">{r.actor_email || "—"}</td>
                    <td className="p-2 font-mono text-[11px] truncate max-w-[200px]">{r.target_type}:{r.target_id}</td>
                    <td className="p-2 font-mono text-[11px]">{r.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{data?.count || 0} سجل</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="px-3 py-1.5">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      </div>
    </div>
  );
}
