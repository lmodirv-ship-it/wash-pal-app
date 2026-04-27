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
import { useTranslation } from "react-i18next";
import { getServiceName } from "@/lib/serviceI18n";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { EtaBadge } from "@/components/EtaBadge";

export default function Orders() {
  const { orders, services, employees, currentBranch, currentShopId, addOrder, updateOrder, deleteOrder, addInvoice } = useApp();
  useRealtimeOrders(currentShopId);
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";

  const statusMap: Record<string, { label: string; color: string }> = {
    waiting: { label: t("dashboard.waiting"), color: "bg-warning text-warning-foreground" },
    in_progress: { label: t("dashboard.inProgress"), color: "bg-primary text-primary-foreground" },
    completed: { label: t("dashboard.completed"), color: "bg-success text-success-foreground" },
    cancelled: { label: t("dashboard.cancelled"), color: "bg-destructive text-destructive-foreground" },
  };
  const carSizeLabel = (s: string) => s === "large" ? t("orders.large") : s === "small" ? t("orders.small") : s;
  const carSizeBadge = (s: string) => s === "large" ? "bg-warning/10 text-warning border-warning/30" : "bg-primary/10 text-primary border-primary/20";

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
      toast.error(t("common.fillRequired")); return;
    }
    const emp = employees.find((e) => e.id === form.employeeId);
    await addOrder({
      customerId: "", customerName: form.customerName, carType: form.carType, carPlate: form.carPlate,
      services: form.selectedServices, totalPrice, status: "waiting",
      employeeId: form.employeeId || undefined, employeeName: emp?.name, branchId, notes: form.notes || undefined,
    });
    setForm({ customerName: "", carType: "small", carPlate: "", selectedServices: [], employeeId: "", notes: "", customPrice: "" });
    setDialogOpen(false);
    toast.success(t("orders.orderAdded"));
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === id);
    await updateOrder(id, { status, completedAt: status === "completed" ? new Date().toISOString() : undefined });
    if (status === "completed" && order) {
      await addInvoice({
        orderId: order.id, customerName: order.customerName,
        services: order.services.map((sid) => { const svc = services.find((s) => s.id === sid); return { name: svc ? getServiceName(svc, i18n.language) : "", price: svc?.price || 0 }; }),
        totalAmount: order.totalPrice, paidAmount: order.totalPrice, isPaid: true,
        createdAt: new Date().toISOString(), branchId: order.branchId,
      });
    }
    toast.success(t("orders.statusUpdated"));
  };

  const branchEmployees = employees.filter((e) => e.branchId === branchId && e.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t("orders.title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 mx-2" />{t("orders.newOrder")}</Button></DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle>{t("orders.addNew")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("orders.customerName")} value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.carType} onValueChange={(v) => setForm((f) => ({ ...f, carType: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("orders.carType")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t("orders.small")}</SelectItem>
                    <SelectItem value="large">{t("orders.large")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder={t("orders.carPlate")} value={form.carPlate} onChange={(e) => setForm((f) => ({ ...f, carPlate: e.target.value }))} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-foreground">{t("orders.selectServices")}</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {services.filter((s) => s.isActive).map((s) => (
                    <Button key={s.id} variant={form.selectedServices.includes(s.id) ? "default" : "outline"} size="sm" onClick={() => toggleService(s.id)} className="lavage-glow">
                      {s.name} - {s.price} {t("common.currency")}
                    </Button>
                  ))}
                </div>
              </div>
              {branchEmployees.length > 0 && (
                <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("orders.assignEmployee")} /></SelectTrigger>
                  <SelectContent>{branchEmployees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
                </Select>
              )}
              <Textarea placeholder={`${t("common.notes")} (${t("common.optional")})`} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t("orders.finalPrice")}</span>
                <Input type="number" placeholder={`${t("orders.default")}: ${baseTotal}`} value={form.customPrice} onChange={(e) => setForm((f) => ({ ...f, customPrice: e.target.value }))} className="flex-1" />
                <span className="text-sm font-bold text-primary">{t("common.currency")}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-primary">{t("orders.totalLabel")}: {totalPrice} {t("common.currency")}</p>
                <Button onClick={handleSubmit} className="lavage-btn">{t("orders.addOrder")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pe-9" placeholder={t("orders.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.selectAll")}</SelectItem>
            <SelectItem value="waiting">{t("dashboard.waiting")}</SelectItem>
            <SelectItem value="in_progress">{t("dashboard.inProgress")}</SelectItem>
            <SelectItem value="completed">{t("dashboard.completed")}</SelectItem>
            <SelectItem value="cancelled">{t("dashboard.cancelled")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={carSizeFilter} onValueChange={setCarSizeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.selectAllTypes")}</SelectItem>
            <SelectItem value="small">{t("orders.small")}</SelectItem>
            <SelectItem value="large">{t("orders.large")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">{t("common.reference")}</TableHead>
              <TableHead className="text-muted-foreground">{t("orders.customer")}</TableHead>
              <TableHead className="text-muted-foreground">{t("orders.plate")}</TableHead>
              <TableHead className="text-muted-foreground">{t("orders.carType")}</TableHead>
              <TableHead className="text-muted-foreground">{t("orders.services")}</TableHead>
              <TableHead className="text-muted-foreground">{t("orders.price")}</TableHead>
              <TableHead className="text-muted-foreground">{t("orders.employee")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.status")}</TableHead>
              <TableHead className="text-muted-foreground">ETA</TableHead>
              <TableHead className="text-muted-foreground">{t("common.date")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchOrders.length === 0 ? (
              <TableRow className="border-border"><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">{t("orders.noOrders")}</TableCell></TableRow>
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
                      {o.services.map((sid) => { const sv = services.find((s) => s.id === sid); return <Badge key={sid} variant="secondary" className="text-xs">{sv ? getServiceName(sv, i18n.language) : sid}</Badge>; })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input type="number" value={priceEdits[o.id]} onChange={(e) => setPriceEdits((p) => ({ ...p, [o.id]: e.target.value }))} className="w-20 h-8 text-sm" autoFocus />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={async () => {
                          const newPrice = Number(priceEdits[o.id]);
                          if (isNaN(newPrice) || newPrice < 0) { toast.error(t("orders.invalidPrice")); return; }
                          await updateOrder(o.id, { totalPrice: newPrice } as any);
                          setPriceEdits((p) => { const n = { ...p }; delete n[o.id]; return n; });
                          toast.success(t("orders.priceUpdated"));
                        }}>{t("common.save")}</Button>
                      </div>
                    ) : (
                      <button onClick={() => setPriceEdits((p) => ({ ...p, [o.id]: o.totalPrice.toString() }))} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <span className="font-semibold text-primary">{o.totalPrice} {t("common.currency")}</span>
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
                        <SelectItem value="waiting">{t("dashboard.waiting")}</SelectItem>
                        <SelectItem value="in_progress">{t("dashboard.inProgress")}</SelectItem>
                        <SelectItem value="completed">{t("dashboard.completed")}</SelectItem>
                        <SelectItem value="cancelled">{t("dashboard.cancelled")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <EtaBadge expectedEndAt={o.expectedEndAt} status={o.status} compact />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString(locale)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={async () => { await deleteOrder(o.id); toast.success(t("orders.orderDeleted")); }} className="lavage-glow">
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
