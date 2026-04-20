import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPICard } from "@/components/dashboard/KPICard";
import { Building2, DollarSign, Users, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoScanner } from "@/components/VideoScanner";
import { PlateHistoryByDate } from "@/components/PlateHistoryByDate";

const PLAN_PRICE: Record<string, number> = { starter: 0, pro: 29, business: 99 };

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, sb, o, m] = await Promise.all([
        supabase.from("shops").select("id,name,created_at"),
        supabase.from("subscriptions").select("id,shop_id,plan,status,monthly_price,current_period_end,created_at"),
        supabase.from("orders").select("id,shop_id,total_price,status,created_at"),
        supabase.from("shop_members").select("user_id,shop_id,created_at"),
      ]);
      setShops(s.data || []);
      setSubs(sb.data || []);
      setOrders(o.data || []);
      setMembers(m.data || []);
      setLoading(false);
    })();
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");
    const mrr = activeSubs.reduce((acc, s) => acc + Number(s.monthly_price ?? PLAN_PRICE[s.plan] ?? 0), 0);

    const totalUsers = new Set(members.map((m) => m.user_id)).size;

    const thisMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth()-1, 1));
    const newThis = shops.filter((s) => monthKey(new Date(s.created_at)) === thisMonth).length;
    const newLast = shops.filter((s) => monthKey(new Date(s.created_at)) === lastMonth).length;
    const growth = newLast === 0 ? (newThis > 0 ? 100 : 0) : ((newThis - newLast) / newLast) * 100;

    return { totalShops: shops.length, mrr, totalUsers, growth, newThis };
  }, [shops, subs, members]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      map.set(monthKey(d), 0);
    }
    subs.forEach((s) => {
      const k = monthKey(new Date(s.created_at));
      if (map.has(k)) map.set(k, (map.get(k) || 0) + Number(s.monthly_price ?? PLAN_PRICE[s.plan] ?? 0));
    });
    return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [subs]);

  const shopsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      map.set(monthKey(d), 0);
    }
    shops.forEach((s) => {
      const k = monthKey(new Date(s.created_at));
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([month, shops]) => ({ month, shops }));
  }, [shops]);

  const usersByMonth = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      map.set(monthKey(d), new Set());
    }
    members.forEach((m) => {
      const k = monthKey(new Date(m.created_at));
      if (map.has(k)) map.get(k)!.add(m.user_id);
    });
    return Array.from(map.entries()).map(([month, set]) => ({ month, users: set.size }));
  }, [members]);

  const topShops = useMemo(() => {
    const stats = new Map<string, { revenue: number; count: number }>();
    orders.forEach((o) => {
      if (o.status !== "completed") return;
      const cur = stats.get(o.shop_id) || { revenue: 0, count: 0 };
      cur.revenue += Number(o.total_price || 0);
      cur.count += 1;
      stats.set(o.shop_id, cur);
    });
    return shops
      .map((s) => ({ ...s, ...(stats.get(s.id) || { revenue: 0, count: 0 }) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders, shops]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (topShops[0]?.revenue > 0) out.push(`🏆 المتجر الأفضل أداءً: ${topShops[0].name} بإيرادات ${topShops[0].revenue.toLocaleString()} درهم`);
    const expiring = subs.filter((s) => {
      const days = (new Date(s.current_period_end).getTime() - Date.now()) / (1000*60*60*24);
      return days > 0 && days <= 7;
    }).length;
    if (expiring > 0) out.push(`⚠️ ${expiring} اشتراك ينتهي خلال أسبوع`);
    if (kpis.growth > 20) out.push(`🚀 نمو قوي: +${kpis.growth.toFixed(0)}% متاجر جديدة هذا الشهر`);
    else if (kpis.growth < -10) out.push(`📉 انخفاض ملحوظ في تسجيل المتاجر هذا الشهر`);
    if (out.length === 0) out.push("📊 النظام يعمل بشكل طبيعي. لا توجد تنبيهات.");
    return out;
  }, [topShops, subs, kpis]);

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">لوحة Super Admin</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">نظرة شاملة على المنصة بأكملها</p>
        </div>
        <Link to="/admin/subscriptions">
          <Button>إدارة الاشتراكات</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard label="إيرادات المنصة (MRR)" value={`${kpis.mrr.toLocaleString()} د.م`} icon={DollarSign} accent="success" loading={loading} />
        <KPICard label="إجمالي المتاجر" value={kpis.totalShops} icon={Building2} accent="primary" loading={loading} />
        <KPICard label="إجمالي المستخدمين" value={kpis.totalUsers} icon={Users} accent="info" loading={loading} />
        <KPICard label="النمو الشهري" value={`${kpis.growth.toFixed(1)}%`} icon={TrendingUp} trend={kpis.growth} trendLabel="مقارنة بالشهر الماضي" accent="accent" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">الإيرادات عبر الزمن</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">متاجر جديدة شهرياً</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={shopsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="shops" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">المستخدمون النشطون</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={usersByMonth}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#usersGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">🏆 أفضل المتاجر أداءً</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr className="border-b border-border">
                  <th className="text-right py-2 px-2">#</th>
                  <th className="text-right py-2 px-2">المتجر</th>
                  <th className="text-right py-2 px-2">الطلبات</th>
                  <th className="text-right py-2 px-2">الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {topShops.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">لا توجد بيانات بعد</td></tr>
                ) : topShops.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-bold">{i+1}</td>
                    <td className="py-2 px-2 font-medium">{s.name}</td>
                    <td className="py-2 px-2 tabular-nums">{s.count}</td>
                    <td className="py-2 px-2 tabular-nums font-semibold text-success">{s.revenue.toLocaleString()} د.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">رؤى ذكية</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {insights.map((ins, i) => (
              <li key={i} className="p-2 rounded-lg bg-background/50 border border-border/50">{ins}</li>
            ))}
          </ul>
        </div>
      </div>

      <VideoScanner />
      <PlateHistoryByDate />
    </div>
  );
}
