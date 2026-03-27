import { useApp } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function Invoices() {
  const { invoices, currentBranch } = useApp();
  const branchInvoices = invoices.filter((i) => i.branchId === (currentBranch?.id || ""));

  const handlePrint = (inv: typeof branchInvoices[0]) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html dir="rtl"><head><title>فاتورة #${inv.id}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:auto}
      h1{text-align:center;color:#1a3a5c}table{width:100%;border-collapse:collapse;margin:20px 0}
      td,th{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f0f0f0}
      .total{font-size:1.2em;font-weight:bold;text-align:center;margin-top:20px}</style></head>
      <body><h1>لافاج - فاتورة</h1>
      <p>العميل: ${inv.customerName}</p>
      <p>التاريخ: ${new Date(inv.createdAt).toLocaleDateString("ar-SA")}</p>
      <table><tr><th>الخدمة</th><th>السعر</th></tr>
      ${inv.services.map((s) => `<tr><td>${s.name}</td><td>${s.price} ر.س</td></tr>`).join("")}
      </table><p class="total">المجموع: ${inv.totalAmount} ر.س</p></body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الفواتير</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الخدمات</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>طباعة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد فواتير</TableCell></TableRow>
              ) : branchInvoices.map((inv, i) => (
                <TableRow key={inv.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{inv.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {inv.services.map((s, j) => <Badge key={j} variant="secondary">{s.name}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{inv.totalAmount} ر.س</TableCell>
                  <TableCell>
                    <Badge className={inv.isPaid ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                      {inv.isPaid ? "مدفوعة" : "غير مدفوعة"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(inv)}>
                      <Printer className="w-4 h-4" />
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
