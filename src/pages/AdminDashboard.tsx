import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, DollarSign, Users, TrendingUp, Sparkles, FileText, Car, Zap, Package, Crown, CreditCard, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VideoScanner } from "@/components/VideoScanner";
import { PlateHistoryByDate } from "@/components/PlateHistoryByDate";

const PLAN_PRICE: Record<string, number> = { starter: 0, pro: 29, business: 99 };

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }

interface BigStatProps {
  label: string;
  value: string | number;
  icon: any;
  tone: "blue" | "orange" | "green" | "purple" | "yellow" | "cyan" | "pink";
  loading?: boolean;
}

const TONE_MAP: Record<BigStatProps["tone"], { fg: string; bg: string; ring: string }> = {
  blue:   { fg: "hsl(210 95% 65%)",  bg: "hsl(210 95% 55% / 0.12)",  ring: "hsl(210 95% 55% / 0.3)" },
  orange: { fg: "hsl(28 95% 65%)",   bg: "hsl(28 90% 55% / 0.12)",   ring: "hsl(28 90% 55% / 0.3)" },
  green:  { fg: "hsl(152 70% 55%)",  bg: "hsl(152 70% 48% / 0.12)",  ring: "hsl(152 70% 48% / 0.3)" },
  purple: { fg: "hsl(280 80% 70%)",  bg: "hsl(280 80% 65% / 0.12)",  ring: "hsl(280 80% 65% / 0.3)" },
  yellow: { fg: "hsl(48 95% 60%)",   bg: "hsl(48 95% 55% / 0.12)",   ring: "hsl(48 95% 55% / 0.3)" },
  cyan:   { fg: "hsl(190 95% 60%)",  bg: "hsl(190 95% 55% / 0.12)",  ring: "hsl(190 95% 55% / 0.3)" },
  pink:   { fg: "hsl(330 85% 65%)",  bg: "hsl(330 85% 60% / 0.12)",  ring: "hsl(330 85% 60% / 0.3)" },
};

