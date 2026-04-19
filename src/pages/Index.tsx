import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  DollarSign, Receipt, Users, UserCog, TrendingUp, Clock,
  CheckCircle2, Activity, ArrowUpRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getServiceName } from "@/lib/serviceI18n";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

export default function Dashboard() {
  const { orders, customers, employees, services, currentBranch, loading, refreshAll } = useApp();
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [tick, setTick] = useState(0);
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refreshAll(); setTick((t) => t + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => {
    const branchOrders = currentBranch ? orders.filter((o) => o.branchId === currentBranch.id) : orders;
    const today = startOfDay(new Date());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    const todayOrders = branchOrders.filter((o) => new Date(o.createdAt) >= today);
    const yesterdayOrders = branchOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= yesterday && d < today;
    });

    const todayRevenue = todayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
    const yesterdayRevenue = yesterdayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
    const todayCars = todayOrders.length;
    const yesterdayCars = yesterdayOrders.length;
    const activeEmployees = employees.filter((e) => e.isActive && (currentBranch ? e.branchId === currentBranch.id : true)).length;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i));
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayRev = branchOrders
        .filter((o) => o.status === "completed" && new Date(o.createdAt) >= d && new Date(o.createdAt) < next)
        .reduce((s, o) => s + o.totalPrice, 0);
      const dayCount = branchOrders.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < next).length;
      return { day: d.toLocaleDateString(locale, { weekday: "short" }), revenue: dayRev, count: dayCount };
    });

    const serviceCount: Record<string, number> = {};
    branchOrders.forEach((o) => o.services.forEach((sid) => { serviceCount[sid] = (serviceCount[sid] || 0) + 1; }));
    const servicesPie = Object.entries(serviceCount)
      .map(([sid, count]) => { const sv = services.find((s) => s.id === sid); return { name: sv ? getServiceName(sv, i18n.language) : "—", value: count }; })
      .sort((a, b) => b.value - a.value).slice(0, 5);

    const activity = [...branchOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      todayRevenue, todayCars, activeEmployees,
      revenueTrend: pctChange(todayRevenue, yesterdayRevenue),
      carsTrend: pctChange(todayCars, yesterdayCars),
      last7, servicesPie, activity,
      totalCustomers: customers.length,
    };
  }, [orders, customers, employees, services, currentBranch, tick, locale]);

  const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.goodMorning");
    if (h < 18) return t("dashboard.goodEvening");
    return t("dashboard.welcomeBack");
  })();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="live-dot" />
            <span className="text-xs font-semibold text-success">{t("dashboard.live")}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-balance">
            {greeting}, <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>{profile?.name || t("common.user")}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentBranch?.name || "—"} • {new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/orders">
            <Button className="fab">
              <Sparkles className="w-4 h-4" /> {t("dashboard.newOperation")}
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/shops">
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" /> {t("shops.newShop")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard label={t("dashboard.todayRevenue")} value={`${data.todayRevenue.toLocaleString()} ${t("common.currency")}`} icon={DollarSign} trend={data.revenueTrend} trendLabel={t("dashboard.vsYesterday")} accent="success" loading={loading} />
        <KPICard label={t("dashboard.todayCars")} value={data.todayCars} icon={Receipt} trend={data.carsTrend} trendLabel={t("dashboard.vsYesterday")} accent="primary" loading={loading} />
        <KPICard label={t("dashboard.activeEmployees")} value={data.activeEmployees} icon={UserCog} accent="info" loading={loading} />
        <KPICard label={t("dashboard.totalCustomers")} value={data.totalCustomers.toLocaleString()} icon={Users} accent="accent" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <div className="saas-card p-5 lg:col-span-2 animate-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> {t("dashboard.weeklyEarnings")}</h3>
              <p className="section-sub">{t("dashboard.last7Days")}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.last7} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px', boxShadow: 'var(--shadow-lg)' }} labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--card))' }} activeDot={{ r: 6 }} fill="url(#revFill)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="saas-card p-5 animate-in-up">
          <div className="mb-4">
            <h3 className="section-title">{t("dashboard.serviceDistribution")}</h3>
            <p className="section-sub">{t("dashboard.mostRequested")}</p>
          </div>
          {data.servicesPie.length === 0 ? (
            <div className="empty-state h-56">
              <div className="empty-state-icon"><Activity className="w-6 h-6" /></div>
              <p className="text-sm text-muted-foreground">{t("dashboard.noDataYet")}</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.servicesPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {data.servicesPie.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="saas-card p-5 animate-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> {t("dashboard.recentOperations")}</h3>
            <p className="section-sub">{t("dashboard.liveUpdate")}</p>
          </div>
          <Link to="/orders" className="text-xs text-primary font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all">
            {t("dashboard.viewAll")} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.activity.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Receipt className="w-6 h-6" /></div>
            <p className="text-sm text-muted-foreground">{t("dashboard.noOperations")}</p>
            <Link to="/orders" className="mt-3"><Button className="fab"><Sparkles className="w-4 h-4" /> {t("dashboard.recordFirst")}</Button></Link>
          </div>
        ) : (
          <div className="space-y-1">
            {data.activity.map((o) => {
              const status = o.status === 'completed' ? { label: t("dashboard.completed"), cls: 'badge-soft-success', icon: CheckCircle2 }
                : o.status === 'in_progress' ? { label: t("dashboard.inProgress"), cls: 'badge-soft-info', icon: Clock }
                : o.status === 'cancelled' ? { label: t("dashboard.cancelled"), cls: 'badge-soft-danger', icon: Clock }
                : { label: t("dashboard.waiting"), cls: 'badge-soft-warning', icon: Clock };
              const Icon = status.icon;
              const minsAgo = Math.max(1, Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000));
              return (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                    {o.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{o.customerName}</p>
                      <span className="text-[11px] text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground truncate">{o.carType} — {o.carPlate}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t("dashboard.since")} {minsAgo < 60 ? `${minsAgo} ${t("dashboard.minAgo")}` : `${Math.floor(minsAgo/60)} ${t("dashboard.hourAgo")}`}{o.employeeName ? ` • ${o.employeeName}` : ''}</p>
                  </div>
                  <div className="text-end flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-foreground tabular-nums">{o.totalPrice} {t("common.currency")}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${status.cls}`}>
                      <Icon className="w-3 h-3" /> {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
