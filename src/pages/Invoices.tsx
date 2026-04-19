import { useApp } from "@/contexts/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Invoices() {
  const { invoices, currentBranch } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const branchInvoices = invoices.filter((i) => i.branchId === (currentBranch?.id || ""));

  const handlePrint = (inv: typeof branchInvoices[0]) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html dir="${i18n.language === "ar" ? "rtl" : "ltr"}"><head><title>${t("invoices.invoiceTitle")} #${inv.id}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:auto;background:#0a0a0a;color:#fff}
      h1{text-align:center;color:#facc15}table{width:100%;border-collapse:collapse;margin:20px 0}
      td,th{border:1px solid #333;padding:8px}th{background:#1a1a2e;color:#facc15}
      .total{font-size:1.2em;font-weight:bold;text-align:center;margin-top:20px;color:#facc15}</style></head>
      <body><h1>H&Lavage - ${t("invoices.invoiceTitle")}</h1>
      <p>${t("invoices.customer")}: ${inv.customerName}</p>
      <p>${t("common.date")}: ${new Date(inv.createdAt).toLocaleDateString(locale)}</p>
      <table><tr><th>${t("orders.services")}</th><th>${t("common.price")}</th></tr>
      ${inv.services.map((s) => `<tr><td>${s.name}</td><td>${s.price} DH</td></tr>`).join("")}
      </table><p class="total">${t("common.total")}: ${inv.totalAmount} DH</p></body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("invoices.title")}</h1>
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
                  <Button variant="ghost" size="icon" onClick={() => handlePrint(inv)} className="lavage-glow">
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
