import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Pause, Play, Download, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Shop {
  id: string;
  name: string;
  reference_code: string | null;
  owner_id: string;
  created_at: string;
  suspended: boolean;
  suspended_reason: string | null;
  owner_email?: string;
  member_count?: number;
}

export default function OwnerShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
  const [target, setTarget] = useState<Shop | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shops")
      .select("id,name,reference_code,owner_id,created_at,suspended,suspended_reason")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("تعذر تحميل المتاجر: " + error.message);
      setLoading(false);
      return;
    }
    // Member counts (best-effort, parallel)
    const enriched = await Promise.all(
      (data || []).map(async (s: any) => {
        const { count } = await supabase
          .from("shop_members")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", s.id);
        return { ...s, member_count: count ?? 0 } as Shop;
      })
    );
    setShops(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return shops.filter((s) => {
      if (filter === "active" && s.suspended) return false;
      if (filter === "suspended" && !s.suspended) return false;
      if (!q.trim()) return true;
      const k = q.toLowerCase();
      return (
        s.name?.toLowerCase().includes(k) ||
        s.reference_code?.toLowerCase().includes(k) ||
        s.id.includes(k)
      );
    });
  }, [shops, q, filter]);

  const exportCsv = () => {
    const rows = [
      ["ID", "Name", "Reference", "Suspended", "Reason", "Members", "Created"],
      ...filtered.map((s) => [
        s.id, s.name, s.reference_code ?? "", String(s.suspended),
        s.suspended_reason ?? "", String(s.member_count ?? 0), s.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shops-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openSuspend = (s: Shop) => {
    setTarget(s);
    setReason(s.suspended_reason ?? "");
    setConfirmText("");
  };

  const submitToggle = async () => {
    if (!target) return;
    const willSuspend = !target.suspended;
    if (willSuspend && confirmText.trim() !== target.name.trim()) {
      toast.error("اكتب اسم المتجر بالضبط للتأكيد");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("owner_set_shop_suspension", {
      _shop_id: target.id,
      _suspend: willSuspend,
      _reason: willSuspend ? reason : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("فشل: " + error.message);
      return;
    }
    toast.success(willSuspend ? "تم تجميد المتجر" : "تم تفعيل المتجر");
    setTarget(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المتاجر</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض، فلترة، وتجميد متاجر المنصة. كل عملية حساسة تُسجل في سجل التدقيق.
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير CSV
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم المرجع..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-9 h-11 bg-[hsl(220_25%_8%)] border-[hsl(220_20%_16%)]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "suspended"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="h-11"
            >
              {f === "all" ? "الكل" : f === "active" ? "نشط" : "مجمّد"}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            لا توجد متاجر مطابقة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(220_25%_9%)] border-b border-[hsl(220_20%_16%)]">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">المرجع</th>
                  <th className="text-right px-4 py-3 font-semibold">اسم المتجر</th>
                  <th className="text-right px-4 py-3 font-semibold">الأعضاء</th>
                  <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold">تاريخ الإنشاء</th>
                  <th className="text-center px-4 py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-[hsl(220_20%_12%)] hover:bg-[hsl(220_25%_9%)]">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {s.reference_code || s.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 tabular-nums">{s.member_count}</td>
                    <td className="px-4 py-3">
                      {s.suspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-500/10 text-red-400 border border-red-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          مجمّد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-green-500/10 text-green-400 border border-green-500/30">
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(s.created_at).toLocaleDateString("ar-MA")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant={s.suspended ? "default" : "outline"}
                        onClick={() => openSuspend(s)}
                        className="gap-1"
                      >
                        {s.suspended ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {s.suspended ? "تفعيل" : "تجميد"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.suspended ? "تفعيل المتجر" : "تجميد المتجر"}
            </DialogTitle>
            <DialogDescription>
              {target?.suspended
                ? `سيتم إعادة تفعيل المتجر "${target?.name}" والسماح للأعضاء بالوصول مجدداً.`
                : `سيتم تجميد المتجر "${target?.name}" ومنع كل العمليات الكتابية. هذه عملية محسوسة.`}
            </DialogDescription>
          </DialogHeader>
          {target && !target.suspended && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">سبب التجميد (إجباري)</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: مخالفة شروط الاستخدام، عدم سداد..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  للتأكيد، اكتب اسم المتجر: <span className="font-mono text-amber-400">{target.name}</span>
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={target.name}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={submitting}>
              إلغاء
            </Button>
            <Button
              onClick={submitToggle}
              disabled={
                submitting ||
                (target && !target.suspended && (!reason.trim() || confirmText.trim() !== target.name.trim()))
              }
              variant={target?.suspended ? "default" : "destructive"}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {target?.suspended ? "تفعيل" : "تأكيد التجميد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
