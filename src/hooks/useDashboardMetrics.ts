import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "@/components/DateRangeFilter";

const PLAN_PRICE: Record<string, number> = { starter: 0, pro: 29, business: 99 };

export interface ShopRow { id: string; name: string; created_at: string; suspended: boolean; }
export interface SubRow { id: string; shop_id: string; plan: string; status: string; monthly_price: number | null; current_period_end: string; created_at: string; }
export interface OrderRow { id: string; shop_id: string; total_price: number | null; status: string; created_at: string; completed_at: string | null; }
export interface MemberRow { user_id: string; shop_id: string; created_at: string; }
export interface EmployeeRow { id: string; shop_id: string; is_active: boolean; }

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }

export function useDashboardMetrics(range: DateRange) {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const fromIso = range.from.toISOString();
      const toIso = range.to.toISOString();
      const [s, sb, o, m, e] = await Promise.all([
        supabase.from("shops").select("id,name,created_at,suspended"),
        supabase.from("subscriptions").select("id,shop_id,plan,status,monthly_price,current_period_end,created_at"),
        supabase.from("orders").select("id,shop_id,total_price,status,created_at,completed_at").gte("created_at", fromIso).lte("created_at", toIso),
        supabase.from("shop_members").select("user_id,shop_id,created_at"),
        supabase.from("employees").select("id,shop_id,is_active").eq("is_active", true),
      ]);
      if (cancelled) return;
      setShops((s.data as any) || []);
      setSubs((sb.data as any) || []);
      setOrders((o.data as any) || []);
      setMembers((m.data as any) || []);
      setEmployees((e.data as any) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range.from.getTime(), range.to.getTime()]);

  const kpis = useMemo(() => {
    const activeSubs = subs.filter((x) => x.status === "active" || x.status === "trialing" || x.status === "trial");
    const mrr = activeSubs.reduce((acc, x) => acc + Number(x.monthly_price ?? PLAN_PRICE[x.plan] ?? 0), 0);
    const totalUsers = new Set(members.map((x) => x.user_id)).size;
    const totalOrders = orders.length;
    const activeOrders = orders.filter((x) => x.status === "in_progress" || x.status === "waiting").length;
    const waitingOrders = orders.filter((x) => x.status === "waiting").length;
    const completedOrders = orders.filter((x) => x.status === "completed").length;
    const revenueRange = orders
      .filter((x) => x.status === "completed")
      .reduce((a, x) => a + Number(x.total_price || 0), 0);
    const activeEmployees = employees.length;

    // Monthly growth (kept relative to range end)
    const refDate = range.to;
    const thisMonth = monthKey(refDate);
    const lastMonth = monthKey(new Date(refDate.getFullYear(), refDate.getMonth()-1, 1));
    const newThis = shops.filter((x) => monthKey(new Date(x.created_at)) === thisMonth).length;
    const newLast = shops.filter((x) => monthKey(new Date(x.created_at)) === lastMonth).length;
    const growth = newLast === 0 ? (newThis > 0 ? 100 : 0) : ((newThis - newLast) / newLast) * 100;

    return {
      totalShops: shops.length,
      activeShops: shops.filter((x) => !x.suspended).length,
      suspendedShops: shops.filter((x) => x.suspended).length,
      activeSubs: activeSubs.length,
      mrr,
      totalUsers,
      totalOrders,
      activeOrders,
      waitingOrders,
      completedOrders,
      revenueRange,
      activeEmployees,
      growth,
    };
  }, [shops, subs, members, orders, employees, range.to]);

  // Build a series of buckets across the selected range. If the range
  // is < 60 days we bucket by day, otherwise by month.
  const series = useMemo(() => {
    const ms = range.to.getTime() - range.from.getTime();
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const byDay = days <= 60;
    const buckets: { key: string; label: string; ts: number }[] = [];

    if (byDay) {
      const start = new Date(range.from); start.setHours(0,0,0,0);
      const end = new Date(range.to); end.setHours(0,0,0,0);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const key = d.toISOString().slice(0,10);
        buckets.push({ key, label: key.slice(5), ts: d.getTime() });
      }
    } else {
      // 6 months ending at range.to (covers the long-range case)
      const end = new Date(range.to);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(end.getFullYear(), end.getMonth()-i, 1);
        buckets.push({ key: monthKey(d), label: monthKey(d), ts: d.getTime() });
      }
    }

    const keyOf = (iso: string) => byDay ? iso.slice(0,10) : monthKey(new Date(iso));

    const revenue = buckets.map((b) => ({ label: b.label, revenue: 0 }));
    const shopsB = buckets.map((b) => ({ label: b.label, shops: 0 }));
    const usersB = buckets.map((b) => ({ label: b.label, users: 0 }));
    const indexOf = new Map(buckets.map((b, i) => [b.key, i]));

    for (const o of orders) {
      if (o.status !== "completed") continue;
      const i = indexOf.get(keyOf(o.created_at));
      if (i !== undefined) revenue[i].revenue += Number(o.total_price || 0);
    }
    for (const s of shops) {
      const i = indexOf.get(keyOf(s.created_at));
      if (i !== undefined) shopsB[i].shops += 1;
    }
    const seenPerBucket: Map<number, Set<string>> = new Map();
    for (const m of members) {
      const i = indexOf.get(keyOf(m.created_at));
      if (i === undefined) continue;
      let set = seenPerBucket.get(i);
      if (!set) { set = new Set(); seenPerBucket.set(i, set); }
      set.add(m.user_id);
    }
    seenPerBucket.forEach((set, i) => { usersB[i].users = set.size; });

    return { revenue, shopsB, usersB, byDay };
  }, [orders, shops, members, range.from.getTime(), range.to.getTime()]);

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

  return { loading, shops, subs, orders, members, employees, kpis, series, topShops };
}