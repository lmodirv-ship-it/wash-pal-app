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
import { useTranslation } from "react-i18next";

interface Expense {
  id: string; title: string; amount: number; category: string;
  expense_date: string; notes: string | null;
}

export default function Finance() {
  const { orders } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);

  const CATEGORIES = [
    t("finance.categories.salaries"), t("finance.categories.supplies"),
    t("finance.categories.maintenance"), t("finance.categories.rent"),
    t("finance.categories.electricity"), t("finance.categories.other"),
  ];

  const [form, setForm] = useState({ title: "", amount: "", category: CATEGORIES[0], notes: "" });

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
      x.rev += o.totalPrice; byMonth.set(m, x);
    });
    expenses.forEach(e => {
      const m = e.expense_date.slice(0, 7);
      const x = byMonth.get(m) || { rev: 0, exp: 0 };
      x.exp += Number(e.amount); byMonth.set(m, x);
    });
    return [...byMonth.entries()].sort().slice(-6);
  }, [completed, expenses]);

  const submit = async () => {
    if (!form.title || !form.amount) { toast.error(t("finance.fillFields")); return; }
    const { error } = await supabase.from("expenses").insert({
      title: form.title, amount: Number(form.amount), category: form.category, notes: form.notes || null,
    });
    if (error) { toast.error(t("common.error") + ": " + error.message); return; }
    toast.success(t("finance.expenseAdded"));
    setForm({ title: "", amount: "", category: CATEGORIES[0], notes: "" });
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    toast.success(t("finance.deleted")); load();
  };

  const exportCSV = () => {
    const rows = [
      [t("common.status"), t("finance.expenseTitle"), t("finance.amount"), t("services.category"), t("common.date")],
      ...completed.map(o => [t("finance.revenue"), `${o.carPlate}`, o.totalPrice, t("nav.services"), o.createdAt.slice(0, 10)]),
      ...expenses.map(e => [t("finance.expense"), e.title, e.amount, e.category, e.expense_date.slice(0, 10)]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `finance-${Date.now()}.csv`; a.click();
    toast.success(t("finance.exported"));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("finance.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("finance.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="rounded-xl">
            <Download className="w-4 h-4 mx-1" /> {t("finance.exportCSV")}
          </Button>
          <Button onClick={() => setOpen(true)} className="rounded-xl" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="w-4 h-4 mx-1" /> {t("finance.newExpense")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label={t("finance.totalRevenue")} value={`${revenue.toLocaleString()} ${t("common.currency")}`} icon={TrendingUp} accent="success" />
        <KPICard label={t("finance.totalExpenses")} value={`${totalExpenses.toLocaleString()} ${t("common.currency")}`} icon={TrendingDown} accent="warning" />
        <KPICard label={t("finance.netProfit")} value={`${profit.toLocaleString()} ${t("common.currency")}`} icon={DollarSign} accent={profit >= 0 ? "primary" : "warning"} />
        <KPICard label={t("finance.profitMargin")} value={`${margin}%`} icon={Receipt} accent="info" />
      </div>

      <Card className="p-6 rounded-2xl">
        <h2 className="font-bold mb-4">{t("finance.monthlyPerformance")}</h2>
        <div className="space-y-3">
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("finance.noData")}</p>
          ) : monthlyData.map(([month, { rev, exp }]) => {
            const p = rev - exp;
            const max = Math.max(rev, exp, 1);
            return (
              <div key={month} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{month}</span>
                  <span className={p >= 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                    {p >= 0 ? "+" : ""}{p.toLocaleString()} {t("common.currency")}
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="bg-success rounded-full" style={{ width: `${(rev / max) * 100}%` }} />
                  <div className="bg-destructive rounded-full" style={{ width: `${(exp / max) * 100}%` }} />
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{t("finance.revenue")}: {rev.toLocaleString()}</span>
                  <span>{t("finance.expense")}: {exp.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 rounded-2xl">
        <h2 className="font-bold mb-4">{t("finance.recentExpenses")}</h2>
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("finance.noExpenses")}</p>
          ) : expenses.slice(0, 20).map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{e.title}</p>
                  <Badge variant="outline" className="text-xs">{e.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(e.expense_date).toLocaleDateString(locale)}</p>
              </div>
              <span className="font-bold text-destructive mx-4">-{Number(e.amount).toLocaleString()} {t("common.currency")}</span>
              <Button variant="ghost" size="icon" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("finance.addExpense")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t("finance.expenseTitle")} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input type="number" placeholder={t("finance.amount")} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input placeholder={`${t("common.notes")} (${t("common.optional")})`} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <Button onClick={submit} className="w-full rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