function BigStat({ label, value, icon: Icon, tone, loading }: BigStatProps) {
  const c = TONE_MAP[tone];
  return (
    <div
      className="rounded-2xl bg-[hsl(220_25%_9%)] border p-5 md:p-6 transition hover:border-[hsl(220_20%_24%)] hover:shadow-[0_0_30px_-12px_var(--ring)] relative overflow-hidden"
      style={{ borderColor: "hsl(220 20% 16%)", ["--ring" as any]: c.ring }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-6"
        style={{ backgroundColor: c.bg, color: c.fg }}
      >
        <Icon className="w-[22px] h-[22px]" />
      </div>
      {loading ? (
        <div className="h-12 w-20 rounded-md skeleton-shimmer" />
      ) : (
        <h3 className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight text-foreground">{value}</h3>
      )}
      <p className="text-[13px] text-muted-foreground mt-2 font-medium">{label}</p>
      <span className="absolute -bottom-8 -end-8 w-24 h-24 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${c.fg} 0%, transparent 70%)` }} />
    </div>
  );
}

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
    const activeOrders = orders.filter((o) => o.status === "in_progress" || o.status === "waiting").length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    return { totalShops: shops.length, mrr, totalUsers, growth, activeOrders, completedOrders, activeSubs: activeSubs.length };
  }, [shops, subs, members, orders]);

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
    if (topShops[0]?.revenue > 0) out.push(`🏆 الأفضل: ${topShops[0].name} — ${topShops[0].revenue.toLocaleString()} د.م`);
    const expiring = subs.filter((s) => {
      const days = (new Date(s.current_period_end).getTime() - Date.now()) / (1000*60*60*24);
      return days > 0 && days <= 7;
    }).length;
    if (expiring > 0) out.push(`⚠️ ${expiring} اشتراك ينتهي خلال أسبوع`);
    if (kpis.growth > 20) out.push(`🚀 نمو قوي: +${kpis.growth.toFixed(0)}% متاجر هذا الشهر`);
    else if (kpis.growth < -10) out.push(`📉 انخفاض في تسجيل المتاجر هذا الشهر`);
    if (out.length === 0) out.push("📊 النظام يعمل بشكل طبيعي. لا توجد تنبيهات.");
    return out;
  }, [topShops, subs, kpis]);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-foreground">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(28_90%_55%)] to-[hsl(15_90%_50%)] shadow-[0_0_24px_-6px_hsl(28_90%_55%/0.6)]">
              <BarChart3 className="w-6 h-6 text-white" />
            </span>
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground mt-2 ms-14">{today}</p>
        </div>
        <Link to="/owner/subscriptions">
          <Button className="h-11 rounded-xl bg-gradient-to-r from-[hsl(28_90%_55%)] to-[hsl(15_90%_50%)] hover:opacity-90 text-white font-bold px-5 shadow-[0_8px_24px_-8px_hsl(28_90%_55%/0.6)]">
            إدارة الاشتراكات
          </Button>
        </Link>
      </div>

      {/* Big KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <BigStat label="Total des demandes" value={kpis.completedOrders + kpis.activeOrders} icon={FileText} tone="blue" loading={loading} />
        <BigStat label="Chauffeurs actifs" value={kpis.activeSubs} icon={Car} tone="orange" loading={loading} />
        <BigStat label="Trajets en cours" value={kpis.activeOrders} icon={Zap} tone="green" loading={loading} />
        <BigStat label="Livraison en attente" value={0} icon={Package} tone="purple" loading={loading} />
        <BigStat label="Livraison active" value={0} icon={Package} tone="cyan" loading={loading} />
        <BigStat label="اشتراكات السائقين" value={kpis.activeSubs} icon={Crown} tone="yellow" loading={loading} />
        <BigStat label="اشتراكات العملاء" value={kpis.totalUsers} icon={CreditCard} tone="pink" loading={loading} />
        <BigStat label="إيرادات (MRR)" value={`${kpis.mrr.toLocaleString()} د.م`} icon={DollarSign} tone="green" loading={loading} />
        <BigStat label="إجمالي المتاجر" value={kpis.totalShops} icon={Building2} tone="blue" loading={loading} />
        <BigStat label="النمو الشهري" value={`${kpis.growth.toFixed(1)}%`} icon={TrendingUp} tone="orange" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-[hsl(152_70%_55%)]" /> الإيرادات عبر الزمن</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 16%)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(220 25% 10%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "12px" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(28 95% 60%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(28 95% 60%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-[hsl(210_95%_65%)]" /> متاجر جديدة شهرياً</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={shopsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 16%)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(220 25% 10%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "12px" }} />
              <Bar dataKey="shops" fill="hsl(210 95% 60%)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5 lg:col-span-2">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-[hsl(280_80%_70%)]" /> المستخدمون النشطون</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={usersByMonth}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(280 80% 70%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(280 80% 70%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 16%)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(220 25% 10%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="users" stroke="hsl(280 80% 70%)" fill="url(#usersGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top shops + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5 lg:col-span-2">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Crown className="w-4 h-4 text-[hsl(48_95%_60%)]" /> أفضل المتاجر أداءً</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr className="border-b border-[hsl(220_20%_16%)]">
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
                  <tr key={s.id} className="border-b border-[hsl(220_20%_14%)] hover:bg-[hsl(220_25%_11%)] transition">
                    <td className="py-3 px-2 font-bold text-[hsl(28_95%_65%)]">{i+1}</td>
                    <td className="py-3 px-2 font-medium text-foreground">{s.name}</td>
                    <td className="py-3 px-2 tabular-nums">{s.count}</td>
                    <td className="py-3 px-2 tabular-nums font-bold text-[hsl(152_70%_55%)]">{s.revenue.toLocaleString()} د.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[hsl(28_90%_55%/0.12)] to-[hsl(15_90%_50%/0.05)] border border-[hsl(28_90%_55%/0.3)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[hsl(28_95%_65%)]" />
            <h3 className="font-bold text-foreground">رؤى ذكية</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {insights.map((ins, i) => (
              <li key={i} className="p-3 rounded-xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] text-foreground/90">{ins}</li>
            ))}
          </ul>
        </div>
      </div>

      <VideoScanner />
      <PlateHistoryByDate />
    </div>
  );
}
