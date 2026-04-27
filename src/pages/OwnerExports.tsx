import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Database, Users, ClipboardList, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { exportFromView } from "@/lib/exportCsv";

interface ShopOpt { id: string; name: string; }

const TILES = [
  { type: "services" as const,     view: "v_services_export"     as const, prefix: "services",     title: "الخدمات",       icon: Sparkles },
  { type: "employees" as const,    view: "v_employees_export"    as const, prefix: "employees",    title: "الموظفون",      icon: Users },
  { type: "work_entries" as const, view: "v_work_entries_export" as const, prefix: "work-entries", title: "سجلات العمل",   icon: ClipboardList },
];

export default function OwnerExports() {
  const [shops, setShops] = useState<ShopOpt[]>([]);
  const [shopId, setShopId] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shops")
        .select("id,name")
        .order("created_at", { ascending: false });
      setShops((data as ShopOpt[]) ?? []);
    })();
  }, []);

  const onExport = async (t: typeof TILES[number]) => {
    setBusy(t.type);
    try {
      const targetShop = shopId === "all" ? null : shopId;
      const { count } = await exportFromView({
        view: t.view, type: t.type, shopId: targetShop, filenamePrefix: t.prefix,
      });
      toast.success(`تم تصدير ${count} سجل`);
    } catch (e: any) {
      toast.error(e?.message ?? "فشل التصدير");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="w-7 h-7 text-cyan-400" />
          تصدير البيانات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          تصدير CSV عبر views آمنة (RLS). كل تصدير يُسجَّل في سجل التدقيق.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">المتجر:</span>
        <Select value={shopId} onValueChange={setShopId}>
          <SelectTrigger className="w-72 bg-[hsl(220_25%_8%)] border-[hsl(220_20%_16%)]">
            <SelectValue placeholder="اختر متجر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المتاجر (Owner)</SelectItem>
            {shops.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TILES.map((t) => (
          <div key={t.type}
            className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <t.icon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold">{t.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">view: {t.view}</p>
            <Button onClick={() => onExport(t)} disabled={busy !== null} className="gap-2 mt-2">
              {busy === t.type ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              تصدير CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}