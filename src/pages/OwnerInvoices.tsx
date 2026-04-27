import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, RefreshCw, Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { rowsToCsv, downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Inv = {
  id: string; order_id: string; shop_id: string; branch_id: string;
  customer_name: string; total_amount: number; paid_amount: number;
  is_paid: boolean; created_at: string;
};

const PAGE_SIZE = 50;

export default function OwnerInvoices() {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [paid, setPaid] = useState("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["owner_invoices", page, q, paid],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("id,order_id,shop_id,branch_id,customer_name,total_amount,paid_amount,is_paid,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (paid !== "all") query = query.eq("is_paid", paid === "paid");
      if (q.trim()) query = query.ilike("customer_name", `%${q.trim()}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data || []) as Inv[], count: count || 0 };
    },
  });

  const exportCsv = async () => {
    try {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      const csv = rowsToCsv((data || []) as any);
      downloadCsv(`invoices_${new Date().toISOString().slice(0, 10)}.csv`, csv);
      await supabase.rpc("log_export_action" as any, { _shop_id: null, _export_type: "audit_logs", _row_count: (data || []).length });
      toast.success(`تم تصدير ${(data || []).length} فاتورة`);
    } catch (e: any) { toast.error(e.message); }
  };

  const rows = data?.rows || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));
  const totals = rows.reduce((acc, r) => ({ amt: acc.amt + Number(r.total_amount), paid: acc.paid + Number(r.paid_amount) }), { amt: 0, paid: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-400" />
            الفواتير (عالمي)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">كل الفواتير عبر جميع المتاجر.</p>
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-[hsl(220_25%_9%)] border border-amber-500/10 p-3">
          <div className="text-[11px] text-muted-foreground">إجمالي الصفحة</div>
          <div className="text-lg font-bold">{totals.amt.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-[hsl(220_25%_9%)] border border-amber-500/10 p-3">
          <div className="text-[11px] text-muted-foreground">المدفوع الصفحة</div>
          <div className="text-lg font-bold text-emerald-400">{totals.paid.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-[hsl(220_25%_9%)] border border-amber-500/10 p-3">
          <div className="text-[11px] text-muted-foreground">عدد الفواتير</div>
          <div className="text-lg font-bold">{data?.count || 0}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setPage(0); setQ(e.target.value); }} placeholder="بحث بالعميل..." className="pr-9" />
        </div>
        <Select value={paid} onValueChange={(v) => { setPage(0); setPaid(v); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="paid">مدفوعة</SelectItem>
            <SelectItem value="unpaid">غير مدفوعة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-amber-500/10 bg-[hsl(220_25%_9%)] overflow-hidden">
        {isLoading ? <TableSkeleton rows={8} /> : rows.length === 0 ? (
          <EmptyState icon={Receipt} title="لا توجد فواتير" description="لا فواتير تطابق الفلتر." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-black/20 text-right text-muted-foreground">
                <tr>
                  <th className="p-2">التاريخ</th>
                  <th className="p-2">العميل</th>
                  <th className="p-2">الإجمالي</th>
                  <th className="p-2">المدفوع</th>
                  <th className="p-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(i => (
                  <tr key={i.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-2 text-muted-foreground whitespace-nowrap">{new Date(i.created_at).toLocaleString("ar")}</td>
                    <td className="p-2 truncate max-w-[200px]">{i.customer_name}</td>
                    <td className="p-2">{Number(i.total_amount).toFixed(2)}</td>
                    <td className="p-2">{Number(i.paid_amount).toFixed(2)}</td>
                    <td className="p-2">
                      <Badge variant={i.is_paid ? "default" : "outline"} className={i.is_paid ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : ""}>
                        {i.is_paid ? "مدفوعة" : "غير مدفوعة"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{data?.count || 0} فاتورة</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="px-3 py-1.5">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      </div>
    </div>
  );
}
