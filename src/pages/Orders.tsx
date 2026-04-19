import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string }> = {
  waiting: { label: "انتظار", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "جاري", color: "bg-primary text-primary-foreground" },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground" },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground" },
};

const carSizeLabel = (s: string) => s === "large" ? "كبيرة (4x4)" : s === "small" ? "صغيرة" : s;
const carSizeBadge = (s: string) => s === "large" ? "bg-warning/10 text-warning border-warning/30" : "bg-primary/10 text-primary border-primary/20";

export default function Orders() {
  const { orders, services, employees, currentBranch, addOrder, updateOrder, deleteOrder, addInvoice } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [carSizeFilter, setCarSizeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "", carType: "small", carPlate: "", selectedServices: [] as string[],
    employeeId: "", notes: "", customPrice: "",
  });
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const branchId = currentBranch?.id || "";
  const branchOrders = orders
    .filter((o) => o.branchId === branchId)
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => carSizeFilter === "all" || o.carType === carSizeFilter)
    .filter((o) => o.customerName.includes(search) || o.carPlate.includes(search) || o.reference?.includes(search));

  const toggleService = (id: string) => {
    setForm((f) => ({ ...f, selectedServices: f.selectedServices.includes(id) ? f.selectedServices.filter((s) => s !== id) : [...f.selectedServices, id] }));
  };

  const baseTotal = form.selectedServices.reduce((s, id) => s + (services.find((sv) => sv.id === id)?.price || 0), 0);
  const totalPrice = form.customPrice ? Number(form.customPrice) : baseTotal;

  const handleSubmit = async () => {
    if (!form.customerName || !form.carType || !form.carPlate || form.selectedServices.length === 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة"); return;
    }
    const emp = employees.find((e) => e.id === form.employeeId);
    await addOrder({
      customerId: "", customerName: form.customerName, carType: form.carType, carPlate: form.carPlate,
      services: form.selectedServices, totalPrice, status: "waiting",
      employeeId: form.employeeId || undefined, employeeName: emp?.name, branchId, notes: form.notes || undefined,
    });
    setForm({ customerName: "", carType: "small", carPlate: "", selectedServices: [], employeeId: "", notes: "", customPrice: "" });
    setDialogOpen(false);
    toast.success("تم إضافة الطلب بنجاح");
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === id);
    await updateOrder(id, { status, completedAt: status === "completed" ? new Date().toISOString() : undefined });
    if (status === "completed" && order) {
      await addInvoice({
        orderId: order.id, customerName: order.customerName,
        services: order.services.map((sid) => { const svc = services.find((s) => s.id === sid); return { name: svc?.name || "", price: svc?.price || 0 }; }),
        totalAmount: order.totalPrice, paidAmount: order.totalPrice, isPaid: true,
        createdAt: new Date().toISOString(), branchId: order.branchId,
      });
    }
    toast.success("تم تحديث حالة الطلب");
  };

  const branchEmployees = employees.filter((e) => e.branchId === branchId && e.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">إدارة الطلبات</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 ml-2" />طلب جديد</Button></DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle>إضافة طلب جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="اسم العميل" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.carType} onValueChange={(v) => setForm((f) => ({ ...f, carType: v }))}>
                  <SelectTrigger><SelectValue placeholder="نوع السيارة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">صغيرة</SelectItem>
                    <SelectItem value="large">كبيرة (4x4)</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="رقم اللوحة" value={form.carPlate} onChange={(e) => setForm((f) => ({ ...f, carPlate: e.target.value }))} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-foreground">الخدمات</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {services.filter((s) => s.isActive).map((s) => (
                    <Button key={s.id} variant={form.selectedServices.includes(s.id) ? "default" : "outline"} size="sm" onClick={() => toggleService(s.id)} className="lavage-glow">
                      {s.name} - {s.price} DH
                    </Button>
                  ))}
                </div>
              </div>
              {branchEmployees.length > 0 && (
                <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="تعيين موظف (اختياري)" /></SelectTrigger>
                  <SelectContent>{branchEmployees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
                </Select>
              )}
              <Textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">الثمن النهائي:</span>
                <Input type="number" placeholder={`الافتراضي: ${baseTotal}`} value={form.customPrice} onChange={(e) => setForm((f) => ({ ...f, customPrice: e.target.value }))} className="flex-1" />
                <span className="text-sm font-bold text-primary">DH</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-primary">المجموع: {totalPrice} DH</p>
                <Button onClick={handleSubmit} className="lavage-btn">إضافة الطلب</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pr-9" placeholder="بحث بالاسم أو رقم اللوحة أو المرجع..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="waiting">انتظار</SelectItem>
            <SelectItem value="in_progress">جاري</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
        <Select value={carSizeFilter} onValueChange={setCarSizeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="small">صغيرة</SelectItem>
            <SelectItem value="large">كبيرة (4x4)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">المرجع</TableHead>
              <TableHead className="text-muted-foreground">العميل</TableHead>
              <TableHead className="text-muted-foreground">اللوحة</TableHead>
              <TableHead className="text-muted-foreground">نوع السيارة</TableHead>
              <TableHead className="text-muted-foreground">الخدمات</TableHead>
              <TableHead className="text-muted-foreground">الثمن</TableHead>
              <TableHead className="text-muted-foreground">الموظف</TableHead>
              <TableHead className="text-muted-foreground">الحالة</TableHead>
              <TableHead className="text-muted-foreground">التاريخ</TableHead>
              <TableHead className="text-muted-foreground">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchOrders.length === 0 ? (
              <TableRow className="border-border"><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
            ) : branchOrders.map((o, idx) => {
              const isEditing = priceEdits[o.id] !== undefined;
              return (
                <TableRow key={o.id} className="lavage-table-row border-border">
                  <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground">{o.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-foreground">{o.customerName}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground">{o.carPlate}</TableCell>
                  <TableCell><Badge variant="outline" className={carSizeBadge(o.carType)}>{carSizeLabel(o.carType)}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {o.services.map((sid) => <Badge key={sid} variant="secondary" className="text-xs">{services.find((s) => s.id === sid)?.name || sid}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={priceEdits[o.id]}
                          onChange={(e) => setPriceEdits((p) => ({ ...p, [o.id]: e.target.value }))}
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={async () => {
                          const newPrice = Number(priceEdits[o.id]);
                          if (isNaN(newPrice) || newPrice < 0) { toast.error("ثمن غير صالح"); return; }
                          await updateOrder(o.id, { totalPrice: newPrice } as any);
                          setPriceEdits((p) => { const n = { ...p }; delete n[o.id]; return n; });
                          toast.success("تم تعديل الثمن");
                        }}>حفظ</Button>
                      </div>
                    ) : (
                      <button onClick={() => setPriceEdits((p) => ({ ...p, [o.id]: o.totalPrice.toString() }))} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <span className="font-semibold text-primary">{o.totalPrice} DH</span>
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">{o.employeeName || "-"}</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => handleUpdateStatus(o.id, v as OrderStatus)}>
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
                  <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={async () => { await deleteOrder(o.id); toast.success("تم حذف الطلب"); }} className="lavage-glow">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
