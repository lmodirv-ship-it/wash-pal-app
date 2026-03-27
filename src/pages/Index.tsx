import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, DollarSign, TrendingUp, Clock, CheckCircle, Car, Droplets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; color: string }> = {
  waiting: { label: "انتظار", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "جاري", color: "bg-primary text-primary-foreground" },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground" },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground" },
};

const PIE_COLORS = ["hsl(215,80%,35%)", "hsl(160,45%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

export default function Dashboard() {
  const { orders, customers, employees, services, currentBranch, loading } = useApp();
  if (loading || !currentBranch) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">جاري التحميل...</p></div>;

  const branchOrders = orders.filter((o) => o.branchId === currentBranch.id);
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = branchOrders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
  const totalRevenue = branchOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
  const activeOrders = branchOrders.filter((o) => o.status === "in_progress").length;
  const waitingOrders = branchOrders.filter((o) => o.status === "waiting").length;
  const completedToday = todayOrders.filter((o) => o.status === "completed").length;
  const branchEmployees = employees.filter((e) => e.branchId === currentBranch.id);

  // Last 7 days chart
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

  // Status distribution for pie chart
  const statusData = [
    { name: "انتظار", value: branchOrders.filter((o) => o.status === "waiting").length },
    { name: "جاري", value: branchOrders.filter((o) => o.status === "in_progress").length },
    { name: "مكتمل", value: branchOrders.filter((o) => o.status === "completed").length },
    { name: "ملغي", value: branchOrders.filter((o) => o.status === "cancelled").length },
  ].filter((d) => d.value > 0);

  const recentOrders = [...branchOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مرحباً بك في لافاج 👋</h1>
          <p className="text-muted-foreground mt-1">{currentBranch.name} • {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Main Stats - Big Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-bl from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إيرادات اليوم</p>
                <p className="text-3xl font-bold text-primary">{todayRevenue}</p>
                <p className="text-xs text-muted-foreground mt-1">ريال سعودي</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-bl from-success/10 to-success/5 border-success/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">طلبات اليوم</p>
                <p className="text-3xl font-bold text-success">{todayOrders.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{completedToday} مكتمل</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-bl from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">قيد التنفيذ</p>
                <p className="text-3xl font-bold text-warning">{activeOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">{waitingOrders} في الانتظار</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-bl from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي العملاء</p>
                <p className="text-3xl font-bold text-primary">{customers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{branchEmployees.length} موظف</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">إيرادات آخر 7 أيام</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [`${v} ر.س`, "الإيرادات"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Bar dataKey="revenue" fill="hsl(215, 80%, 35%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">حالة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                <Car className="w-12 h-12 mb-3 opacity-30" />
                <p>لا توجد طلبات بعد</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Info Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              آخر الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Droplets className="w-12 h-12 mb-3 opacity-30" />
                <p>لا توجد طلبات بعد</p>
                <p className="text-xs mt-1">أضف أول طلب من صفحة الطلبات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{o.customerName}</p>
                        <p className="text-xs text-muted-foreground">{o.carType} • {o.carPlate}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold">{o.totalPrice} ر.س</span>
                      <Badge className={`${statusMap[o.status]?.color} text-[10px] px-2 py-0`}>{statusMap[o.status]?.label}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              ملخص سريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 text-center">
                <p className="text-2xl font-bold text-primary">{totalRevenue}</p>
                <p className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات (ر.س)</p>
              </div>
              <div className="p-4 rounded-xl bg-success/5 text-center">
                <p className="text-2xl font-bold text-success">{branchOrders.filter((o) => o.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground mt-1">طلبات مكتملة</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/5 text-center">
                <p className="text-2xl font-bold text-warning">{services.length}</p>
                <p className="text-xs text-muted-foreground mt-1">خدمات متاحة</p>
              </div>
              <div className="p-4 rounded-xl bg-muted text-center">
                <p className="text-2xl font-bold">{branchEmployees.filter((e) => e.isActive).length}</p>
                <p className="text-xs text-muted-foreground mt-1">موظفين نشطين</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
