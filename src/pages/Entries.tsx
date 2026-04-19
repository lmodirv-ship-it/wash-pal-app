import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, Search } from "lucide-react";

export default function Entries() {
  const { orders, employees, services } = useApp();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const empById = useMemo(() => {
    const m = new Map<string, { reference?: string; name: string }>();
    employees.forEach((e) => m.set(e.id, { reference: e.reference, name: e.name }));
    return m;
  }, [employees]);

  const svcById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [services]);

  const rows = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : 0;
    const toTs = to ? new Date(to).getTime() + 86400000 : Infinity;
    const q = search.trim().toLowerCase();

    return [...orders]
      .filter((o) => {
        const ts = new Date(o.createdAt).getTime();
        if (ts < fromTs || ts > toTs) return false;
        if (!q) return true;
        const empRef = (o.employeeId && empById.get(o.employeeId)?.reference) || "";
        return (
          o.customerName?.toLowerCase().includes(q) ||
          o.carPlate?.toLowerCase().includes(q) ||
          o.employeeName?.toLowerCase().includes(q) ||
          o.reference?.toLowerCase().includes(q) ||
          empRef.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((o) => {
        const emp = o.employeeId ? empById.get(o.employeeId) : undefined;
        const svcNames = (o.services || []).map((id) => svcById.get(id) || id).join("، ");
        const d = new Date(o.createdAt);
        return {
          orderRef: o.reference || "—",
          empRef: emp?.reference || "—",
          empName: emp?.name || o.employeeName || "—",
          date: d.toLocaleDateString("fr-FR"),
          time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          customer: o.customerName,
          plate: o.carPlate,
          carType: o.carType === "large" ? "كبيرة" : "صغيرة",
          services: svcNames,
          price: Number(o.totalPrice || 0),
          status: o.status,
        };
      });
  }, [orders, empById, svcById, search, from, to]);

  const statusLabel: Record<string, string> = {
    waiting: "انتظار",
    in_progress: "جاري",
    completed: "مكتمل",
    cancelled: "ملغي",
  };
  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    waiting: "outline",
    in_progress: "secondary",
    completed: "default",
    cancelled: "destructive",
  };

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "مرجع العملية": r.orderRef,
      "مرجع الموظف": r.empRef,
      "الموظف": r.empName,
      "التاريخ": r.date,
      "الوقت": r.time,
      "الزبون": r.customer,
      "اللوحة": r.plate,
      "نوع السيارة": r.carType,
      "الخدمات": r.services,
      "السعر (DH)": r.price,
      "الحالة": statusLabel[r.status] || r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المداخل");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `entries-${stamp}.xlsx`);
  };

  const total = rows.reduce((s, r) => s + r.price, 0);

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المداخل</h1>
          <p className="text-sm text-muted-foreground">سجل كل العمليات التي يقوم بها الموظفون</p>
        </div>
        <Button onClick={exportExcel} className="gap-2" disabled={rows.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />
          تصدير Excel
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، اللوحة، مرجع الموظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">من</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">إلى</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      <Card className="p-3 flex flex-wrap items-center gap-4">
        <div className="text-sm">
          <span className="text-muted-foreground">عدد المداخل:</span>{" "}
          <span className="font-bold text-foreground">{rows.length}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">إجمالي المبلغ:</span>{" "}
          <span className="font-bold text-primary">{total.toFixed(2)} DH</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">مرجع الموظف</TableHead>
              <TableHead className="text-right">الموظف</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الوقت</TableHead>
              <TableHead className="text-right">الزبون</TableHead>
              <TableHead className="text-right">اللوحة</TableHead>
              <TableHead className="text-right">السيارة</TableHead>
              <TableHead className="text-right">الخدمات</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  لا توجد مداخل لعرضها
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.empRef}</TableCell>
                  <TableCell className="font-medium">{r.empName}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{r.time}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell className="font-mono">{r.plate}</TableCell>
                  <TableCell>{r.carType}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={r.services}>
                    {r.services}
                  </TableCell>
                  <TableCell className="font-bold text-primary whitespace-nowrap">
                    {r.price.toFixed(2)} DH
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status] || "outline"}>
                      {statusLabel[r.status] || r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
