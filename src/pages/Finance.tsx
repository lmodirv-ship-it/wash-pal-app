import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown, DollarSign, Download, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { KPICard } from "@/components/dashboard/KPICard";

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
}

const CATEGORIES = ["رواتب", "مواد تنظيف", "صيانة", "إيجار", "كهرباء", "أخرى"];

export default function Finance() {
  const { orders } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "رواتب", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setExpenses((data as Expense[]) || []);
  };
  useEffect(() => { load(); }, []);

  const completed = orders.filter(o => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + o.totalPrice, 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = revenue - totalExpenses;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

  const monthlyData = useMemo(() => {
    const byMonth = new Map<string, { rev: number; exp: number }>();
    completed.forEach(o => {
      const m = o.createdAt.slice(0, 7);
      const x = byMonth.get(m) || { rev: 0, exp: 0 };
      x.rev += o.totalPrice;
      byMonth.set(m, x);
    });
    expenses.forEach(e => {
      const m = e.expense_date.slice(0, 7);
      const x = byMonth.get(m) || { rev: 0, exp: 0 };
      x.exp += Number(e.amount);
      byMonth.set(m, x);
    });
    return [...byMonth.entries()].sort().slice(-6);
  }, [completed, expenses]);

  const submit = async () => {
    if (!form.title || !form.amount) { toast.error("املأ الحقول"); return; }
    const { error } = await supabase.from("expenses").insert({
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      notes: form.notes || null,
    });
    if (error) { toast.error("خطأ: " + error.message); return; }
    toast.success("تمت إضافة المصروف");
    setForm({ title: "", amount: "", category: "رواتب", notes: "" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    toast.success("حُذف");
    load();
  };

  const exportCSV = () => {
    const rows = [
      ["النوع", "العنوان", "المبلغ", "التصنيف", "التاريخ"],
      ...completed.map(o => ["إيراد", `طلب ${o.carPlate}`, o.totalPrice, "غسيل", o.createdAt.slice(0, 10)]),
      ...expenses.map(e => ["مصروف", e.title, e.amount, e.category, e.expense_date.slice(0, 10)]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `finance-${Date.now()}.csv`; a.click();
    toast.success("تم التصدير");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">المالية</h1>
          <p className="text-sm text-muted-foreground">الإيرادات، المصروفات، والأرباح</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="rounded-xl">
            <Download className="w-4 h-4 ml-1" /> تصدير CSV
          </Button>
          <Button onClick={() => setOpen(true)} className="rounded-xl" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="w-4 h-4 ml-1" /> مصروف جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="إجمالي الإيرادات" value={`${revenue.toLocaleString()} ر.س`} icon={TrendingUp} accent="success" />
        <KPICard label="إجمالي المصروفات" value={`${totalExpenses.toLocaleString()} ر.س`} icon={TrendingDown} accent="warning" />
        <KPICard label="صافي الربح" value={`${profit.toLocaleString()} ر.س`} icon={DollarSign} accent={profit >= 0 ? "primary" : "warning"} />
        <KPICard label="هامش الربح" value={`${margin}%`} icon={Receipt} accent="info" />
      </div>

      {/* Monthly breakdown */}
      <Card className="p-6 rounded-2xl">
        <h2 className="font-bold mb-4">الأداء الشهري</h2>
        <div className="space-y-3">
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : monthlyData.map(([month, { rev, exp }]) => {
            const p = rev - exp;
            const max = Math.max(rev, exp, 1);
            return (
              <div key={month} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{month}</span>
                  <span className={p >= 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                    {p >= 0 ? "+" : ""}{p.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="bg-success rounded-full" style={{ width: `${(rev / max) * 100}%` }} />
                  <div className="bg-destructive rounded-full" style={{ width: `${(exp / max) * 100}%` }} />
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>إيراد: {rev.toLocaleString()}</span>
                  <span>مصروف: {exp.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expenses list */}
      <Card className="p-6 rounded-2xl">
        <h2 className="font-bold mb-4">المصروفات الأخيرة</h2>
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد مصروفات. أضف أول مصروف.</p>
          ) : expenses.slice(0, 20).map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{e.title}</p>
                  <Badge variant="outline" className="text-xs">{e.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(e.expense_date).toLocaleDateString("ar-SA")}</p>
              </div>
              <span className="font-bold text-destructive ml-4">-{Number(e.amount).toLocaleString()} ر.س</span>
              <Button variant="ghost" size="icon" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة مصروف</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="عنوان المصروف" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input type="number" placeholder="المبلغ" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <Button onClick={submit} className="w-full rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
