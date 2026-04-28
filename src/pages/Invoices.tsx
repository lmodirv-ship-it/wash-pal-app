import { useApp } from "@/contexts/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Invoice } from "@/types";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function Invoices() {
  const { invoices, currentBranch, services, customers, addInvoice } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const branchInvoices = invoices.filter((i) => i.branchId === (currentBranch?.id || ""));
  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services]);

  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string>("walkin");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [paid, setPaid] = useState(true);
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(
    () => activeServices.filter((s) => selectedIds.includes(s.id)).reduce((sum, s) => sum + Number(s.price || 0), 0),
    [activeServices, selectedIds],
  );
  const discountAmount = Math.round((subtotal * Math.min(Math.max(discountPct, 0), 100)) / 100 * 100) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  const resetForm = () => {
    setCustomerName(""); setCustomerId("walkin"); setSelectedIds([]);
    setDiscountPct(0); setPaid(true);
  };

  const toggleService = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const printReceipt = (params: {
    customerName: string;
    services: { name: string; price: number }[];
    subtotal: number;
    discountPct: number;
    discountAmount: number;
    total: number;
    isPaid: boolean;
    createdAt: string;
    reference?: string;
  }) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    const cur = t("common.currency", { defaultValue: "DH" });
    w.document.write(`
      <html dir="${dir}"><head><title>${t("invoices.invoiceTitle", { defaultValue: "فاتورة" })} ${esc(params.reference || "")}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;max-width:680px;margin:auto;background:#0a0a0a;color:#fff}
        h1{text-align:center;color:#facc15;margin:0 0 4px}
        .sub{text-align:center;color:#9ca3af;margin-bottom:20px;font-size:13px}
        .meta{display:flex;justify-content:space-between;font-size:14px;margin:8px 0;color:#d1d5db}
        table{width:100%;border-collapse:collapse;margin:18px 0}
        td,th{border:1px solid #333;padding:8px;text-align:${dir === "rtl" ? "right" : "left"}}
        th{background:#1a1a2e;color:#facc15}
        .totals{margin-top:14px;font-size:14px}
        .totals .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #333}
        .totals .grand{font-size:1.3em;font-weight:bold;color:#facc15;border-bottom:none;margin-top:6px}
        .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;margin-${dir === "rtl" ? "right" : "left"}:8px}
        .paid{background:#16a34a;color:#fff}.unpaid{background:#f59e0b;color:#000}
        @media print{body{background:#fff;color:#000}h1{color:#000}th{background:#eee;color:#000}}
      </style></head>
      <body>
        <h1>H&Lavage</h1>
        <div class="sub">${t("invoices.invoiceTitle", { defaultValue: "فاتورة" })} ${esc(params.reference || "")}</div>
        <div class="meta"><span>${t("invoices.customer")}: <b>${esc(params.customerName)}</b></span>
          <span>${t("common.date")}: ${new Date(params.createdAt).toLocaleString(locale)}</span></div>
        <table>
          <tr><th>${t("orders.services")}</th><th>${t("common.price")}</th></tr>
          ${params.services.map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(s.price)} ${cur}</td></tr>`).join("")}
        </table>
        <div class="totals">
          <div class="row"><span>${t("common.subtotal", { defaultValue: "المجموع الفرعي" })}</span><span>${params.subtotal} ${cur}</span></div>
          <div class="row"><span>${t("common.discount", { defaultValue: "الخصم" })} (${params.discountPct}%)</span><span>- ${params.discountAmount} ${cur}</span></div>
          <div class="row grand"><span>${t("common.total")}</span><span>${params.total} ${cur}</span></div>
          <div style="text-align:center;margin-top:10px">
            <span class="badge ${params.isPaid ? "paid" : "unpaid"}">${params.isPaid ? t("invoices.paid") : t("invoices.unpaid")}</span>
          </div>
        </div>
        <p style="text-align:center;margin-top:24px;color:#9ca3af;font-size:12px">${t("invoices.thankYou", { defaultValue: "شكراً لتعاملكم معنا" })}</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  const handlePrintExisting = (inv: Invoice) => {
    printReceipt({
      customerName: inv.customerName,
      services: inv.services,
      subtotal: inv.totalAmount,
      discountPct: 0,
      discountAmount: 0,
      total: inv.totalAmount,
      isPaid: inv.isPaid,
      createdAt: inv.createdAt,
      reference: `#${inv.id.slice(0, 6)}`,
    });
  };

  const handleCreate = async () => {
    if (!currentBranch) { toast.error(t("invoices.noBranch", { defaultValue: "لا يوجد فرع نشط" })); return; }
    if (selectedIds.length === 0) { toast.error(t("invoices.selectServices", { defaultValue: "اختر خدمة واحدة على الأقل" })); return; }
    const name = (customerId !== "walkin" ? customers.find((c) => c.id === customerId)?.name : customerName).trim() || t("invoices.walkIn", { defaultValue: "زبون عابر" });
    const items = activeServices.filter((s) => selectedIds.includes(s.id)).map((s) => ({ name: s.nameAr || s.name, price: Number(s.price) }));
    setSaving(true);
    try {
      await addInvoice({
        orderId: crypto.randomUUID(),
        customerName: name,
        services: items,
        totalAmount: total,
        paidAmount: paid ? total : 0,
        isPaid: paid,
        createdAt: new Date().toISOString(),
        branchId: currentBranch.id,
      });
      toast.success(t("invoices.created", { defaultValue: "تم إنشاء الفاتورة" }));
      printReceipt({
        customerName: name, services: items, subtotal, discountPct, discountAmount, total,
        isPaid: paid, createdAt: new Date().toISOString(),
      });
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || t("common.error", { defaultValue: "خطأ" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">{t("invoices.title")}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 lavage-glow">
              <Plus className="w-4 h-4" />
              {t("invoices.newInvoice", { defaultValue: "فاتورة جديدة" })}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("invoices.newInvoice", { defaultValue: "فاتورة جديدة" })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("invoices.customer")}</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walkin">{t("invoices.walkIn", { defaultValue: "زبون عابر" })}</SelectItem>
                      {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {customerId === "walkin" && (
                  <div>
                    <Label>{t("invoices.customerName", { defaultValue: "اسم الزبون" })}</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={100} placeholder="..." />
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block">{t("orders.services")}</Label>
                <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
                  {activeServices.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">{t("invoices.noServices", { defaultValue: "لا توجد خدمات" })}</p>
                  ) : activeServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/40">
                      <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                      <span className="flex-1 text-sm">{s.nameAr || s.name}</span>
                      <span className="text-sm font-semibold text-primary">{s.price} {t("common.currency")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("common.discount", { defaultValue: "خصم" })} (%)</Label>
                  <Input type="number" min={0} max={100} value={discountPct}
                    onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={paid} onCheckedChange={(v) => setPaid(!!v)} />
                    <span className="text-sm">{t("invoices.markPaid", { defaultValue: "مدفوعة" })}</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 bg-secondary/30 space-y-1 text-sm">
                <div className="flex justify-between"><span>{t("common.subtotal", { defaultValue: "المجموع الفرعي" })}</span><span>{subtotal} {t("common.currency")}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("common.discount", { defaultValue: "الخصم" })}</span><span>- {discountAmount} {t("common.currency")}</span></div>
                <div className="flex justify-between text-lg font-bold text-primary pt-1 border-t border-border"><span>{t("common.total")}</span><span>{total} {t("common.currency")}</span></div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel", { defaultValue: "إلغاء" })}</Button>
              <Button onClick={handleCreate} disabled={saving} className="gap-2">
                <Printer className="w-4 h-4" />
                {saving ? "..." : t("invoices.createAndPrint", { defaultValue: "إنشاء وطباعة" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">{t("invoices.customer")}</TableHead>
              <TableHead className="text-muted-foreground">{t("invoices.servicesCol")}</TableHead>
              <TableHead className="text-muted-foreground">{t("invoices.amount")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.status")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.date")}</TableHead>
              <TableHead className="text-muted-foreground">{t("invoices.printCol")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchInvoices.length === 0 ? (
              <TableRow className="border-border"><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("invoices.noInvoices")}</TableCell></TableRow>
            ) : branchInvoices.map((inv, i) => (
              <TableRow key={inv.id} className="lavage-table-row border-border">
                <TableCell className="text-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium text-foreground">{inv.customerName}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {inv.services.map((s, j) => <Badge key={j} variant="secondary">{s.name}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-primary">{inv.totalAmount} {t("common.currency")}</TableCell>
                <TableCell>
                  <Badge className={inv.isPaid ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                    {inv.isPaid ? t("invoices.paid") : t("invoices.unpaid")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString(locale)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handlePrintExisting(inv)} className="lavage-glow">
                    <Printer className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
