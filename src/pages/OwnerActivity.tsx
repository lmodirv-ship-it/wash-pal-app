import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, RefreshCw, Loader2, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuditRow {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  old_value: any;
  new_value: any;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  "shop.suspend": "text-red-400",
  "shop.unsuspend": "text-green-400",
  "owner.broadcast": "text-cyan-400",
};

export default function OwnerActivity() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,actor_email,action,target_type,target_id,old_value,new_value,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setRows((data as AuditRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.action.toLowerCase().includes(k) ||
        r.actor_email?.toLowerCase().includes(k) ||
        r.target_type?.toLowerCase().includes(k) ||
        r.target_id?.toLowerCase().includes(k)
    );
  }, [rows, q]);

  const exportCsv = () => {
    const csv = [
      ["Date", "Actor", "Action", "Target Type", "Target ID", "Old", "New"],
      ...filtered.map((r) => [
        r.created_at, r.actor_email ?? "", r.action,
        r.target_type ?? "", r.target_id ?? "",
        JSON.stringify(r.old_value ?? ""), JSON.stringify(r.new_value ?? ""),
      ]),
    ]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-cyan-400" />
            سجل تدقيق المالك
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            كل عملية حساسة قام بها المالك مُسجّلة هنا (تجميد/تفعيل، إعلانات، إلخ).
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث
          </Button>
          <Button onClick={exportCsv} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث في الإجراءات / البريد / الهدف..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pr-9 h-11 bg-[hsl(220_25%_8%)] border-[hsl(220_20%_16%)]"
        />
      </div>

      <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">لا توجد سجلات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(220_25%_9%)] border-b border-[hsl(220_20%_16%)]">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">التاريخ</th>
                  <th className="text-right px-4 py-3 font-semibold">المنفّذ</th>
                  <th className="text-right px-4 py-3 font-semibold">الإجراء</th>
                  <th className="text-right px-4 py-3 font-semibold">الهدف</th>
                  <th className="text-right px-4 py-3 font-semibold">القيم</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[hsl(220_20%_12%)] hover:bg-[hsl(220_25%_9%)]">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("ar-MA")}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.actor_email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${ACTION_COLORS[r.action] || "text-foreground"}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {r.target_type ? `${r.target_type}:${(r.target_id || "").slice(0, 12)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.new_value ? (
                        <pre className="text-[10px] text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(r.new_value)}
                        </pre>
                      ) : "—"}
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
