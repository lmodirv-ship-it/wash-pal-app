import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Users, DollarSign, Car, UserCog, Droplets, FileText, Building2 } from "lucide-react";

const statusMap: Record<string, { label: string; color: string }> = {
  waiting: { label: "انتظار", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "جاري", color: "bg-primary text-primary-foreground" },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground" },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground" },
};

export default function Dashboard() {
  const { orders, customers, employees, services, invoices, branches, currentBranch, loading } = useApp();
  if (loading || !currentBranch) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">جاري التحميل...</p></div>;

  const branchOrders = orders.filter((o) => o.branchId === currentBranch.id);
  const branchEmployees = employees.filter((e) => e.branchId === currentBranch.id);
  const branchInvoices = invoices.filter((i) => i.branchId === currentBranch.id);
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = branchOrders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
  const totalRevenue = branchOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="space-y-6 dashboard-dark">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">مرحباً بك في لافاج 👋</h1>
          <p className="text-gray-400 mt-1">{currentBranch.name} • {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur">
          <DollarSign className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
          <p className="text-2xl font-bold text-white">{todayRevenue}</p>
          <p className="text-xs text-gray-400">إيرادات اليوم (ر.س)</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur">
          <ClipboardList className="w-6 h-6 mx-auto mb-1 text-blue-400" />
          <p className="text-2xl font-bold text-white">{todayOrders.length}</p>
          <p className="text-xs text-gray-400">طلبات اليوم</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur">
          <Users className="w-6 h-6 mx-auto mb-1 text-amber-400" />
          <p className="text-2xl font-bold text-white">{customers.length}</p>
          <p className="text-xs text-gray-400">إجمالي العملاء</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur">
          <DollarSign className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
          <p className="text-2xl font-bold text-white">{totalRevenue}</p>
          <p className="text-xs text-gray-400">إجمالي الإيرادات (ر.س)</p>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-400" />آخر الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">المرجع</TableHead>
                <TableHead className="text-gray-400">العميل</TableHead>
                <TableHead className="text-gray-400">السيارة</TableHead>
                <TableHead className="text-gray-400">اللوحة</TableHead>
                <TableHead className="text-gray-400">المبلغ</TableHead>
                <TableHead className="text-gray-400">الحالة</TableHead>
                <TableHead className="text-gray-400">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchOrders.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={7} className="text-center py-8 text-gray-500">لا توجد طلبات</TableCell></TableRow>
              ) : branchOrders.slice(0, 10).map((o) => (
                <TableRow key={o.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{o.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{o.customerName}</TableCell>
                  <TableCell className="text-gray-300">{o.carType}</TableCell>
                  <TableCell className="text-gray-300">{o.carPlate}</TableCell>
                  <TableCell className="font-semibold text-emerald-400">{o.totalPrice} ر.س</TableCell>
                  <TableCell><Badge className={statusMap[o.status]?.color}>{statusMap[o.status]?.label}</Badge></TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" />العملاء</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">المرجع</TableHead>
                <TableHead className="text-gray-400">الاسم</TableHead>
                <TableHead className="text-gray-400">الصلاحية</TableHead>
                <TableHead className="text-gray-400">الهاتف</TableHead>
                <TableHead className="text-gray-400">السيارة</TableHead>
                <TableHead className="text-gray-400">اللوحة</TableHead>
                <TableHead className="text-gray-400">الزيارات</TableHead>
                <TableHead className="text-gray-400">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={8} className="text-center py-6 text-gray-500">لا يوجد عملاء</TableCell></TableRow>
              ) : customers.slice(0, 8).map((c) => (
                <TableRow key={c.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{c.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-white/10 text-gray-300">{c.role === 'customer' ? 'عميل' : c.role}</Badge></TableCell>
                  <TableCell className="text-gray-300">{c.phone}</TableCell>
                  <TableCell className="text-gray-300">{c.carType}</TableCell>
                  <TableCell className="text-gray-300">{c.carPlate}</TableCell>
                  <TableCell className="text-gray-300">{c.totalVisits}</TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><UserCog className="w-5 h-5 text-purple-400" />الموظفين</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">المرجع</TableHead>
                <TableHead className="text-gray-400">الاسم</TableHead>
                <TableHead className="text-gray-400">الصلاحية</TableHead>
                <TableHead className="text-gray-400">الوظيفة</TableHead>
                <TableHead className="text-gray-400">الهاتف</TableHead>
                <TableHead className="text-gray-400">تاريخ البداية</TableHead>
                <TableHead className="text-gray-400">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchEmployees.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={7} className="text-center py-6 text-gray-500">لا يوجد موظفين</TableCell></TableRow>
              ) : branchEmployees.map((e) => (
                <TableRow key={e.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{e.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{e.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-white/10 text-gray-300">{e.roleType === 'admin' ? 'مدير' : 'موظف'}</Badge></TableCell>
                  <TableCell className="text-gray-300">{e.role}</TableCell>
                  <TableCell className="text-gray-300">{e.phone}</TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(e.hireDate).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell><Badge className={e.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-500"}>{e.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-400" />الخدمات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">الخدمة</TableHead>
                <TableHead className="text-gray-400">السعر</TableHead>
                <TableHead className="text-gray-400">المدة</TableHead>
                <TableHead className="text-gray-400">الوصف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{s.name}</TableCell>
                  <TableCell className="text-emerald-400 font-semibold">{s.price} ر.س</TableCell>
                  <TableCell className="text-gray-300">{s.duration} دقيقة</TableCell>
                  <TableCell className="text-gray-400 text-sm">{s.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><FileText className="w-5 h-5 text-orange-400" />الفواتير</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">العميل</TableHead>
                <TableHead className="text-gray-400">المبلغ</TableHead>
                <TableHead className="text-gray-400">الحالة</TableHead>
                <TableHead className="text-gray-400">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchInvoices.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={4} className="text-center py-6 text-gray-500">لا توجد فواتير</TableCell></TableRow>
              ) : branchInvoices.slice(0, 8).map((inv) => (
                <TableRow key={inv.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{inv.customerName}</TableCell>
                  <TableCell className="text-emerald-400 font-semibold">{inv.totalAmount} ر.س</TableCell>
                  <TableCell><Badge className={inv.isPaid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>{inv.isPaid ? "مدفوعة" : "غير مدفوعة"}</Badge></TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Branches Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-400" />الفروع</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">الفرع</TableHead>
                <TableHead className="text-gray-400">العنوان</TableHead>
                <TableHead className="text-gray-400">الهاتف</TableHead>
                <TableHead className="text-gray-400">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{b.name} {b.id === currentBranch.id && <Badge className="bg-blue-500/20 text-blue-400 text-[10px] mr-1">حالي</Badge>}</TableCell>
                  <TableCell className="text-gray-300">{b.address}</TableCell>
                  <TableCell className="text-gray-300">{b.phone}</TableCell>
                  <TableCell><Badge className={b.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-500"}>{b.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
