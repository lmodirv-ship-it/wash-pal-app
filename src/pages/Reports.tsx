import { useApp } from "@/contexts/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(45,95%,55%)", "hsl(160,60%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

export default function Reports() {
  const { orders, services, currentBranch } = useApp();
  const branchOrders = orders.filter((o) => o.branchId === (currentBranch?.id || "") && o.status === "completed");

  const monthlyData: Record<string, number> = {};
  branchOrders.forEach((o) => {
    const m = o.createdAt.substring(0, 7);
    monthlyData[m] = (monthlyData[m] || 0) + o.totalPrice;
  });
  const chartData = Object.entries(monthlyData).sort().slice(-6).map(([month, revenue]) => ({
    month: new Date(month + "-01").toLocaleDateString("ar-SA", { month: "short", year: "numeric" }),
    revenue,
  }));

  const serviceCount: Record<string, number> = {};
  branchOrders.forEach((o) => o.services.forEach((sid) => {
    const svc = services.find((s) => s.id === sid);
    if (svc) serviceCount[svc.name] = (serviceCount[svc.name] || 0) + 1;
  }));
  const pieData = Object.entries(serviceCount).map(([name, value]) => ({ name, value }));

  const totalRevenue = branchOrders.reduce((s, o) => s + o.totalPrice, 0);
  const avgOrder = branchOrders.length > 0 ? Math.round(totalRevenue / branchOrders.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">التقارير المالية</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="lavage-card p-6 text-center">
          <p className="text-3xl font-bold text-primary">{totalRevenue} ر.س</p>
          <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
        </div>
        <div className="lavage-card p-6 text-center">
          <p className="text-3xl font-bold text-success">{branchOrders.length}</p>
          <p className="text-sm text-muted-foreground">الطلبات المكتملة</p>
        </div>
        <div className="lavage-card p-6 text-center">
          <p className="text-3xl font-bold text-warning">{avgOrder} ر.س</p>
          <p className="text-sm text-muted-foreground">متوسط الطلب</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="lavage-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">الإيرادات الشهرية</h3>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد بيانات بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" />
                <XAxis dataKey="month" stroke="hsl(220,10%,55%)" />
                <YAxis stroke="hsl(220,10%,55%)" />
                <Tooltip formatter={(v: number) => [`${v} ر.س`, "الإيرادات"]} contentStyle={{ background: 'hsl(220,15%,8%)', border: '1px solid hsl(220,15%,15%)', borderRadius: '0.75rem', color: '#fff' }} />
                <Bar dataKey="revenue" fill="hsl(45,95%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lavage-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">الخدمات الأكثر طلباً</h3>
          {pieData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد بيانات بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(220,15%,8%)', border: '1px solid hsl(220,15%,15%)', borderRadius: '0.75rem', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
