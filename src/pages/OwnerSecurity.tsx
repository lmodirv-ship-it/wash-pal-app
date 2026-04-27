import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw, AlertTriangle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rowsToCsv, downloadCsv, logExport } from "@/lib/exportCsv";
import { toast } from "sonner";

interface Attempt {
  id: string;
  admin_email: string;
  ip_address: string | null;
  intruder_photo: string | null;
  created_at: string;
}

export default function OwnerSecurity() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("login_attempts")
      .select("id,admin_email,ip_address,intruder_photo,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setAttempts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-amber-400" />
            مركز الأمان
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مراقبة محاولات الدخول المشبوهة والأحداث الأمنية الحرجة.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                const csv = rowsToCsv(attempts as any);
                const stamp = new Date().toISOString().slice(0, 10);
                downloadCsv(`login-attempts-${stamp}.csv`, csv || "no_data\n");
                await logExport("audit_logs", null, attempts.length);
                toast.success(`تم تصدير ${attempts.length} سجل`);
              } catch (e: any) {
                toast.error(e?.message ?? "فشل التصدير");
              }
            }}
            variant="outline"
            className="gap-2"
            disabled={attempts.length === 0}
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] p-5">
          <div className="text-xs text-muted-foreground mb-2">إجمالي المحاولات (آخر 200)</div>
          <div className="text-3xl font-bold tabular-nums">{attempts.length}</div>
        </div>
        <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] p-5">
          <div className="text-xs text-muted-foreground mb-2">محاولات مع صورة دخيل</div>
          <div className="text-3xl font-bold tabular-nums text-red-400">
            {attempts.filter((a) => a.intruder_photo).length}
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] p-5">
          <div className="text-xs text-muted-foreground mb-2">عناوين IP فريدة</div>
          <div className="text-3xl font-bold tabular-nums">
            {new Set(attempts.map((a) => a.ip_address).filter(Boolean)).size}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[hsl(220_20%_16%)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold">سجل محاولات الدخول</h3>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">لا توجد محاولات مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(220_25%_9%)] border-b border-[hsl(220_20%_16%)]">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">البريد</th>
                  <th className="text-right px-4 py-3 font-semibold">IP</th>
                  <th className="text-right px-4 py-3 font-semibold">صورة</th>
                  <th className="text-right px-4 py-3 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-[hsl(220_20%_12%)]">
                    <td className="px-4 py-3">{a.admin_email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.ip_address || "—"}</td>
                    <td className="px-4 py-3">
                      {a.intruder_photo ? (
                        <span className="text-red-400 text-xs">📷 موجودة</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("ar-MA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h3 className="font-semibold text-amber-400 mb-2">الميزات القادمة</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>إدارة الجلسات النشطة وإغلاقها عن بُعد</li>
          <li>قوائم IP المحظورة والمسموح بها</li>
          <li>إعدادات سياسة كلمة المرور و2FA</li>
        </ul>
      </div>
    </div>
  );
}
