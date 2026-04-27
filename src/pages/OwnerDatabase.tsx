import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Database, RefreshCw, Loader2, Activity, ShieldAlert, Download,
  AlertTriangle, CheckCircle2, Lock, Megaphone, UserCog, Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

interface TableStat { table: string; rows: number | null; ok: boolean; }

const TABLES = [
  "shops","shop_members","employees","customers","services","orders","invoices",
  "subscriptions","pricing_plans","invites","employee_join_requests",
  "user_roles","profiles","role_audit_logs","audit_logs","login_attempts",
  "notifications","branches","expenses","b2b_partners","discount_coupons",
  "message_templates","notification_settings","imou_devices",
];

const EXPORTABLE = ["shops","subscriptions","employees","services","audit_logs","orders","invoices"] as const;

export default function OwnerDatabase() {
  const [stats, setStats] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [integrity, setIntegrity] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Forms
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcScope, setBcScope] = useState<"all"|"admins"|"owners">("all");
  const [confirmText, setConfirmText] = useState("");

  const [roleEmail, setRoleEmail] = useState("");
  const [roleNew, setRoleNew] = useState<string>("employee");

  const loadStats = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      TABLES.map(async (t) => {
        const { count, error } = await supabase.from(t as any).select("*", { count: "exact", head: true });
        return { table: t, rows: error ? null : count ?? 0, ok: !error };
      })
    );
    setStats(results);
    setLoading(false);
  }, []);

  const loadHealth = useCallback(async () => {
    const { data, error } = await supabase.rpc("owner_db_health" as any);
    if (error) { toast.error(error.message); return; }
    setHealth(data);
  }, []);

  const loadIntegrity = useCallback(async () => {
    const { data, error } = await supabase.rpc("owner_tenant_integrity" as any);
    if (error) { toast.error(error.message); return; }
    setIntegrity(data);
  }, []);

  const loadSecurity = useCallback(async () => {
    const { data, error } = await supabase.rpc("owner_recent_security_events" as any, { _limit: 30 });
    if (error) { toast.error(error.message); return; }
    setSecurity(data);
  }, []);

  useEffect(() => {
    loadStats(); loadHealth(); loadIntegrity(); loadSecurity();
  }, [loadStats, loadHealth, loadIntegrity, loadSecurity]);

  const exportCSV = async (table: typeof EXPORTABLE[number]) => {
    setBusy(`export:${table}`);
    try {
      const { data, error } = await supabase.from(table as any).select("*").limit(10000);
      if (error) throw error;
      const rows = (data || []) as any[];
      if (!rows.length) { toast.message("لا توجد بيانات للتصدير"); return; }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map(r => headers.map(h => {
          const v = r[h];
          if (v == null) return "";
          const s = typeof v === "object" ? JSON.stringify(v) : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        }).join(","))
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${table}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      // Audit log via existing RPC
      await supabase.rpc("log_export_action" as any, { _shop_id: null, _export_type: table, _row_count: rows.length });
      toast.success(`تم تصدير ${rows.length} صف من ${table}`);
    } catch (e: any) {
      toast.error(e.message || "فشل التصدير");
    } finally { setBusy(null); }
  };

  const broadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim()) return toast.error("العنوان والرسالة مطلوبان");
    setBusy("broadcast");
    const { data, error } = await supabase.rpc("owner_broadcast" as any, {
      _title: bcTitle, _message: bcMessage, _scope: bcScope
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`تم الإرسال إلى ${data} مستخدم`);
    setBcTitle(""); setBcMessage("");
  };

  const setRole = async () => {
    if (!roleEmail.trim()) return toast.error("أدخل البريد الإلكتروني");
    setBusy("role");
    try {
      // We need user_id from email — fetch via profiles join is restricted; use auth via RPC fallback: ask user to provide UUID instead if not found.
      // Try to find via profiles by email-shaped lookup is unavailable; so accept UUID OR email.
      let targetId = roleEmail.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (!isUuid) {
        toast.error("ضع UUID المستخدم (يمكنك جلبه من صفحة Users)");
        setBusy(null); return;
      }
      const { error } = await supabase.rpc("owner_set_user_role" as any, {
        _target_user_id: targetId, _new_role: roleNew
      });
      if (error) throw error;
      toast.success("تم تحديث الدور");
      setRoleEmail("");
      loadSecurity();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const Kpi = ({ icon: Icon, label, value, color }: any) => (
    <div className="rounded-xl bg-[hsl(220_25%_9%)] border border-amber-500/10 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold truncate">{value ?? "—"}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-amber-400" />
            مركز التحكم بقاعدة البيانات
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            وصول حصري للمالك. كل عملية تُسجَّل في سجل التدقيق.
          </p>
        </div>
        <Button onClick={() => { loadStats(); loadHealth(); loadIntegrity(); loadSecurity(); }} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> تحديث الكل
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Activity} label="اتصالات نشطة" value={health?.active_connections} color="#22c55e" />
        <Kpi icon={Database} label="حجم القاعدة" value={health?.db_size} color="#3b82f6" />
        <Kpi icon={CheckCircle2} label="جداول سليمة" value={`${stats.filter(s=>s.ok).length}/${stats.length}`} color="#f59e0b" />
        <Kpi icon={ShieldAlert} label="مشاكل عزل" value={
          integrity ? (integrity.shops_without_owner + integrity.subscriptions_orphaned + integrity.members_orphaned + integrity.orders_orphaned + integrity.employees_orphaned) : "—"
        } color="#ef4444" />
      </div>

      <Tabs defaultValue="tables" dir="rtl">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="tables">الجداول</TabsTrigger>
          <TabsTrigger value="integrity">سلامة المستأجرين</TabsTrigger>
          <TabsTrigger value="security">أحداث الأمان</TabsTrigger>
          <TabsTrigger value="exports">التصدير</TabsTrigger>
          <TabsTrigger value="ops">عمليات</TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <Card>
            <CardHeader><CardTitle className="text-base">عدد السجلات وحالة RLS</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {stats.map(s => (
                    <div key={s.table} className="flex items-center justify-between rounded-lg border border-amber-500/10 bg-[hsl(220_25%_9%)] px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                        <span className="text-xs font-mono truncate">{s.table}</span>
                      </div>
                      <Badge variant="outline" className="text-[11px]">{s.rows ?? "—"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity">
          <Card>
            <CardHeader><CardTitle className="text-base">فحص عزل البيانات بين المتاجر</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {integrity && Object.entries(integrity).filter(([k]) => k !== "checked_at").map(([k, v]: any) => {
                const bad = typeof v === "number" && v > 0;
                return (
                  <div key={k} className={`flex items-center justify-between rounded-lg border p-3 ${bad ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                    <span className="text-sm">{k}</span>
                    <Badge variant={bad ? "destructive" : "outline"}>{String(v)}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card><CardHeader><CardTitle className="text-sm">آخر محاولات الدخول</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1 max-h-80 overflow-auto">
                {(security?.login_attempts || []).map((l: any) => (
                  <div key={l.id} className="flex justify-between border-b border-white/5 py-1">
                    <span className="truncate">{l.admin_email}</span>
                    <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("ar")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-sm">تغييرات الأدوار</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1 max-h-80 overflow-auto">
                {(security?.role_changes || []).map((l: any) => (
                  <div key={l.id} className="border-b border-white/5 py-1">
                    <div>{l.action}: {l.old_role || "—"} → {l.new_role || "—"}</div>
                    <div className="text-muted-foreground">{new Date(l.created_at).toLocaleString("ar")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-sm">سجل التدقيق</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1 max-h-80 overflow-auto">
                {(security?.audit || []).map((l: any) => (
                  <div key={l.id} className="border-b border-white/5 py-1">
                    <div className="font-mono">{l.action}</div>
                    <div className="text-muted-foreground">{l.actor_email} — {new Date(l.created_at).toLocaleString("ar")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exports">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" /> تصدير CSV</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {EXPORTABLE.map(t => (
                <Button key={t} variant="outline" size="sm" disabled={busy === `export:${t}`} onClick={() => exportCSV(t)}>
                  {busy === `export:${t}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 ml-1" />}
                  {t}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Broadcast */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-400" /> إرسال إشعار جماعي</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="العنوان" value={bcTitle} onChange={e => setBcTitle(e.target.value)} />
                <Textarea placeholder="الرسالة" value={bcMessage} onChange={e => setBcMessage(e.target.value)} rows={3} />
                <Select value={bcScope} onValueChange={(v: any) => setBcScope(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستخدمين</SelectItem>
                    <SelectItem value="admins">المدراء فقط</SelectItem>
                    <SelectItem value="owners">المالكون فقط</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={busy==="broadcast"}>إرسال</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد الإرسال الجماعي</AlertDialogTitle>
                      <AlertDialogDescription>
                        اكتب <b>SEND</b> للتأكيد. هذا سيُنشئ إشعارًا في حساب كل مستخدم في النطاق المحدد.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="SEND" />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmText("")}>إلغاء</AlertDialogCancel>
                      <AlertDialogAction disabled={confirmText !== "SEND"} onClick={() => { setConfirmText(""); broadcast(); }}>تأكيد</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Set Role */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserCog className="w-4 h-4 text-amber-400" /> تعيين دور مستخدم</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Label className="text-xs">UUID المستخدم</Label>
                <Input placeholder="00000000-0000-0000-0000-000000000000" value={roleEmail} onChange={e => setRoleEmail(e.target.value)} />
                <Select value={roleNew} onValueChange={setRoleNew}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["owner","admin","supervisor","manager","employee","customer"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" variant="secondary" disabled={busy==="role"}>تطبيق</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد تغيير الدور</AlertDialogTitle>
                      <AlertDialogDescription>
                        اكتب <b>CONFIRM</b> للموافقة على تغيير دور المستخدم إلى <b>{roleNew}</b>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="CONFIRM" />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmText("")}>إلغاء</AlertDialogCancel>
                      <AlertDialogAction disabled={confirmText !== "CONFIRM"} onClick={() => { setConfirmText(""); setRole(); }}>تأكيد</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card className="md:col-span-2 border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-4 text-xs text-muted-foreground flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <b className="text-amber-400">ملاحظات أمان:</b> تجميد المتاجر يُدار من صفحة "المتاجر" (Freeze/Activate موجود هناك). إنهاء جلسات قسري يتطلب صلاحيات Service Role وسيُضاف في PR منفصل عبر Edge Function. كل العمليات هنا تُسجَّل في <code>audit_logs</code>.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
