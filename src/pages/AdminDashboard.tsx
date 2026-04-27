import { memo, useCallback, useMemo, useState } from "react";
import { Building2, DollarSign, Users, TrendingUp, Sparkles, FileText, Zap, Package, Crown, CreditCard, BarChart3, Download, ChevronDown, Eye, Pause, Play } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VideoScanner } from "@/components/VideoScanner";
import { PlateHistoryByDate } from "@/components/PlateHistoryByDate";
import { DateRangeFilter, buildPresetRange, type DateRange } from "@/components/DateRangeFilter";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { rowsToCsv, downloadCsv, logExport } from "@/lib/exportCsv";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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

const RevenueChart = memo(function RevenueChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--warning))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--warning))" }} />
      </LineChart>
    </ResponsiveContainer>
  );
});

const ShopsChart = memo(function ShopsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
        <Bar dataKey="shops" fill="hsl(var(--primary))" radius={[8,8,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const UsersChart = memo(function UsersChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
        <Area type="monotone" dataKey="users" stroke="hsl(var(--accent))" fill="url(#usersGrad)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default function AdminDashboard() {
  const [range, setRange] = useState<DateRange>(() => buildPresetRange("30d"));
  const { loading, isFetching, error, refetch, shops, subs, orders, kpis, series, topShops } = useDashboardMetrics(range);

  const downloadShops = useCallback(async () => {
    const rows = shops.map((s) => ({
      id: s.id, name: s.name, created_at: s.created_at, suspended: s.suspended,
    }));
    const csv = rowsToCsv(rows);
    const stamp = new Date().toISOString().slice(0,10);
    downloadCsv(`shops-${stamp}.csv`, csv || "no_data\n");
    await logExport("shops", null, rows.length);
    toast.success(`تم تصدير ${rows.length} متجر`);
  }, [shops]);

  const downloadOrders = useCallback(async () => {
    const rows = orders.map((o) => ({
      id: o.id, shop_id: o.shop_id, status: o.status,
      total_price: o.total_price, created_at: o.created_at, completed_at: o.completed_at,
    }));
    const csv = rowsToCsv(rows);
    const stamp = new Date().toISOString().slice(0,10);
    downloadCsv(`orders-${stamp}.csv`, csv || "no_data\n");
    // 'orders' is not in the allowed export_type enum of log_export_action;
    // record under 'work_entries' (operational data) so the audit row still lands.
    await logExport("work_entries", null, rows.length);
    toast.success(`تم تصدير ${rows.length} طلب`);
  }, [orders]);

  const downloadSubs = useCallback(async () => {
    const rows = subs.map((s) => ({
      id: s.id, shop_id: s.shop_id, plan: s.plan, status: s.status,
      monthly_price: s.monthly_price, current_period_end: s.current_period_end, created_at: s.created_at,
    }));
    const csv = rowsToCsv(rows);
    const stamp = new Date().toISOString().slice(0,10);
    downloadCsv(`subscriptions-${stamp}.csv`, csv || "no_data\n");
    await logExport("subscriptions", null, rows.length);
    toast.success(`تم تصدير ${rows.length} اشتراك`);
  }, [subs]);

  const downloadTopShops = useCallback(async () => {
    const rows = topShops.map((t, i) => ({
      rank: i+1, id: t.id, name: t.name, orders_count: t.count, revenue: t.revenue,
    }));
    const csv = rowsToCsv(rows);
    const stamp = new Date().toISOString().slice(0,10);
    downloadCsv(`top-shops-${stamp}.csv`, csv || "no_data\n");
    await logExport("shops", null, rows.length);
    toast.success(`تم تصدير ${rows.length} متجر`);
  }, [topShops]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (topShops[0]?.revenue > 0) out.push(`🏆 الأفضل في الفترة: ${topShops[0].name} — ${topShops[0].revenue.toLocaleString()} د.م`);
    const expiring = subs.filter((s) => {
      const days = (new Date(s.current_period_end).getTime() - Date.now()) / (1000*60*60*24);
      return days > 0 && days <= 7;
    }).length;
    if (expiring > 0) out.push(`⚠️ ${expiring} اشتراك ينتهي خلال أسبوع`);
    if (kpis.growth > 20) out.push(`🚀 نمو قوي: +${kpis.growth.toFixed(0)}% متاجر هذا الشهر`);
    else if (kpis.growth < -10) out.push(`📉 انخفاض في تسجيل المتاجر هذا الشهر`);
    if (kpis.suspendedShops > 0) out.push(`⏸️ ${kpis.suspendedShops} متجر مجمّد حالياً`);
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
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter value={range} onChange={setRange} />
          {isFetching && !loading && <span className="text-xs text-muted-foreground">تحديث...</span>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2">
                <Download className="w-4 h-4" />
                تصدير
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadShops}>المتاجر (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadOrders}>الطلبات في الفترة (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSubs}>الاشتراكات (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadTopShops}>أفضل المتاجر (CSV)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/owner/subscriptions">
            <Button className="h-9 rounded-xl bg-gradient-to-r from-[hsl(28_90%_55%)] to-[hsl(15_90%_50%)] hover:opacity-90 text-white font-bold px-4 shadow-[0_8px_24px_-8px_hsl(28_90%_55%/0.6)]">
              الاشتراكات
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          فشل تحميل مؤشرات لوحة المالك.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ms-2">إعادة المحاولة</Button>
        </div>
      )}

      {/* Big KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <BigStat label="إجمالي الطلبات (الفترة)" value={kpis.totalOrders} icon={FileText} tone="blue" loading={loading} />
        <BigStat label="موظفون نشطون" value={kpis.activeEmployees} icon={Users} tone="orange" loading={loading} />
        <BigStat label="طلبات قيد التنفيذ" value={kpis.activeOrders} icon={Zap} tone="green" loading={loading} />
        <BigStat label="طلبات قيد الانتظار" value={kpis.waitingOrders} icon={Package} tone="purple" loading={loading} />
        <BigStat label="طلبات مكتملة" value={kpis.completedOrders} icon={Package} tone="cyan" loading={loading} />
        <BigStat label="اشتراكات نشطة" value={kpis.activeSubs} icon={Crown} tone="yellow" loading={loading} />
        <BigStat label="مستخدمون مرتبطون" value={kpis.totalUsers} icon={CreditCard} tone="pink" loading={loading} />
        <BigStat label="إيرادات (MRR)" value={`${kpis.mrr.toLocaleString()} د.م`} icon={DollarSign} tone="green" loading={loading} />
        <BigStat label="إيرادات الفترة" value={`${kpis.revenueRange.toLocaleString()} د.م`} icon={DollarSign} tone="cyan" loading={loading} />
        <BigStat label="إجمالي المتاجر" value={kpis.totalShops} icon={Building2} tone="blue" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-[hsl(152_70%_55%)]" /> إيرادات الطلبات المكتملة</h3>
          {loading ? <div className="h-[240px] rounded-xl skeleton-shimmer" /> : <RevenueChart data={series.revenue} />}
        </div>

        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-[hsl(210_95%_65%)]" /> متاجر جديدة</h3>
          {loading ? <div className="h-[240px] rounded-xl skeleton-shimmer" /> : <ShopsChart data={series.shopsB} />}
        </div>

        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5 lg:col-span-2">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-[hsl(280_80%_70%)]" /> أعضاء جدد</h3>
          {loading ? <div className="h-[220px] rounded-xl skeleton-shimmer" /> : <UsersChart data={series.usersB} />}
        </div>
      </div>

      {/* Top shops + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[hsl(220_25%_9%)] border border-[hsl(220_20%_16%)] p-5 lg:col-span-2">
          <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Crown className="w-4 h-4 text-[hsl(48_95%_60%)]" /> أفضل المتاجر أداءً (في الفترة)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr className="border-b border-[hsl(220_20%_16%)]">
                  <th className="text-right py-2 px-2">#</th>
                  <th className="text-right py-2 px-2">المتجر</th>
                  <th className="text-right py-2 px-2">الطلبات</th>
                  <th className="text-right py-2 px-2">الإيرادات</th>
                  <th className="text-right py-2 px-2">الحالة</th>
                  <th className="text-center py-2 px-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {topShops.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">لا توجد بيانات في هذه الفترة</td></tr>
                ) : topShops.map((s, i) => (
                  <tr key={s.id} className="border-b border-[hsl(220_20%_14%)] hover:bg-[hsl(220_25%_11%)] transition">
                    <td className="py-3 px-2 font-bold text-[hsl(28_95%_65%)]">{i+1}</td>
                    <td className="py-3 px-2 font-medium text-foreground">{s.name}</td>
                    <td className="py-3 px-2 tabular-nums">{s.count}</td>
                    <td className="py-3 px-2 tabular-nums font-bold text-[hsl(152_70%_55%)]">{s.revenue.toLocaleString()} د.م</td>
                    <td className="py-3 px-2">
                      {s.suspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-red-500/10 text-red-400 border border-red-500/30">مجمّد</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-green-500/10 text-green-400 border border-green-500/30">نشط</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/owner/shops?focus=${s.id}`}>
                          <Button size="sm" variant="outline" className="h-8 gap-1">
                            <Eye className="w-3 h-3" /> عرض
                          </Button>
                        </Link>
                        <Link to={`/owner/shops?suspend=${s.id}`}>
                          <Button size="sm" variant={s.suspended ? "default" : "outline"} className="h-8 gap-1">
                            {s.suspended ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            {s.suspended ? "تفعيل" : "تجميد"}
                          </Button>
                        </Link>
                      </div>
                    </td>
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
