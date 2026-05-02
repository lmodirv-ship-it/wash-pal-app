import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Pause, Play, Download, Loader2, AlertTriangle, Eye, RefreshCw, ScanEye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TableSkeleton } from "@/components/PageSkeleton";
import { rowsToCsv, downloadCsv, logExport } from "@/lib/exportCsv";
import { toast } from "sonner";
import { useImpersonation } from "@/contexts/ImpersonationContext";

interface Shop {
  id: string;
  name: string;
  reference_code: string | null;
  owner_id: string;
  created_at: string;
  suspended: boolean;
  suspended_reason: string | null;
  member_count?: number;
}

const PAGE_SIZE = 50;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function OwnerShops() {
  const { start: startImpersonation } = useImpersonation();
  const [impTarget, setImpTarget] = useState<Shop | null>(null);
  const [impReason, setImpReason] = useState("");
  const [impSubmitting, setImpSubmitting] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<Shop | null>(null);
  const [viewTarget, setViewTarget] = useState<Shop | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("focus");
  const suspendId = searchParams.get("suspend");
  const focusRef = useRef<HTMLTableRowElement | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["owner-shops", q.trim(), filter, page],
    staleTime: 45_000,
    queryFn: async ({ signal }) => {
      let query = supabase
        .from("shops")
        .select("id,name,reference_code,owner_id,created_at,suspended,suspended_reason", { count: "exact" });

      if (filter === "active") query = query.eq("suspended", false);
      if (filter === "suspended") query = query.eq("suspended", true);
      const term = q.trim();
      if (term) {
        query = isUuid(term)
          ? query.eq("id", term)
          : query.or(`name.ilike.%${term.replace(/%/g, "") }%,reference_code.ilike.%${term.replace(/%/g, "") }%`);
      }

      const { data: shopRows, count, error: shopsError } = await query
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
        .abortSignal(signal);
      if (shopsError) throw shopsError;

      const ids = (shopRows || []).map((s) => s.id);
      let memberCounts = new Map<string, number>();
      if (ids.length) {
        const { data: members, error: membersError } = await supabase
          .from("shop_members")
          .select("shop_id")
          .in("shop_id", ids)
          .limit(1000)
          .abortSignal(signal);
        if (membersError) throw membersError;
        memberCounts = new Map<string, number>();
        (members || []).forEach((m: any) => memberCounts.set(m.shop_id, (memberCounts.get(m.shop_id) || 0) + 1));
      }

      return {
        rows: ((shopRows || []) as Shop[]).map((s) => ({ ...s, member_count: memberCounts.get(s.id) || 0 })),
        count: count ?? 0,
      };
    },
  });

  const shops = data?.rows ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => { setPage(0); }, [q, filter]);

  useEffect(() => {
    if (isLoading || shops.length === 0) return;
    const id = suspendId || focusId;
    if (!id) return;
    const s = shops.find((x) => x.id === id);
    if (!s) return;
    if (suspendId) {
      openSuspend(s);
      const next = new URLSearchParams(searchParams);
      next.delete("suspend");
      setSearchParams(next, { replace: true });
    } else if (focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isLoading, shops, suspendId, focusId, searchParams, setSearchParams]);

  const exportCsv = async () => {
    const csv = rowsToCsv(shops.map((s) => ({
      id: s.id,
      name: s.name,
      reference: s.reference_code ?? "",
      suspended: s.suspended,
      reason: s.suspended_reason ?? "",
      members: s.member_count ?? 0,
      created_at: s.created_at,
    })));
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`shops-${stamp}.csv`, csv || "no_data\n");
    await logExport("shops", null, shops.length);
    toast.success(`تم تصدير ${shops.length} متجر`);
  };

  const openSuspend = (s: Shop) => {
    setTarget(s);
    setReason(s.suspended_reason ?? "");
    setConfirmText("");
  };

  const submitToggle = async () => {
    if (!target || submitting) return;
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
    refetch();
  };

  const canPrev = page > 0;
  const canNext = page + 1 < pageCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المتاجر</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount.toLocaleString("ar-MA")} متجر فعلي من قاعدة البيانات • كل عملية حساسة تُسجل في سجل التدقيق.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" className="gap-2" disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button onClick={exportCsv} variant="outline" className="gap-2" disabled={shops.length === 0}>
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم المرجع..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-9 h-11 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "suspended"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="h-11">
              {f === "all" ? "الكل" : f === "active" ? "نشط" : "مجمّد"}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          فشل تحميل المتاجر. <Button variant="outline" size="sm" onClick={() => refetch()} className="ms-2">إعادة المحاولة</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={8} /></div>
          ) : shops.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              لا توجد متاجر مطابقة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold">المرجع</th>
                    <th className="text-right px-4 py-3 font-semibold">اسم المتجر</th>
                    <th className="text-right px-4 py-3 font-semibold">الأعضاء</th>
                    <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold">تاريخ الإنشاء</th>
                    <th className="text-center px-4 py-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((s) => (
                    <tr
                      key={s.id}
                      ref={s.id === focusId ? focusRef : undefined}
                      className={`border-b border-border/70 hover:bg-muted/30 ${s.id === focusId ? "bg-warning/10 ring-1 ring-warning/40" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.reference_code || s.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 tabular-nums">{s.member_count}</td>
                      <td className="px-4 py-3">
                        {s.suspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-destructive/10 text-destructive border border-destructive/30">
                            <AlertTriangle className="w-3 h-3" /> مجمّد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-success/10 text-success border border-success/30">نشط</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString("ar-MA")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewTarget(s)} className="gap-1">
                            <Eye className="w-3 h-3" /> عرض
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setImpTarget(s); setImpReason(""); }}
                            className="gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                          >
                            <ScanEye className="w-3 h-3" /> مشاهدة
                          </Button>
                          <Button size="sm" variant={s.suspended ? "default" : "outline"} onClick={() => openSuspend(s)} className="gap-1">
                            {s.suspended ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            {s.suspended ? "تفعيل" : "تجميد"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>صفحة {(page + 1).toLocaleString("ar-MA")} من {pageCount.toLocaleString("ar-MA")}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!canPrev || isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>السابق</Button>
              <Button variant="outline" size="sm" disabled={!canNext || isFetching} onClick={() => setPage((p) => p + 1)}>التالي</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTarget?.name}</DialogTitle>
            <DialogDescription>تفاصيل المتجر من قاعدة البيانات للقراءة فقط.</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{viewTarget.id}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Reference</span><span>{viewTarget.reference_code || "—"}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Members</span><span>{viewTarget.member_count ?? 0}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Status</span><span>{viewTarget.suspended ? "مجمّد" : "نشط"}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Created</span><span>{new Date(viewTarget.created_at).toLocaleString("ar-MA")}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target?.suspended ? "تفعيل المتجر" : "تجميد المتجر"}</DialogTitle>
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
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: مخالفة شروط الاستخدام، عدم سداد..." rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">للتأكيد، اكتب اسم المتجر: <span className="font-mono text-warning">{target.name}</span></label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={target.name} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={submitting}>إلغاء</Button>
            <Button
              onClick={submitToggle}
              disabled={submitting || (target && !target.suspended && (!reason.trim() || confirmText.trim() !== target.name.trim()))}
              variant={target?.suspended ? "default" : "destructive"}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {target?.suspended ? "تفعيل" : "تأكيد التجميد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!impTarget} onOpenChange={(o) => !o && setImpTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanEye className="w-5 h-5 text-purple-400" />
              بدء مشاهدة المتجر (للقراءة فقط)
            </DialogTitle>
            <DialogDescription>
              ستدخل وضع المشاهدة لـ <strong>{impTarget?.name}</strong>. لن تستطيع تعديل أي بيانات،
              وسيتم تسجيل هذه الجلسة في سجل التدقيق.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1 block">سبب المشاهدة (إجباري)</label>
            <Textarea
              value={impReason}
              onChange={(e) => setImpReason(e.target.value)}
              placeholder="مثال: تشخيص مشكلة بلّغ عنها صاحب المتجر..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpTarget(null)} disabled={impSubmitting}>إلغاء</Button>
            <Button
              disabled={impSubmitting || !impReason.trim() || !impTarget}
              onClick={async () => {
                if (!impTarget) return;
                setImpSubmitting(true);
                try {
                  await startImpersonation(impTarget.id, impTarget.name, impReason.trim());
                  setImpTarget(null);
                  setImpReason("");
                } catch {} finally { setImpSubmitting(false); }
              }}
            >
              {impSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              بدء المشاهدة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
