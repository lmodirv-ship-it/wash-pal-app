import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { LogOut, ShieldAlert, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Session = {
  user_id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  last_sign_in_at: string | null;
  created_at: string | null;
  active_recent: boolean;
};

export default function OwnerSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmSingle, setConfirmSingle] = useState<Session | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("owner-sessions", {
        body: { action: "list", page: 1, perPage: 100 },
      });
      if (error) throw error;
      setSessions((data?.sessions ?? []) as Session[]);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تحميل الجلسات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [s.email, s.name, s.role].some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [sessions, filter]);

  const activeCount = sessions.filter((s) => s.active_recent).length;

  function toggle(uid: string) {
    const n = new Set(selected);
    n.has(uid) ? n.delete(uid) : n.add(uid);
    setSelected(n);
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.user_id)));
  }

  async function forceLogout(uid: string) {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("owner-sessions", {
        body: { action: "logout", user_id: uid },
      });
      if (error) throw error;
      toast.success("تم تسجيل خروج المستخدم");
      setConfirmSingle(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "فشل تنفيذ العملية");
    } finally { setBusy(false); }
  }

  async function forceLogoutBulk() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("owner-sessions", {
        body: { action: "logout_all", user_ids: [...selected] },
      });
      if (error) throw error;
      toast.success(`تم تسجيل خروج ${selected.size} مستخدم`);
      setSelected(new Set());
      setConfirmBulk(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "فشل تنفيذ العملية");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[hsl(48_95%_60%)]" />
            الجلسات النشطة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض الجلسات وفرض تسجيل الخروج العام (Owner only). كل عملية تُسجَّل في audit_logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} /> تحديث
          </Button>
          <Button
            variant="destructive"
            disabled={selected.size === 0 || busy}
            onClick={() => setConfirmBulk(true)}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل خروج جماعي ({selected.size})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="إجمالي المستخدمين" value={sessions.length} />
        <KPI label="نشط آخر 24س" value={activeCount} accent />
        <KPI label="محدد للحذف" value={selected.size} />
        <KPI label="غير نشط" value={sessions.length - activeCount} muted />
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Input
            placeholder="بحث (إيميل/اسم/دور)…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-xs text-muted-foreground">{filtered.length} نتيجة</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="لا توجد جلسات"
            description="لم يُعثر على أي جلسات مطابقة."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-2 text-right">
                    <Checkbox
                      checked={selected.size > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="p-2 text-right">الإيميل</th>
                  <th className="p-2 text-right">الاسم</th>
                  <th className="p-2 text-right">الدور</th>
                  <th className="p-2 text-right">آخر دخول</th>
                  <th className="p-2 text-right">الحالة</th>
                  <th className="p-2 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.user_id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-2">
                      <Checkbox
                        checked={selected.has(s.user_id)}
                        onCheckedChange={() => toggle(s.user_id)}
                      />
                    </td>
                    <td className="p-2 font-mono text-xs">{s.email ?? "—"}</td>
                    <td className="p-2">{s.name ?? "—"}</td>
                    <td className="p-2"><Badge variant="outline">{s.role ?? "—"}</Badge></td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {s.last_sign_in_at ? new Date(s.last_sign_in_at).toLocaleString("ar") : "—"}
                    </td>
                    <td className="p-2">
                      {s.active_recent ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">خامل</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmSingle(s)}
                        disabled={busy}
                      >
                        <LogOut className="w-3.5 h-3.5 ml-1" /> خروج إجباري
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmSingle} onOpenChange={(o) => !o && setConfirmSingle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنهاء جميع جلسات المستخدم <span className="font-mono">{confirmSingle?.email}</span>{" "}
              فوراً على كل الأجهزة. سيتم تسجيل العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => confirmSingle && forceLogout(confirmSingle.user_id)}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تسجيل خروج جماعي</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنهاء جلسات {selected.size} مستخدم. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={forceLogoutBulk}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KPI({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${
      accent ? "border-[hsl(48_95%_55%/0.4)] bg-[hsl(48_95%_55%/0.06)]"
      : muted ? "border-border bg-muted/10"
      : "border-border bg-card/60"
    }`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-[hsl(48_100%_70%)]" : ""}`}>{value}</div>
    </div>
  );
}
