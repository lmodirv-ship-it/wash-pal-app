import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Order, OrderStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string }> = {
  waiting: { label: "انتظار", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "جاري", color: "bg-primary text-primary-foreground" },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground" },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground" },
};

export default function Orders() {
  const { orders, setOrders, customers, services, employees, currentBranch, invoices, setInvoices } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "", carType: "", carPlate: "", selectedServices: [] as string[],
    employeeId: "", notes: "",
  });

  const branchOrders = orders
    .filter((o) => o.branchId === currentBranch.id)
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => o.customerName.includes(search) || o.carPlate.includes(search));

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedServices: f.selectedServices.includes(id)
        ? f.selectedServices.filter((s) => s !== id)
        : [...f.selectedServices, id],
    }));
  };

  const totalPrice = form.selectedServices.reduce((s, id) => {
    const svc = services.find((sv) => sv.id === id);
    return s + (svc?.price || 0);
  }, 0);

  const handleSubmit = () => {
    if (!form.customerName || !form.carType || !form.carPlate || form.selectedServices.length === 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const emp = employees.find((e) => e.id === form.employeeId);
    const newOrder: Order = {
      id: Date.now().toString(),
      customerId: "",
      customerName: form.customerName,
      carType: form.carType,
      carPlate: form.carPlate,
      services: form.selectedServices,
      totalPrice,
      status: "waiting",
      employeeId: form.employeeId || undefined,
      employeeName: emp?.name,
      branchId: currentBranch.id,
      notes: form.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setForm({ customerName: "", carType: "", carPlate: "", selectedServices: [], employeeId: "", notes: "" });
    setDialogOpen(false);
    toast.success("تم إضافة الطلب بنجاح");
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const updated = { ...o, status, completedAt: status === "completed" ? new Date().toISOString() : o.completedAt };
      if (status === "completed") {
        const inv = {
          id: Date.now().toString(),
          orderId: o.id,
          customerName: o.customerName,
          services: o.services.map((sid) => {
            const svc = services.find((s) => s.id === sid);
            return { name: svc?.name || "", price: svc?.price || 0 };
          }),
          totalAmount: o.totalPrice,
          paidAmount: o.totalPrice,
          isPaid: true,
          createdAt: new Date().toISOString(),
          branchId: o.branchId,
        };
        setInvoices((p) => [inv, ...p]);
      }
      return updated;
    }));
    toast.success("تم تحديث حالة الطلب");
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("تم حذف الطلب");
  };

  const branchEmployees = employees.filter((e) => e.branchId === currentBranch.id && e.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />طلب جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إضافة طلب جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="اسم العميل" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="نوع السيارة" value={form.carType} onChange={(e) => setForm((f) => ({ ...f, carType: e.target.value }))} />
                <Input placeholder="رقم اللوحة" value={form.carPlate} onChange={(e) => setForm((f) => ({ ...f, carPlate: e.target.value }))} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">الخدمات</p>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <Button key={s.id} variant={form.selectedServices.includes(s.id) ? "default" : "outline"} size="sm" onClick={() => toggleService(s.id)}>
                      {s.name} - {s.price} ر.س
                    </Button>
                  ))}
                </div>
              </div>
              {branchEmployees.length > 0 && (
                <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="تعيين موظف (اختياري)" /></SelectTrigger>
                  <SelectContent>
                    {branchEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="flex justify-between items-center">
                <p className="font-bold text-lg">المجموع: {totalPrice} ر.س</p>
                <Button onClick={handleSubmit}>إضافة الطلب</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pr-9" placeholder="بحث بالاسم أو رقم اللوحة..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="waiting">انتظار</SelectItem>
            <SelectItem value="in_progress">جاري</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>السيارة</TableHead>
                <TableHead>الخدمات</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الموظف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchOrders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
              ) : branchOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.customerName}</TableCell>
                  <TableCell>{o.carType}<br /><span className="text-xs text-muted-foreground">{o.carPlate}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {o.services.map((sid) => {
                        const svc = services.find((s) => s.id === sid);
                        return <Badge key={sid} variant="secondary" className="text-xs">{svc?.name}</Badge>;
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{o.totalPrice} ر.س</TableCell>
                  <TableCell>{o.employeeName || "-"}</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                      <SelectTrigger className="w-28 h-8">
                        <Badge className={statusMap[o.status]?.color}>{statusMap[o.status]?.label}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waiting">انتظار</SelectItem>
                        <SelectItem value="in_progress">جاري</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteOrder(o.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
