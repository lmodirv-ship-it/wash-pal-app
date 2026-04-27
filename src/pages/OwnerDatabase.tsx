import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableStat { table: string; rows: number | null; rls: boolean | null; }

const TABLES = [
  "shops","shop_members","employees","customers","services","orders","invoices",
  "subscriptions","pricing_plans","invites","employee_join_requests",
  "user_roles","profiles","role_audit_logs","audit_logs","login_attempts",
  "notifications","branches","expenses","b2b_partners","discount_coupons",
  "message_templates","notification_settings","imou_devices",
];

export default function OwnerDatabase() {
  const [stats, setStats] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const results = await Promise.all(
      TABLES.map(async (t) => {
        const { count, error } = await supabase
          .from(t as any)
          .select("*", { count: "exact", head: true });
        return { table: t, rows: error ? null : count ?? 0, rls: !error };
      })
    );
    setStats(results);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-blue-400" />
            قاعدة البيانات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض حالة الجداول وعدد السجلات. للقراءة فقط — أي تعديل يتم عبر migrations مُدارة.
          </p>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> تحديث
        </Button>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
        ⚠️ هذه الواجهة للقراءة فقط. عمليات النسخ الاحتياطي والاستعادة و SQL المباشر غير متاحة من اللوحة لأمان الإنتاج.
      </div>

      <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(220_25%_9%)] border-b border-[hsl(220_20%_16%)]">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">الجدول</th>
                  <th className="text-right px-4 py-3 font-semibold">عدد السجلات</th>
                  <th className="text-right px-4 py-3 font-semibold">الوصول</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.table} className="border-b border-[hsl(220_20%_12%)]">
                    <td className="px-4 py-3 font-mono text-xs">{s.table}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {s.rows === null ? "—" : s.rows.toLocaleString("ar-MA")}
                    </td>
                    <td className="px-4 py-3">
                      {s.rls ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle2 className="w-3 h-3" /> متاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <AlertCircle className="w-3 h-3" /> غير متاح
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
