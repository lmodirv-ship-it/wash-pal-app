import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, RefreshCw } from "lucide-react";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";

type LogRow = {
  id: string;
  target_user_id: string;
  changed_by: string | null;
  source_table: string;
  old_role: string | null;
  new_role: string | null;
  action: string;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  UPDATE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function RoleAuditLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("role_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) setRows(data as LogRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ScrollText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل تدقيق الأدوار</h1>
            <p className="text-sm text-muted-foreground">
              {rows.length} حدث • آخر 200 تغيير
            </p>
          </div>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="لا توجد أحداث"
          description="لم يتم تسجيل أي تغيير للأدوار حتى الآن"
        />
      ) : (
        <div className="rounded-xl border border-[hsl(220_20%_14%)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(220_25%_10%)] text-muted-foreground">
              <tr>
                <th className="text-start p-3 font-semibold">التاريخ</th>
                <th className="text-start p-3 font-semibold">المصدر</th>
                <th className="text-start p-3 font-semibold">الإجراء</th>
                <th className="text-start p-3 font-semibold">من</th>
                <th className="text-start p-3 font-semibold">إلى</th>
                <th className="text-start p-3 font-semibold">المستخدم المستهدف</th>
                <th className="text-start p-3 font-semibold">من قام بالتغيير</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[hsl(220_20%_14%)] hover:bg-[hsl(220_25%_8%)]">
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ar")}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{r.source_table}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={ACTION_COLORS[r.action] || ""}>
                      {r.action}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.old_role || "—"}</td>
                  <td className="p-3 font-semibold text-foreground">{r.new_role || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {r.target_user_id.slice(0, 8)}…
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {r.changed_by ? r.changed_by.slice(0, 8) + "…" : "system"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}