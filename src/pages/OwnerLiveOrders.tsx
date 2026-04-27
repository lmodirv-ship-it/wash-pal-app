import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Order = {
  id: string; reference: string | null; shop_id: string; branch_id: string;
  customer_name: string; car_plate: string; status: string; total_price: number;
  start_at: string; expected_end_at: string | null; created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function OwnerLiveOrders() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["owner_live_orders", q, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("id,reference,shop_id,branch_id,customer_name,car_plate,status,total_price,start_at,expected_end_at,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter === "active") query = query.in("status", ["waiting", "in_progress"]);
      else if (statusFilter !== "all") query = query.eq("status", statusFilter);

      if (q.trim()) {
        const t = `%${q.trim()}%`;
        query = query.or(`customer_name.ilike.${t},car_plate.ilike.${t},reference.ilike.${t}`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data || []) as Order[], count: count || 0 };
    },
    refetchInterval: 15000,
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("owner_live_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const rows = data?.rows || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-400" />
            الطلبات المباشرة (عالمي)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">تحديث حي كل 15 ثانية + Realtime. لكل المتاجر.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ml-1 ${isFetching ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: عميل / لوحة / رقم..." className="pr-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">قيد التنفيذ</SelectItem>
            <SelectItem value="waiting">انتظار</SelectItem>
            <SelectItem value="in_progress">جارية</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
            <SelectItem value="all">الكل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-amber-500/10 bg-[hsl(220_25%_9%)] overflow-hidden">
        {isLoading ? <TableSkeleton rows={8} /> : rows.length === 0 ? (
          <EmptyState icon={Activity} title="لا توجد طلبات" description="لا توجد طلبات تطابق الفلتر." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-black/20 text-right text-muted-foreground">
                <tr>
                  <th className="p-2">المرجع</th>
                  <th className="p-2">العميل</th>
                  <th className="p-2">اللوحة</th>
                  <th className="p-2">الحالة</th>
                  <th className="p-2">المبلغ</th>
                  <th className="p-2">البدء</th>
                  <th className="p-2">المتوقع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(o => (
                  <tr key={o.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-2 font-mono">{o.reference || "—"}</td>
                    <td className="p-2 truncate max-w-[160px]">{o.customer_name}</td>
                    <td className="p-2 font-mono">{o.car_plate}</td>
                    <td className="p-2"><Badge className={STATUS_COLORS[o.status] || ""}>{o.status}</Badge></td>
                    <td className="p-2">{Number(o.total_price).toFixed(2)}</td>
                    <td className="p-2 text-muted-foreground whitespace-nowrap">{new Date(o.start_at).toLocaleString("ar")}</td>
                    <td className="p-2 text-muted-foreground whitespace-nowrap">{o.expected_end_at ? new Date(o.expected_end_at).toLocaleTimeString("ar") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{data?.count || 0} طلب — معروض {rows.length}</div>
    </div>
  );
}
