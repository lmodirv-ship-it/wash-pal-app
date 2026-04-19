import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

const PLAN_PRICE: Record<string, number> = { starter: 0, pro: 29, business: 99 };

function statusBadge(status: string, periodEnd: string) {
  const expired = new Date(periodEnd).getTime() < Date.now();
  const effective = expired && status !== "canceled" ? "expired" : status;
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    active:    { label: "نشط",     cls: "bg-success/15 text-success border-success/30", Icon: CheckCircle2 },
    trialing:  { label: "تجربة",    cls: "bg-info/15 text-info border-info/30",         Icon: Clock },
    expired:   { label: "منتهي",   cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: XCircle },
    canceled:  { label: "ملغى",    cls: "bg-muted text-muted-foreground border-border",  Icon: XCircle },
  };
  const m = map[effective] || map.active;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${m.cls}`}>
      <m.Icon className="w-3 h-3" />{m.label}
    </span>
  );
}

export default function AdminSubscriptions() {
  const [rows, setRows] = useState<any[]>([]);
  const [shops, setShops] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const [s, sh] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("shops").select("id,name"),
    ]);
    setRows(s.data || []);
    const map: Record<string, string> = {};
    (sh.data || []).forEach((x: any) => (map[x.id] = x.name));
    setShops(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    load();
  };

  const extend = async (row: any, days: number) => {
    const newEnd = new Date(Math.max(Date.now(), new Date(row.current_period_end).getTime()));
    newEnd.setDate(newEnd.getDate() + days);
    await update(row.id, { current_period_end: newEnd.toISOString(), status: "active" });
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (shops[r.shop_id] || "").toLowerCase().includes(q));
  }, [rows, filter, shops]);

  const stats = useMemo(() => {
    const now = Date.now();
    const expiring = rows.filter((r) => {
      const t = new Date(r.current_period_end).getTime();
      return t > now && t - now <= 7 * 24 * 3600 * 1000;
    }).length;
    const active = rows.filter((r) => r.status === "active").length;
    const trial = rows.filter((r) => r.status === "trialing").length;
    const expired = rows.filter((r) => r.status === "expired" || new Date(r.current_period_end).getTime() < now).length;
    return { active, trial, expired, expiring };
  }, [rows]);

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">الاشتراكات</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">نشط</p>
          <p className="text-2xl font-bold text-success">{stats.active}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">تجربة</p>
          <p className="text-2xl font-bold text-info">{stats.trial}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">منتهي</p>
          <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" />ينتهي قريباً</p>
          <p className="text-2xl font-bold text-warning">{stats.expiring}</p>
        </div>
      </div>

      <Input placeholder="ابحث عن متجر..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-right py-3 px-3">المتجر</th>
              <th className="text-right py-3 px-3">الباقة</th>
              <th className="text-right py-3 px-3">الحالة</th>
              <th className="text-right py-3 px-3">السعر/شهر</th>
              <th className="text-right py-3 px-3">ينتهي في</th>
              <th className="text-right py-3 px-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد اشتراكات</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                <td className="py-2 px-3 font-medium">{shops[r.shop_id] || r.shop_id.slice(0,8)}</td>
                <td className="py-2 px-3">
                  <Select value={r.plan} onValueChange={(v) => update(r.id, { plan: v, monthly_price: PLAN_PRICE[v] })}>
                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-3">{statusBadge(r.status, r.current_period_end)}</td>
                <td className="py-2 px-3 tabular-nums">${Number(r.monthly_price).toFixed(0)}</td>
                <td className="py-2 px-3 tabular-nums text-xs">
                  {new Date(r.current_period_end).toLocaleDateString("ar-MA")}
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => extend(r, 30)}>+30 يوم</Button>
                    {r.status !== "canceled" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => update(r.id, { status: "canceled" })}>إلغاء</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
