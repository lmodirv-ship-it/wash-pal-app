import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Users, DollarSign, UserCog, Droplets, FileText, Building2, Search, Filter, Edit, Trash2, Shield, Store } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string }> = {
  waiting: { label: "انتظار", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "جاري", color: "bg-primary text-primary-foreground" },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground" },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground" },
};

export default function Dashboard() {
  const { orders, customers, employees, services, invoices, branches, shops, currentBranch, loading, updateEmployee, updateOrder, deleteOrder, updateCustomer, deleteCustomer, updateShop } = useApp();

  // Search states
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerRoleFilter, setCustomerRoleFilter] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("all");
  const [serviceSearch, setServiceSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoicePaidFilter, setInvoicePaidFilter] = useState("all");
  const [shopSearch, setShopSearch] = useState("");

  // Admin dialogs
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; employeeId: string; currentRole: string }>({ open: false, employeeId: "", currentRole: "" });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; orderId: string; currentStatus: string }>({ open: false, orderId: "", currentStatus: "" });

  if (loading || !currentBranch) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">جاري التحميل...</p></div>;

  const branchOrders = orders.filter((o) => o.branchId === currentBranch.id);
  const branchEmployees = employees.filter((e) => e.branchId === currentBranch.id);
  const branchInvoices = invoices.filter((i) => i.branchId === currentBranch.id);
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = branchOrders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);
  const totalRevenue = branchOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);

  // Filtered data
  const filteredOrders = branchOrders.filter((o) => {
    const matchSearch = !orderSearch || o.customerName.includes(orderSearch) || o.carPlate.includes(orderSearch) || (o.reference || "").includes(orderSearch);
    const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredCustomers = customers.filter((c) => {
    const matchSearch = !customerSearch || c.name.includes(customerSearch) || c.phone.includes(customerSearch) || (c.reference || "").includes(customerSearch);
    const matchRole = customerRoleFilter === "all" || c.role === customerRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredEmployees = branchEmployees.filter((e) => {
    const matchSearch = !employeeSearch || e.name.includes(employeeSearch) || e.phone.includes(employeeSearch) || (e.reference || "").includes(employeeSearch);
    const matchRole = employeeRoleFilter === "all" || e.roleType === employeeRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredServices = services.filter((s) => !serviceSearch || s.name.includes(serviceSearch));

  const filteredInvoices = branchInvoices.filter((inv) => {
    const matchSearch = !invoiceSearch || inv.customerName.includes(invoiceSearch);
    const matchPaid = invoicePaidFilter === "all" || (invoicePaidFilter === "paid" ? inv.isPaid : !inv.isPaid);
    return matchSearch && matchPaid;
  });

  const filteredShops = shops.filter((s) => !shopSearch || s.name.includes(shopSearch) || s.ownerName.includes(shopSearch) || s.city.includes(shopSearch));

  // Admin actions
  const handleChangeRole = async (employeeId: string, newRole: string) => {
    await updateEmployee(employeeId, { roleType: newRole });
    toast.success("تم تغيير الصلاحية");
    setRoleDialog({ open: false, employeeId: "", currentRole: "" });
  };

  const handleChangeOrderStatus = async (orderId: string, newStatus: string) => {
    const update: any = { status: newStatus };
    if (newStatus === "completed") update.completedAt = new Date().toISOString();
    await updateOrder(orderId, update);
    toast.success("تم تغيير حالة الطلب");
    setStatusDialog({ open: false, orderId: "", currentStatus: "" });
  };

  const getExpiryColor = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "bg-red-500/20 text-red-400";
    if (days <= 7) return "bg-orange-500/20 text-orange-400";
    if (days <= 15) return "bg-amber-500/20 text-amber-400";
    return "bg-emerald-500/20 text-emerald-400";
  };

  const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9"
      />
    </div>
  );

  return (
    <div className="space-y-6 dashboard-dark">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-400" />
            لوحة تحكم المدير 👑
          </h1>
          <p className="text-gray-400 mt-1">{currentBranch.name} • {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Stats */}
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
          <CardTitle className="text-lg text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-400" />الطلبات ({filteredOrders.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <SearchBar value={orderSearch} onChange={setOrderSearch} placeholder="بحث بالاسم أو اللوحة أو المرجع..." />
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-9">
                <Filter className="w-3 h-3 ml-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="waiting">انتظار</SelectItem>
                <SelectItem value="in_progress">جاري</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <TableHead className="text-gray-400">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={8} className="text-center py-8 text-gray-500">لا توجد نتائج</TableCell></TableRow>
              ) : filteredOrders.slice(0, 20).map((o) => (
                <TableRow key={o.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{o.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{o.customerName}</TableCell>
                  <TableCell className="text-gray-300">{o.carType}</TableCell>
                  <TableCell className="text-gray-300">{o.carPlate}</TableCell>
                  <TableCell className="font-semibold text-emerald-400">{o.totalPrice} ر.س</TableCell>
                  <TableCell>
                    <Badge className={`${statusMap[o.status]?.color} cursor-pointer`} onClick={() => setStatusDialog({ open: true, orderId: o.id, currentStatus: o.status })}>
                      {statusMap[o.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400" onClick={async () => { await deleteOrder(o.id); toast.success("تم حذف الطلب"); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" />العملاء ({filteredCustomers.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <SearchBar value={customerSearch} onChange={setCustomerSearch} placeholder="بحث بالاسم أو الهاتف أو المرجع..." />
            <Select value={customerRoleFilter} onValueChange={setCustomerRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-9">
                <Filter className="w-3 h-3 ml-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value="customer">عميل</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <TableHead className="text-gray-400">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={9} className="text-center py-6 text-gray-500">لا توجد نتائج</TableCell></TableRow>
              ) : filteredCustomers.slice(0, 15).map((c) => (
                <TableRow key={c.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{c.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/10 text-gray-300 cursor-pointer" onClick={async () => {
                      const newRole = c.role === 'customer' ? 'vip' : 'customer';
                      await updateCustomer(c.id, { role: newRole });
                      toast.success(`تم تغيير الدور إلى ${newRole === 'vip' ? 'VIP' : 'عميل'}`);
                    }}>
                      {c.role === 'customer' ? 'عميل' : c.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{c.phone}</TableCell>
                  <TableCell className="text-gray-300">{c.carType}</TableCell>
                  <TableCell className="text-gray-300">{c.carPlate}</TableCell>
                  <TableCell className="text-gray-300">{c.totalVisits}</TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400" onClick={async () => { await deleteCustomer(c.id); toast.success("تم حذف العميل"); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><UserCog className="w-5 h-5 text-purple-400" />الموظفين ({filteredEmployees.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <SearchBar value={employeeSearch} onChange={setEmployeeSearch} placeholder="بحث بالاسم أو الهاتف أو المرجع..." />
            <Select value={employeeRoleFilter} onValueChange={setEmployeeRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-9">
                <Filter className="w-3 h-3 ml-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الصلاحيات</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="employee">موظف</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <TableHead className="text-gray-400">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={8} className="text-center py-6 text-gray-500">لا توجد نتائج</TableCell></TableRow>
              ) : filteredEmployees.map((e) => (
                <TableRow key={e.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{e.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{e.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${e.roleType === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-gray-300'}`}
                      onClick={() => setRoleDialog({ open: true, employeeId: e.id, currentRole: e.roleType })}
                    >
                      {e.roleType === 'admin' ? 'مدير' : 'موظف'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{e.role}</TableCell>
                  <TableCell className="text-gray-300">{e.phone}</TableCell>
                  <TableCell className="text-xs text-gray-400">{new Date(e.hireDate).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${e.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-500"}`}
                      onClick={async () => { await updateEmployee(e.id, { isActive: !e.isActive }); toast.success(e.isActive ? "تم تعطيل الموظف" : "تم تفعيل الموظف"); }}
                    >
                      {e.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-400" onClick={() => setRoleDialog({ open: true, employeeId: e.id, currentRole: e.roleType })}>
                      <Shield className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-400" />الخدمات ({filteredServices.length})</CardTitle>
          <div className="mt-2">
            <SearchBar value={serviceSearch} onChange={setServiceSearch} placeholder="بحث بالاسم..." />
          </div>
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
              {filteredServices.map((s) => (
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
          <CardTitle className="text-lg text-white flex items-center gap-2"><FileText className="w-5 h-5 text-orange-400" />الفواتير ({filteredInvoices.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <SearchBar value={invoiceSearch} onChange={setInvoiceSearch} placeholder="بحث باسم العميل..." />
            <Select value={invoicePaidFilter} onValueChange={setInvoicePaidFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-9">
                <Filter className="w-3 h-3 ml-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="unpaid">غير مدفوعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">العميل</TableHead>
                <TableHead className="text-gray-400">المبلغ</TableHead>
                <TableHead className="text-gray-400">المدفوع</TableHead>
                <TableHead className="text-gray-400">الحالة</TableHead>
                <TableHead className="text-gray-400">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={5} className="text-center py-6 text-gray-500">لا توجد نتائج</TableCell></TableRow>
              ) : filteredInvoices.slice(0, 15).map((inv) => (
                <TableRow key={inv.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{inv.customerName}</TableCell>
                  <TableCell className="text-emerald-400 font-semibold">{inv.totalAmount} ر.س</TableCell>
                  <TableCell className="text-gray-300">{inv.paidAmount} ر.س</TableCell>
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

      {/* Shops Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2"><Store className="w-5 h-5 text-pink-400" />المحلات المشتركة ({filteredShops.length})</CardTitle>
          <div className="mt-2">
            <SearchBar value={shopSearch} onChange={setShopSearch} placeholder="بحث بالاسم أو المالك أو المدينة..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">المرجع</TableHead>
                <TableHead className="text-gray-400">المحل</TableHead>
                <TableHead className="text-gray-400">المالك</TableHead>
                <TableHead className="text-gray-400">المدينة</TableHead>
                <TableHead className="text-gray-400">الباقة</TableHead>
                <TableHead className="text-gray-400">النقاط</TableHead>
                <TableHead className="text-gray-400">آخر أجل</TableHead>
                <TableHead className="text-gray-400">الحالة</TableHead>
                <TableHead className="text-gray-400">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.length === 0 ? (
                <TableRow className="border-white/10"><TableCell colSpan={9} className="text-center py-6 text-gray-500">لا توجد محلات</TableCell></TableRow>
              ) : filteredShops.map((s) => (
                <TableRow key={s.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-gray-300">{s.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-white">{s.name}</TableCell>
                  <TableCell className="text-gray-300">{s.ownerName}</TableCell>
                  <TableCell className="text-gray-300">{s.city}</TableCell>
                  <TableCell><Badge className="bg-blue-500/20 text-blue-400">{s.packageName}</Badge></TableCell>
                  <TableCell className="text-gray-300">{s.remainingPoints ?? (s.totalPoints - s.usedPoints)} / {s.totalPoints}</TableCell>
                  <TableCell><Badge className={getExpiryColor(s.expiryDate)}>{new Date(s.expiryDate).toLocaleDateString("ar-SA")}</Badge></TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${s.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                      onClick={async () => { await updateShop(s.id, { isActive: !s.isActive }); toast.success(s.isActive ? "تم تعطيل المحل" : "تم تفعيل المحل"); }}
                    >
                      {s.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-emerald-400" onClick={async () => { await updateShop(s.id, { isActive: !s.isActive }); }}>
                      <Shield className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(v) => !v && setRoleDialog({ open: false, employeeId: "", currentRole: "" })}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>تغيير صلاحية الموظف</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">الصلاحية الحالية: <Badge className="mr-1">{roleDialog.currentRole === 'admin' ? 'مدير' : 'موظف'}</Badge></p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant={roleDialog.currentRole === 'admin' ? 'default' : 'outline'} className="border-white/10" onClick={() => handleChangeRole(roleDialog.employeeId, 'admin')}>
                <Shield className="w-4 h-4 ml-1" /> مدير
              </Button>
              <Button variant={roleDialog.currentRole === 'employee' ? 'default' : 'outline'} className="border-white/10" onClick={() => handleChangeRole(roleDialog.employeeId, 'employee')}>
                <UserCog className="w-4 h-4 ml-1" /> موظف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Status Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(v) => !v && setStatusDialog({ open: false, orderId: "", currentStatus: "" })}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>تغيير حالة الطلب</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(statusMap).map(([key, val]) => (
              <Button
                key={key}
                variant={statusDialog.currentStatus === key ? 'default' : 'outline'}
                className="border-white/10"
                onClick={() => handleChangeOrderStatus(statusDialog.orderId, key)}
              >
                {val.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
