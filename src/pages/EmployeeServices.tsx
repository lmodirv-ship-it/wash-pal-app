import { useMemo, useState } from "react";
import { ServiceCategory } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Crown, Sparkles, Package, Droplets, Bike, Search, Clock, Info, RefreshCw, AlertTriangle, Lock, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getServiceName, getServiceDescription } from "@/lib/serviceI18n";
import { useEffectiveServices, EmptyReason } from "@/hooks/useEffectiveServices";
import { EmployeeTopNav } from "@/components/EmployeeTopNav";

export default function EmployeeServices() {
  const { services, reason, loading, refresh } = useEffectiveServices();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ServiceCategory | "all">("all");

  const CATS: { id: ServiceCategory | "all"; label: string; icon: any; cls: string }[] = [
    { id: "all", label: t("services.cats.all", { defaultValue: "الكل" }), icon: Droplets, cls: "" },
    { id: "standard", label: t("services.cats.standard"), icon: Droplets, cls: "text-primary" },
    { id: "vip", label: t("services.cats.vip"), icon: Crown, cls: "text-warning" },
    { id: "extra", label: t("services.cats.extra"), icon: Sparkles, cls: "text-accent-foreground" },
    { id: "packs", label: t("services.cats.packs"), icon: Package, cls: "text-success" },
    { id: "motor", label: t("services.cats.motor"), icon: Bike, cls: "text-success" },
  ];

  const filtered = useMemo(
    () =>
      services
        .filter((s) => (tab === "all" ? true : s.category === tab))
        .filter((s) => getServiceName(s, lang).toLowerCase().includes(search.toLowerCase())),
    [services, tab, search, lang]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3 pb-8">
        <EmployeeTopNav />
        <div className="text-center pt-3">
          <h1 className="text-xl font-bold">{t("services.title", { defaultValue: "الخدمات" })}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("services.subtitle", { defaultValue: "قائمة الخدمات المتاحة في متجرك" })}
          </p>
        </div>

        <Card className="p-3 rounded-2xl shadow-soft">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search", { defaultValue: "بحث..." })}
              className="ps-9 h-10"
            />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-6 w-full h-auto mb-3">
              {CATS.map((c) => {
                const Icon = c.icon;
                const count =
                  c.id === "all" ? services.length : services.filter((s) => s.category === c.id).length;
                return (
                  <TabsTrigger
                    key={c.id}
                    value={c.id as string}
                    className="flex flex-col gap-0.5 py-1.5 data-[state=active]:shadow-glow"
                  >
                    <Icon className={`w-4 h-4 ${c.cls}`} />
                    <span className="text-[10px] font-bold">{c.label}</span>
                    <span className="text-[9px] text-muted-foreground">{count}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={tab as string} className="mt-0">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-10">{t("common.loading", { defaultValue: "جاري التحميل..." })}</p>
              ) : filtered.length === 0 ? (
                <ReasonEmptyState reason={reason} onRetry={refresh} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((s) => {
                    const isVip = s.category === "vip";
                    const isPack = s.category === "packs";
                    const isMotor = s.category === "motor";
                    return (
                      <div
                        key={s.id}
                        className={`relative p-3 rounded-xl border-2 min-h-[110px] flex flex-col ${
                          isVip
                            ? "border-warning/40 bg-gradient-to-br from-warning/10 to-transparent"
                            : isPack
                            ? "border-success/40 bg-gradient-to-br from-success/10 to-transparent"
                            : isMotor
                            ? "border-success/30 bg-gradient-to-br from-success/5 to-transparent"
                            : "border-border bg-card"
                        }`}
                      >
                        {isVip && <Crown className="w-3.5 h-3.5 text-warning absolute top-1.5 start-1.5" />}
                        {isPack && <Package className="w-3.5 h-3.5 text-success absolute top-1.5 start-1.5" />}
                        {isMotor && <Bike className="w-3.5 h-3.5 text-success absolute top-1.5 start-1.5" />}

                        <p className="font-bold text-sm leading-tight line-clamp-2 ps-5">
                          {getServiceName(s, lang)}
                        </p>

                        {getServiceDescription(s, lang) && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                            {getServiceDescription(s, lang)}
                          </p>
                        )}

                        <div className="mt-auto pt-2 flex items-end justify-between">
                          <div>
                            {s.startingFrom && (
                              <span className="text-[9px] text-muted-foreground block leading-none">
                                {t("services.startingFrom", { defaultValue: "ابتداءً من" })}
                              </span>
                            )}
                            <p className="text-base font-bold text-primary leading-none">
                              {s.price} <span className="text-[10px] text-muted-foreground">DH</span>
                            </p>
                          </div>
                          {s.duration > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Clock className="w-3 h-3" />
                              {s.duration}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/70 flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          {t("employeeServices.readonlyNote", {
            defaultValue: "العرض فقط — لإضافة أو تعديل الخدمات تواصل مع المشرف.",
          })}
        </p>
      </div>
    </div>
  );
}

function ReasonEmptyState({ reason, onRetry }: { reason: EmptyReason; onRetry: () => void }) {
  const map: Record<NonNullable<EmptyReason>, { Icon: any; title: string; hint: string; tone: string }> = {
    NO_SHOP_LINK: {
      Icon: Store,
      title: "حسابك غير مربوط بمتجر",
      hint: "تواصل مع المدير ليضيفك إلى المتجر.",
      tone: "text-warning",
    },
    NO_ACTIVE_SERVICES: {
      Icon: Droplets,
      title: "لا توجد خدمات مفعلة حالياً في متجرك",
      hint: "اطلب من المسؤول إضافة أو تفعيل الخدمات.",
      tone: "text-muted-foreground",
    },
    ALL_DISABLED_BY_OVERRIDE: {
      Icon: Lock,
      title: "تم تقييد الخدمات لحسابك",
      hint: "تواصل مع المسؤول ليُعيد تفعيل الخدمات لحسابك.",
      tone: "text-warning",
    },
    LOAD_ERROR: {
      Icon: AlertTriangle,
      title: "تعذر تحميل الخدمات حالياً",
      hint: "تحقق من الاتصال وحاول مرة أخرى.",
      tone: "text-destructive",
    },
  };
  const conf = reason ? map[reason] : map.NO_ACTIVE_SERVICES;
  const Icon = conf.Icon;
  return (
    <div className="text-center py-10 px-4">
      <Icon className={`w-10 h-10 mx-auto mb-3 ${conf.tone}`} />
      <p className="font-bold text-sm">{conf.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{conf.hint}</p>
      <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 gap-2">
        <RefreshCw className="w-3.5 h-3.5" />
        إعادة المحاولة
      </Button>
    </div>
  );
}