import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; color: string }> = {
  waiting: { label: "انتظار", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "جاري", color: "bg-primary text-primary-foreground" },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground" },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground" },
};

export default function Dashboard() {
  const { orders, customers, currentBranch, loading } = useApp();
  if (loading || !currentBranch) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">جاري التحميل...</p></div>;
  const branchOrders = orders.filter((o) => o.branchId === currentBranch.id);
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = branchOrders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
  const activeOrders = branchOrders.filter((o) => o.status === "in_progress").length;
  const waitingOrders = branchOrders.filter((o) => o.status === "waiting").length;

  // Last 7 days chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayOrders = branchOrders.filter((o) => o.createdAt.startsWith(dateStr) && o.status === "completed");
    return {
      day: d.toLocaleDateString("ar-SA", { weekday: "short" }),
      revenue: dayOrders.reduce((s, o) => s + o.totalPrice, 0),
      orders: dayOrders.length,
    };
  });

  const recentOrders = [...branchOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const stats = [
    { title: "طلبات اليوم", value: todayOrders.length, icon: ClipboardList, color: "text-primary" },
    { title: "إيرادات اليوم", value: `${todayRevenue} ر.س`, icon: DollarSign, color: "text-success" },
    { title: "قيد التنفيذ", value: activeOrders, icon: TrendingUp, color: "text-warning" },
    { title: "في الانتظار", value: waitingOrders, icon: Clock, color: "text-muted-foreground" },
    { title: "إجمالي العملاء", value: customers.length, icon: Users, color: "text-primary" },
    { title: "مكتمل اليوم", value: todayOrders.filter((o) => o.status === "completed").length, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>إيرادات الأسبوع</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v: number) => [`${v} ر.س`, "الإيرادات"]} />
                <Bar dataKey="revenue" fill="hsl(215, 80%, 35%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>آخر الطلبات</CardTitle></CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد طلبات بعد</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.carType} - {o.carPlate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{o.totalPrice} ر.س</span>
                      <Badge className={statusMap[o.status]?.color}>{statusMap[o.status]?.label}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
