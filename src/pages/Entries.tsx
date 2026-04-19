import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, FileSpreadsheet, Search, Printer, X, ArrowUp, ArrowDown,
  Receipt, DollarSign, TrendingUp, Users, UserCheck, Trophy,
  ChevronLeft, ChevronRight,
} from "lucide-react";

type SortKey = "date" | "empName" | "price" | "status";
type SortDir = "asc" | "desc";

export default function Entries() {
  const { orders, employees, services, branches } = useApp();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [empFilter, setEmpFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const branchById = useMemo(() => {
    const m = new Map<string, string>();
    branches.forEach((b) => m.set(b.id, b.name));
    return m;
  }, [branches]);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  const setQuickRange = (preset: "today" | "yesterday" | "week" | "month") => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (preset === "today") {
      setFrom(fmt(now)); setTo(fmt(now));
    } else if (preset === "yesterday") {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      setFrom(fmt(y)); setTo(fmt(y));
    } else if (preset === "week") {
      const w = new Date(now); w.setDate(w.getDate() - 6);
      setFrom(fmt(w)); setTo(fmt(now));
    } else if (preset === "month") {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(fmt(m)); setTo(fmt(now));
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setFrom(""); setTo(""); setEmpFilter("all"); setStatusFilter("all"); setBranchFilter("all"); setPage(1);
  };

  const allRows = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : 0;
    const toTs = to ? new Date(to).getTime() + 86400000 : Infinity;
    const q = search.trim().toLowerCase();

    return orders
      .filter((o) => {
        const ts = new Date(o.createdAt).getTime();
        if (ts < fromTs || ts > toTs) return false;
        if (empFilter !== "all" && o.employeeId !== empFilter) return false;
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
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
      .map((o) => {
        const emp = o.employeeId ? empById.get(o.employeeId) : undefined;
        const svcNames = (o.services || []).map((id) => svcById.get(id) || id).join("، ");
        const d = new Date(o.createdAt);
        return {
          id: o.id,
          orderRef: o.reference || "—",
          empId: o.employeeId || "",
          empRef: emp?.reference || "—",
          empName: emp?.name || o.employeeName || "—",
          dateTs: d.getTime(),
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
  }, [orders, empById, svcById, search, from, to, empFilter, statusFilter]);

  const sortedRows = useMemo(() => {
    const arr = [...allRows];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.dateTs - b.dateTs;
      else if (sortKey === "price") cmp = a.price - b.price;
      else if (sortKey === "empName") cmp = a.empName.localeCompare(b.empName);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [allRows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortDir === "asc"
      ? <ArrowUp className="inline h-3 w-3 mr-1" />
      : <ArrowDown className="inline h-3 w-3 mr-1" />;

  // KPIs
  const kpis = useMemo(() => {
    const total = allRows.reduce((s, r) => s + r.price, 0);
    const count = allRows.length;
    const avg = count > 0 ? total / count : 0;
    const customers = new Set(allRows.map((r) => `${r.customer}|${r.plate}`)).size;
    const activeEmps = new Set(allRows.filter((r) => r.empId).map((r) => r.empId)).size;
    return { total, count, avg, customers, activeEmps };
  }, [allRows]);

  // Top performers
  const topPerformers = useMemo(() => {
    const map = new Map<string, { name: string; ref: string; count: number; revenue: number }>();
    allRows.forEach((r) => {
      const key = r.empId || r.empName;
      const cur = map.get(key) || { name: r.empName, ref: r.empRef, count: 0, revenue: 0 };
      cur.count += 1; cur.revenue += r.price;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [allRows]);

  const statusLabel: Record<string, string> = {
    waiting: "انتظار", in_progress: "جاري", completed: "مكتمل", cancelled: "ملغي",
  };
  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    waiting: "outline", in_progress: "secondary", completed: "default", cancelled: "destructive",
  };

  const exportExcel = () => {
    const data = sortedRows.map((r) => ({
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
    data.push({
      "مرجع العملية": "", "مرجع الموظف": "", "الموظف": "", "التاريخ": "",
      "الوقت": "", "الزبون": "", "اللوحة": "", "نوع السيارة": "",
      "الخدمات": "المجموع", "السعر (DH)": kpis.total, "الحالة": "",
    } as any);
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 8 },
      { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 32 }, { wch: 12 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المداخل");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `entries-${stamp}.xlsx`);
  };

  const printPage = () => window.print();

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <style>{`@media print {
        .no-print { display: none !important; }
        .print-area { box-shadow: none !important; border: none !important; }
      }`}</style>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المداخل</h1>
          <p className="text-sm text-muted-foreground">سجل كل العمليات التي يقوم بها الموظفون</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={printPage} variant="outline" className="gap-2" disabled={sortedRows.length === 0}>
            <Printer className="h-4 w-4" /> طباعة PDF
          </Button>
          <Button onClick={exportExcel} className="gap-2" disabled={sortedRows.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> تصدير Excel <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiBox icon={<Receipt className="h-4 w-4" />} label="إجمالي المداخل" value={kpis.count.toString()} />
        <KpiBox icon={<DollarSign className="h-4 w-4" />} label="إجمالي الإيرادات" value={`${kpis.total.toFixed(2)} DH`} accent />
        <KpiBox icon={<TrendingUp className="h-4 w-4" />} label="متوسط المدخل" value={`${kpis.avg.toFixed(2)} DH`} />
        <KpiBox icon={<Users className="h-4 w-4" />} label="العملاء الفريدون" value={kpis.customers.toString()} />
        <KpiBox icon={<UserCheck className="h-4 w-4" />} label="موظفون نشطون" value={kpis.activeEmps.toString()} />
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3 no-print">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، اللوحة، مرجع الموظف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-9"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">من</label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">إلى</label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">الموظف</label>
            <Select value={empFilter} onValueChange={(v) => { setEmpFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الموظفين</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.reference ? `${e.reference} — ` : ""}{e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">الحالة</label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="waiting">انتظار</SelectItem>
                <SelectItem value="in_progress">جاري</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => setQuickRange("today")}>اليوم</Button>
          <Button size="sm" variant="outline" onClick={() => setQuickRange("yesterday")}>أمس</Button>
          <Button size="sm" variant="outline" onClick={() => setQuickRange("week")}>آخر 7 أيام</Button>
          <Button size="sm" variant="outline" onClick={() => setQuickRange("month")}>هذا الشهر</Button>
          <Button size="sm" variant="ghost" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" /> مسح الفلاتر
          </Button>
        </div>
      </Card>

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">أفضل الموظفين</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {topPerformers.map((p, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">#{i + 1}</span>
                  <span className="text-xs text-muted-foreground font-mono">{p.ref}</span>
                </div>
                <div className="font-semibold text-sm truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.count} عملية</div>
                <div className="text-sm font-bold text-primary">{p.revenue.toFixed(2)} DH</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden print-area">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">مرجع الموظف</TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("empName")}>
                <SortIcon k="empName" />الموظف
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("date")}>
                <SortIcon k="date" />التاريخ
              </TableHead>
              <TableHead className="text-right">الوقت</TableHead>
              <TableHead className="text-right">الزبون</TableHead>
              <TableHead className="text-right">اللوحة</TableHead>
              <TableHead className="text-right">السيارة</TableHead>
              <TableHead className="text-right">الخدمات</TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("price")}>
                <SortIcon k="price" />السعر
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("status")}>
                <SortIcon k="status" />الحالة
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  لا توجد مداخل لعرضها
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.empRef}</TableCell>
                  <TableCell className="font-medium">{r.empName}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{r.time}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell className="font-mono">{r.plate}</TableCell>
                  <TableCell>{r.carType}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={r.services}>{r.services}</TableCell>
                  <TableCell className="font-bold text-primary whitespace-nowrap">{r.price.toFixed(2)} DH</TableCell>
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

      {/* Pagination */}
      {sortedRows.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 no-print">
          <div className="text-sm text-muted-foreground">
            عرض {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sortedRows.length)} من {sortedRows.length}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{safePage} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        {icon}<span>{label}</span>
      </div>
      <div className={`text-lg font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
    </Card>
  );
}
