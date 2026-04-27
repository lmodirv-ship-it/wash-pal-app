import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store, Sliders } from "lucide-react";
import { toast } from "sonner";
import { Employee } from "@/types";
import { getServiceName } from "@/lib/serviceI18n";
import { useTranslation } from "react-i18next";

/**
 * Manager-side dialog to control which shop services a specific employee can see.
 * - "تابع للمتجر": no overrides exist → employee inherits all active shop services.
 * - "مخصص": one row per service in employee_service_overrides with enabled true/false.
 * Only owner/admin/supervisor/manager can open this — RLS enforces server-side too.
 */
export function EmployeeServiceOverridesDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: Employee | null;
}) {
  const { services, currentShopId } = useApp();
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<"inherit" | "custom">("inherit");
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeServices = services.filter((s) => s.isActive);

  useEffect(() => {
    if (!open || !employee) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee_service_overrides")
        .select("service_id, enabled")
        .eq("employee_id", employee.id);
      if (cancelled) return;
      if (error) {
        toast.error("تعذر تحميل التخصيصات: " + error.message);
        setLoading(false);
        return;
      }
      const map: Record<string, boolean> = {};
      activeServices.forEach((s) => (map[s.id] = true));
      (data || []).forEach((r: any) => (map[r.service_id] = r.enabled));
      setEnabledMap(map);
      setMode((data || []).length > 0 ? "custom" : "inherit");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id]);

  const switchToInherit = async () => {
    if (!employee) return;
    setSaving(true);
    const { error } = await supabase
      .from("employee_service_overrides")
      .delete()
      .eq("employee_id", employee.id);
    setSaving(false);
    if (error) return toast.error("فشل الحفظ: " + error.message);
    toast.success("تم ضبط الموظف على وضع تابع للمتجر");
    setMode("inherit");
    const reset: Record<string, boolean> = {};
    activeServices.forEach((s) => (reset[s.id] = true));
    setEnabledMap(reset);
  };

  const saveCustom = async () => {
    if (!employee || !currentShopId) return;
    setSaving(true);
    const rows = activeServices.map((s) => ({
      shop_id: currentShopId,
      employee_id: employee.id,
      service_id: s.id,
      enabled: enabledMap[s.id] ?? true,
    }));
    // Delete then insert keeps it simple and idempotent under the unique(employee_id, service_id) constraint.
    const { error: delErr } = await supabase
      .from("employee_service_overrides")
      .delete()
      .eq("employee_id", employee.id);
    if (delErr) {
      setSaving(false);
      return toast.error("فشل الحفظ: " + delErr.message);
    }
    const { error: insErr } = await supabase.from("employee_service_overrides").insert(rows);
    setSaving(false);
    if (insErr) return toast.error("فشل الحفظ: " + insErr.message);
    toast.success("تم حفظ خدمات الموظف");
    setMode("custom");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>خدمات {employee?.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("inherit")}
                className={`p-3 rounded-xl border-2 text-start transition ${
                  mode === "inherit" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <Store className="w-4 h-4 mb-1" />
                <p className="font-bold text-sm">تابع للمتجر</p>
                <p className="text-[11px] text-muted-foreground">يرى كل خدمات المتجر النشطة تلقائياً.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`p-3 rounded-xl border-2 text-start transition ${
                  mode === "custom" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <Sliders className="w-4 h-4 mb-1" />
                <p className="font-bold text-sm">مخصص</p>
                <p className="text-[11px] text-muted-foreground">اختر بدقة الخدمات المتاحة لهذا الموظف.</p>
              </button>
            </div>

            {mode === "custom" && (
              <div className="max-h-[320px] overflow-y-auto border rounded-xl divide-y mt-3">
                {activeServices.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    لا توجد خدمات نشطة في المتجر بعد.
                  </p>
                ) : (
                  activeServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{getServiceName(s, i18n.language)}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {s.category}
                        </Badge>
                      </div>
                      <Switch
                        checked={enabledMap[s.id] ?? true}
                        onCheckedChange={(v) => setEnabledMap((m) => ({ ...m, [s.id]: v }))}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                إلغاء
              </Button>
              {mode === "inherit" ? (
                <Button onClick={switchToInherit} disabled={saving}>
                  {saving ? "جارٍ الحفظ..." : "تطبيق وضع تابع للمتجر"}
                </Button>
              ) : (
                <Button onClick={saveCustom} disabled={saving || activeServices.length === 0}>
                  {saving ? "جارٍ الحفظ..." : "حفظ التخصيص"}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}