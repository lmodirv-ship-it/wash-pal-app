import { useEffect, useState } from "react";
import { Settings, Save, Wrench, UserPlus, Flag, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppSettings, useFeatureFlags } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function OwnerSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading: loadingS } = useAppSettings();
  const { data: flags, isLoading: loadingF } = useFeatureFlags();

  const [form, setForm] = useState({
    maintenance_mode: false,
    maintenance_message: "",
    signup_enabled: true,
    welcome_message: "",
    brand_logo_url: "",
    brand_primary_color: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      maintenance_mode: settings.maintenance_mode,
      maintenance_message: settings.maintenance_message ?? "",
      signup_enabled: settings.signup_enabled,
      welcome_message: settings.welcome_message ?? "",
      brand_logo_url: settings.brand_logo_url ?? "",
      brand_primary_color: settings.brand_primary_color ?? "",
    });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings" as any)
      .update({
        maintenance_mode: form.maintenance_mode,
        maintenance_message: form.maintenance_message || null,
        signup_enabled: form.signup_enabled,
        welcome_message: form.welcome_message || null,
        brand_logo_url: form.brand_logo_url || null,
        brand_primary_color: form.brand_primary_color || null,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("فشل الحفظ: " + error.message);
      return;
    }
    toast.success("تم حفظ الإعدادات بنجاح");
    qc.invalidateQueries({ queryKey: ["app_settings"] });
  };

  const toggleFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("feature_flags" as any)
      .update({ enabled })
      .eq("id", id);
    if (error) {
      toast.error("فشل التحديث: " + error.message);
      return;
    }
    toast.success(enabled ? "تم التفعيل" : "تم التعطيل");
    qc.invalidateQueries({ queryKey: ["feature_flags"] });
  };

  const flagsByCategory = (flags ?? []).reduce<Record<string, typeof flags>>((acc, f) => {
    (acc[f.category] ||= [] as any).push(f);
    return acc;
  }, {});

  const categoryLabel: Record<string, string> = {
    modules: "الوحدات الرئيسية",
    communication: "الاتصال",
    security: "الأمان",
    auth: "المصادقة",
    general: "عام",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-[hsl(48_95%_65%)]" />
          الإعدادات العامة للمنصة
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          تحكم مباشر في وضع الصيانة، التسجيل، الهوية البصرية، وميزات النظام.
        </p>
      </div>

      {/* Operational settings */}
      <Card className="p-6 space-y-6 bg-[hsl(220_25%_7%)] border-[hsl(220_20%_16%)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            وضع التشغيل
          </h2>
        </div>

        {loadingS ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin w-6 h-6" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> وضع الصيانة
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  عند التفعيل، يتم إيقاف الموقع لجميع المستخدمين باستثناء المالك.
                </p>
              </div>
              <Switch
                checked={form.maintenance_mode}
                onCheckedChange={(v) => setForm({ ...form, maintenance_mode: v })}
              />
            </div>

            <div>
              <Label>رسالة الصيانة</Label>
              <Textarea
                value={form.maintenance_message}
                onChange={(e) => setForm({ ...form, maintenance_message: e.target.value })}
                placeholder="مثال: نعمل على تحسين الخدمة، نعود قريباً."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> تسجيل حسابات جديدة
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  السماح للزوار بإنشاء متاجر جديدة على المنصة.
                </p>
              </div>
              <Switch
                checked={form.signup_enabled}
                onCheckedChange={(v) => setForm({ ...form, signup_enabled: v })}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> رسالة الترحيب
              </Label>
              <Textarea
                value={form.welcome_message}
                onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                placeholder="رسالة تظهر للمستخدمين الجدد بعد التسجيل"
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>رابط الشعار</Label>
                <Input
                  value={form.brand_logo_url}
                  onChange={(e) => setForm({ ...form, brand_logo_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>اللون الأساسي (HSL)</Label>
                <Input
                  value={form.brand_primary_color}
                  onChange={(e) => setForm({ ...form, brand_primary_color: e.target.value })}
                  placeholder="48 95% 55%"
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              حفظ الإعدادات
            </Button>
          </>
        )}
      </Card>

      {/* Feature flags */}
      <Card className="p-6 space-y-6 bg-[hsl(220_25%_7%)] border-[hsl(220_20%_16%)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Flag className="w-5 h-5 text-blue-400" />
            مفاتيح الميزات (Feature Flags)
          </h2>
          <Badge variant="outline">{flags?.length ?? 0} ميزة</Badge>
        </div>

        {loadingF ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin w-6 h-6" /></div>
        ) : (
          Object.entries(flagsByCategory).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabel[cat] ?? cat}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(items ?? []).map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_5%)] p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{f.label}</div>
                      {f.description && (
                        <div className="text-xs text-muted-foreground truncate">{f.description}</div>
                      )}
                      <code className="text-[10px] text-muted-foreground/60">{f.key}</code>
                    </div>
                    <Switch
                      checked={f.enabled}
                      onCheckedChange={(v) => toggleFlag(f.id, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
