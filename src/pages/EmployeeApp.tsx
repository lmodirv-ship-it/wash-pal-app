import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Car, Save, Crown, Sparkles, Package, Droplets, Check, Bike, ListChecks, Coins, Hash } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { getServiceName } from "@/lib/serviceI18n";
import { EmployeeTopNav } from "@/components/EmployeeTopNav";

import { useEffectiveServices } from "@/hooks/useEffectiveServices";

export default function EmployeeApp() {
  const { currentBranch, addOrder, orders, services: shopServices } = useApp();
  const { services: effectiveServices } = useEffectiveServices();
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();

  const CATS: { id: ServiceCategory; label: string; icon: any; cls: string }[] = [
    { id: "standard", label: t("services.cats.standard"), icon: Droplets, cls: "text-primary" },
    { id: "vip", label: t("services.cats.vip"), icon: Crown, cls: "text-warning" },
    { id: "extra", label: t("services.cats.extra"), icon: Sparkles, cls: "text-accent-foreground" },
    { id: "packs", label: t("services.cats.packs"), icon: Package, cls: "text-success" },
  ];

  const [plate, setPlate] = useState("");
  const [carType, setCarType] = useState("");
  const [carSize, setCarSize] = useState<"normal" | "4x4" | "motor">("normal");
  const [serviceId, setServiceId] = useState<string>("");
  const [tab, setTab] = useState<ServiceCategory>("standard");
  const [saving, setSaving] = useState(false);

  const SURCHARGE_4X4 = 10;

  const activeServices = useMemo(
    () => effectiveServices.filter((s) => s.isActive),
    [effectiveServices]
  );
  const picked = activeServices.find(s => s.id === serviceId);
  const myName = profile?.name || t("employeeApp.employeeNote");

  const grouped = useMemo(() => {
    const out: Record<ServiceCategory, typeof activeServices> = { standard: [], vip: [], extra: [], packs: [], motor: [] };
    activeServices.forEach(s => out[s.category]?.push(s));
    return out;
  }, [activeServices]);

  const finalPrice = picked ? picked.price + (carSize === "4x4" ? SURCHARGE_4X4 : 0) : 0;

  const submit = async () => {
    if (!plate.trim()) { toast.error(t("employeeApp.plateRequired")); return; }
    if (!carType.trim()) { toast.error(t("employeeApp.carTypeRequired")); return; }
    if (!picked) { toast.error(t("employeeApp.chooseServiceErr")); return; }
    if (!currentBranch) { toast.error(t("employeeApp.noBranch")); return; }

    setSaving(true);
    try {
      const sizeLabel = carSize === "4x4" ? "4x4" : carSize === "motor" ? "Motor" : "Normal";
      await addOrder({
        customerId: "",
        customerName: t("employeeApp.directCustomer"),
        carType: `${carType.trim()} (${sizeLabel})`,
        carPlate: plate.trim().toUpperCase(),
        services: [picked.id],
        totalPrice: finalPrice,
        status: "waiting",
        employeeName: myName,
        branchId: currentBranch.id,
        notes: carSize === "4x4" ? `+${SURCHARGE_4X4} DH ${t("employeeApp.surchargeAdded")}` : carSize === "motor" ? t("employeeApp.motorcycle") : undefined,
      });
      toast.success(`${t("employeeApp.saved")} - ${finalPrice} DH`);
      setPlate(""); setCarType(""); setServiceId(""); setCarSize("normal");
    } catch (e: any) {
      toast.error(t("employeeApp.saveFailed") + ": " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3 pb-8">
        <EmployeeTopNav />
        <div className="text-center pt-1">
          <h1 className="text-xl font-bold">{t("employeeApp.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{myName}</p>
        </div>

      <Card className="p-4 rounded-2xl space-y-3 shadow-soft">
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Car className="w-4 h-4 text-primary" /> {t("employeeApp.carPlate")}
          </Label>
          <Input
            autoFocus
            placeholder={t("employeeApp.plateExample")}
            value={plate}
            onChange={e => setPlate(e.target.value)}
            className="h-12 text-lg font-bold text-center uppercase"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">{t("employeeApp.carType")}</Label>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <button type="button" onClick={() => setCarSize("normal")}
              className={`h-11 rounded-lg text-xs font-bold border-2 transition-all flex items-center justify-center gap-1 ${
                carSize === "normal" ? "border-primary bg-primary text-primary-foreground shadow-glow"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}>
              <Car className="w-3.5 h-3.5" />
              {t("employeeApp.normal")}
            </button>
            <button type="button" onClick={() => setCarSize("4x4")}
              className={`h-11 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center justify-center leading-none ${
                carSize === "4x4" ? "border-warning bg-warning text-warning-foreground shadow-glow"
                : "border-border bg-card text-muted-foreground hover:border-warning/50"}`}>
              <span>4×4</span>
              <span className="text-[9px] opacity-80 mt-0.5">{t("employeeApp.surcharge4x4")}</span>
            </button>
            <button type="button" onClick={() => setCarSize("motor")}
              className={`h-11 rounded-lg text-xs font-bold border-2 transition-all flex items-center justify-center gap-1 ${
                carSize === "motor" ? "border-success bg-success text-success-foreground shadow-glow"
                : "border-border bg-card text-muted-foreground hover:border-success/50"}`}>
              <Bike className="w-3.5 h-3.5" />
              {t("employeeApp.motor")}
            </button>
          </div>
          <Input
            placeholder={carSize === "motor" ? t("employeeApp.placeholderMotor") : t("employeeApp.placeholderType")}
            value={carType}
            onChange={e => setCarType(e.target.value)}
            className="h-11 w-full"
          />
          {carSize === "4x4" && <p className="text-[11px] text-warning mt-1.5">{t("employeeApp.surchargeNote")}</p>}
          {carSize === "motor" && <p className="text-[11px] text-success mt-1.5">{t("employeeApp.motorNote")}</p>}
        </div>
      </Card>

      <Card className="p-3 rounded-2xl shadow-soft">
        <Label className="text-sm font-semibold mb-3 block px-1">
          {carSize === "motor" ? t("employeeApp.motorServices") : t("employeeApp.chooseService")}
        </Label>
        {carSize === "motor" ? (
          grouped.motor.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">{t("employeeApp.noMotorServices")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {grouped.motor.map(s => {
                const selected = s.id === serviceId;
                return (
                  <button key={s.id} type="button" onClick={() => setServiceId(s.id)}
                    className={`relative p-3 rounded-xl border-2 text-start transition-all active:scale-[0.97] min-h-[88px] ${
                      selected ? "border-success bg-success/15 shadow-glow"
                      : "border-success/30 bg-gradient-to-br from-success/5 to-transparent hover:border-success"}`}>
                    {selected ? (
                      <div className="absolute top-1.5 start-1.5 w-5 h-5 rounded-full bg-success text-success-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : <Bike className="w-3.5 h-3.5 text-success absolute top-1.5 start-1.5" />}
                    <p className="font-bold text-sm line-clamp-2 leading-tight">{getServiceName(s, i18n.language)}</p>
                    <div className="mt-1.5">
                      <p className={`text-lg font-bold ${selected ? "text-success" : "text-foreground"}`}>
                        {s.price} <span className="text-[10px] text-muted-foreground">DH</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as ServiceCategory)}>
          <TabsList className="grid grid-cols-4 w-full h-auto mb-3">
            {CATS.map(c => {
              const Icon = c.icon;
              return (
                <TabsTrigger key={c.id} value={c.id} className="flex flex-col gap-0.5 py-2 data-[state=active]:shadow-glow">
                  <Icon className={`w-4 h-4 ${c.cls}`} />
                  <span className="text-xs font-bold">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground">{grouped[c.id].length}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATS.map(c => (
            <TabsContent key={c.id} value={c.id} className="mt-0">
              {grouped[c.id].length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">{t("employeeApp.noServicesCat")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {grouped[c.id].map(s => {
                    const selected = s.id === serviceId;
                    const isVip = s.category === "vip";
                    const isPack = s.category === "packs";
                    return (
                      <button key={s.id} type="button" onClick={() => setServiceId(s.id)}
                        className={`relative p-3 rounded-xl border-2 text-start transition-all active:scale-[0.97] min-h-[88px] ${
                          selected ? "border-primary bg-primary/15 shadow-glow"
                          : isVip ? "border-warning/40 bg-gradient-to-br from-warning/10 to-transparent hover:border-warning"
                          : isPack ? "border-success/40 bg-gradient-to-br from-success/10 to-transparent hover:border-success"
                          : "border-border bg-card hover:border-primary/50"}`}>
                        {selected && (
                          <div className="absolute top-1.5 start-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        {isVip && !selected && <Crown className="w-3.5 h-3.5 text-warning absolute top-1.5 start-1.5" />}
                        {isPack && !selected && <Package className="w-3.5 h-3.5 text-success absolute top-1.5 start-1.5" />}
                        <p className="font-bold text-sm line-clamp-2 leading-tight">{getServiceName(s, i18n.language)}</p>
                        <div className="mt-1.5">
                          {s.startingFrom && <span className="text-[9px] text-muted-foreground block leading-none">{t("services.startingFrom")}</span>}
                          <p className={`text-lg font-bold ${selected ? "text-primary" : "text-foreground"}`}>
                            {s.price + (carSize === "4x4" ? SURCHARGE_4X4 : 0)} <span className="text-[10px] text-muted-foreground">DH</span>
                          </p>
                          {carSize === "4x4" && (
                            <span className="text-[9px] text-warning font-semibold block leading-none mt-0.5">
                              {s.price} + {SURCHARGE_4X4} (4×4)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        )}
      </Card>

      {picked && (
        <Card className="p-3 rounded-xl bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("employeeApp.selectedService")}</p>
              <p className="font-bold text-sm truncate">{getServiceName(picked, i18n.language)}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground text-base font-bold shrink-0">
              {picked.startingFrom && "≥ "}{finalPrice} DH
            </Badge>
          </div>
          {carSize === "4x4" && (
            <div className="mt-2 pt-2 border-t border-primary/20 flex justify-between text-[11px] text-muted-foreground">
              <span>{picked.price} DH + 10 DH (4×4)</span>
              <span className="text-warning font-bold">= {finalPrice} DH</span>
            </div>
          )}
        </Card>
      )}

      <Button
        onClick={submit}
        disabled={saving}
        className="w-full h-14 rounded-xl text-base font-bold sticky bottom-3 z-10"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Save className="w-5 h-5 mx-2" />
        {saving ? t("common.saving") : t("employeeApp.saveOrder")}
      </Button>

        <DailyOrdersTable orders={orders} services={shopServices} myName={myName} branchId={currentBranch?.id} locale={i18n.language === "ar" ? "ar-MA" : "fr-FR"} />
      </div>
    </div>
  );
}

function DailyOrdersTable({
  orders, services, myName, branchId, locale,
}: {
  orders: ReturnType<typeof useApp>["orders"];
  services: ReturnType<typeof useApp>["services"];
  myName: string; branchId?: string; locale: string;
}) {
  const { t, i18n } = useTranslation();
  const todayOrders = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return orders.filter(o => {
      if (o.employeeName !== myName) return false;
      if (branchId && o.branchId !== branchId) return false;
      return new Date(o.createdAt) >= today;
    });
  }, [orders, myName, branchId]);

  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const serviceName = (id: string) => { const sv = services.find(s => s.id === id); return sv ? getServiceName(sv, i18n.language) : "—"; };

  return (
    <Card className="p-3 rounded-2xl shadow-soft">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">{t("employeeApp.myWorkToday")}</h3>
          <Badge variant="secondary" className="text-[10px]">{todayOrders.length}</Badge>
        </div>
        <div className="flex items-center gap-1 text-success font-bold text-sm">
          <Coins className="w-4 h-4" />
          {totalRevenue} DH
        </div>
      </div>

      {todayOrders.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-6">{t("employeeApp.noOrdersToday")}</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[10px] h-8 px-2"><Hash className="w-3 h-3 inline" /></TableHead>
                <TableHead className="text-start text-[10px] h-8 px-2">{t("employeeApp.time")}</TableHead>
                <TableHead className="text-start text-[10px] h-8 px-2">{t("orders.plate")}</TableHead>
                <TableHead className="text-start text-[10px] h-8 px-2">{t("employeeApp.car")}</TableHead>
                <TableHead className="text-start text-[10px] h-8 px-2">{t("employeeApp.service")}</TableHead>
                <TableHead className="text-start text-[10px] h-8 px-2">{t("common.price")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayOrders.map((o, idx) => (
                <TableRow key={o.id}>
                  <TableCell className="text-[11px] px-2 py-1.5 text-muted-foreground">{todayOrders.length - idx}</TableCell>
                  <TableCell className="text-[11px] px-2 py-1.5 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell className="text-[11px] px-2 py-1.5 font-bold">{o.carPlate}</TableCell>
                  <TableCell className="text-[11px] px-2 py-1.5 max-w-[120px] truncate">{o.carType}</TableCell>
                  <TableCell className="text-[11px] px-2 py-1.5 max-w-[140px] truncate">
                    {o.services.map(serviceName).join(", ")}
                  </TableCell>
                  <TableCell className="text-[11px] px-2 py-1.5 font-bold text-primary whitespace-nowrap">{o.totalPrice} DH</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
