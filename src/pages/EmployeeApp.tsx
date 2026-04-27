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
import { Car, Save, Crown, Sparkles, Package, Droplets, Check, Bike, ListChecks, Coins, Hash, Search, X, ChevronLeft, ChevronRight, CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { getServiceName } from "@/lib/serviceI18n";

import { useEffectiveServices } from "@/hooks/useEffectiveServices";

const CAR_BRANDS = [
  "Audi", "BMW", "Chevrolet", "Citroën", "Dacia", "Fiat", "Ford", "Honda",
  "Hyundai", "Jeep", "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes",
  "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Seat",
  "Skoda", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

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

  const [carPlate, setCarPlate] = useState("");
  const [carType, setCarType] = useState("");
  const [carSize, setCarSize] = useState<"normal" | "4x4" | "motor">("normal");
  const [serviceId, setServiceId] = useState<string>("");
  const [tab, setTab] = useState<ServiceCategory>("standard");
  const [saving, setSaving] = useState(false);
  const [orderDate, setOrderDate] = useState<Date>(new Date());

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
    if (!carPlate.trim()) { toast.error(t("employeeApp.plateRequired", { defaultValue: "أدخل رقم السيارة" })); return; }
    if (!picked) { toast.error(t("employeeApp.chooseServiceErr")); return; }
    if (!currentBranch) { toast.error(t("employeeApp.noBranch")); return; }

    setSaving(true);
    try {
      const sizeLabel = carSize === "4x4" ? "4x4" : carSize === "motor" ? "Motor" : "Normal";
      await addOrder({
        customerId: "",
        customerName: t("employeeApp.directCustomer"),
        carType: `${(carType.trim() || "—")} (${sizeLabel})`,
        carPlate: carPlate.trim().toUpperCase(),
        services: [picked.id],
        totalPrice: finalPrice,
        status: "in_progress",
        employeeName: myName,
        branchId: currentBranch.id,
        notes: carSize === "4x4" ? `+${SURCHARGE_4X4} DH ${t("employeeApp.surchargeAdded")}` : carSize === "motor" ? t("employeeApp.motorcycle") : undefined,
      });
      toast.success(`${t("employeeApp.saved")} - ${finalPrice} DH`);
      setCarPlate(""); setCarType(""); setServiceId(""); setCarSize("normal");
    } catch (e: any) {
      toast.error(t("employeeApp.saveFailed") + ": " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-2 sm:px-3 py-2 space-y-2 sm:space-y-3 pb-28">

      <Card className="p-4 rounded-2xl space-y-3 shadow-soft">
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Car className="w-4 h-4 text-primary" />
            <span>{t("employeeApp.employeeName", { defaultValue: "اسم الموظف" })}:</span>
            <span className="text-primary">{myName}</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              autoFocus
              placeholder={t("employeeApp.plateExample", { defaultValue: "رقم السيارة" })}
              value={carPlate}
              onChange={e => setCarPlate(e.target.value)}
              className="h-9 text-sm font-bold text-center uppercase"
            />
            <Input
              placeholder={carSize === "motor" ? t("employeeApp.placeholderMotor") : t("employeeApp.placeholderType", { defaultValue: "نوع السيارة" })}
              value={carType}
              onChange={e => setCarType(e.target.value)}
              className="h-9 text-sm font-bold text-center"
              list="car-brands-list"
              autoComplete="off"
            />
            <datalist id="car-brands-list">
              {CAR_BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          {carSize === "motor" && <p className="text-[11px] text-success mt-1.5">{t("employeeApp.motorNote")}</p>}
        </div>
      </Card>

      <Card className="p-2 sm:p-3 rounded-2xl shadow-soft">
        <div className="flex items-center gap-1.5 mb-3 px-1 overflow-x-auto no-scrollbar -mx-1 pb-1">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button"
                className="h-7 px-2 rounded-md text-[10px] font-bold border border-border bg-card text-muted-foreground hover:border-primary/50 transition-all flex items-center gap-1">
                <CalendarIcon className="w-2.5 h-2.5" />
                {format(orderDate, "dd/MM HH:mm")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={orderDate}
                onSelect={(d) => {
                  if (!d) return;
                  const next = new Date(d);
                  next.setHours(orderDate.getHours(), orderDate.getMinutes(), 0, 0);
                  setOrderDate(next);
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="flex items-center gap-2 p-3 pt-0 border-t border-border">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="time"
                  value={format(orderDate, "HH:mm")}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    if (Number.isNaN(h) || Number.isNaN(m)) return;
                    const next = new Date(orderDate);
                    next.setHours(h, m, 0, 0);
                    setOrderDate(next);
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </PopoverContent>
          </Popover>
          <button type="button" onClick={() => setCarSize("normal")}
            className={`h-7 px-2 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
              carSize === "normal" ? "border-primary bg-primary text-primary-foreground shadow-glow"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}>
            <Car className="w-2.5 h-2.5" />
            {t("employeeApp.normal")}
          </button>
          <button type="button" onClick={() => setCarSize("4x4")}
            className={`h-7 px-2 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
              carSize === "4x4" ? "border-primary bg-primary text-primary-foreground shadow-glow"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}>
            <span>4×4</span>
          </button>
          <button type="button" onClick={() => setCarSize("motor")}
            className={`h-7 px-2 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
              carSize === "motor" ? "border-primary bg-primary text-primary-foreground shadow-glow"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}>
            <Bike className="w-2.5 h-2.5" />
            {t("employeeApp.motor")}
          </button>
        </div>
        {carSize === "motor" ? (
          grouped.motor.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">{t("employeeApp.noMotorServices")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped.motor.map(s => {
                const selected = s.id === serviceId;
                return (
                  <button key={s.id} type="button" onClick={() => setServiceId(s.id)}
                    className={`relative p-4 rounded-xl border-2 text-start transition-all active:scale-[0.97] min-h-[96px] ${
                      selected ? "border-success bg-success/15 shadow-glow"
                      : "border-success/30 bg-gradient-to-br from-success/5 to-transparent hover:border-success"}`}>
                    {selected ? (
                      <div className="absolute top-1.5 start-1.5 w-5 h-5 rounded-full bg-success text-success-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : <Bike className="w-3.5 h-3.5 text-success absolute top-1.5 start-1.5" />}
                    <p className="font-bold text-sm leading-6 break-words ps-5">{getServiceName(s, i18n.language)}</p>
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
          <TabsList className="grid grid-cols-4 w-full h-auto mb-3 gap-0.5">
            {CATS.map(c => {
              const Icon = c.icon;
              return (
                <TabsTrigger key={c.id} value={c.id} className="flex flex-col gap-0.5 py-1.5 px-1 data-[state=active]:shadow-glow">
                  <Icon className={`w-3.5 h-3.5 ${c.cls}`} />
                  <span className="text-[11px] sm:text-xs font-bold leading-tight">{c.label}</span>
                  <span className="text-[9px] text-muted-foreground leading-none">{grouped[c.id].length}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATS.map(c => (
            <TabsContent key={c.id} value={c.id} className="mt-0 min-h-[220px]">
              {grouped[c.id].length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">{t("employeeApp.noServicesCat")}</p>
              ) : (
                <div className="rounded-xl border border-border">
                  <table dir="rtl" className="w-full text-sm border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: "32px" }} />
                      <col />
                      <col style={{ width: "70px" }} />
                      <col style={{ width: "50px" }} />
                    </colgroup>
                    <thead className="bg-muted/40">
                      <tr className="text-xs text-muted-foreground">
                        <th className="px-1 py-2 text-center">{t("employeeApp.colSelect", { defaultValue: "اختيار" })}</th>
                        <th className="px-2 py-2 text-start">{t("employeeApp.colService", { defaultValue: "اسم الخدمة" })}</th>
                        <th className="px-1 py-2 text-end whitespace-nowrap">{t("employeeApp.colPrice", { defaultValue: "السعر" })}</th>
                        <th className="px-1 py-2 text-center whitespace-nowrap">{t("employeeApp.colDuration", { defaultValue: "المدة" })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[c.id].map(s => {
                        const selected = s.id === serviceId;
                        const isVip = s.category === "vip";
                        const isPack = s.category === "packs";
                        const finalRowPrice = s.price + (carSize === "4x4" ? SURCHARGE_4X4 : 0);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => setServiceId(s.id)}
                            className={`cursor-pointer border-t border-border transition-colors ${
                              selected
                                ? "bg-primary/15 ring-2 ring-inset ring-primary"
                                : "hover:bg-muted/30 active:bg-muted/50"
                            }`}
                          >
                            <td className="px-1 py-2.5 text-center align-middle">
                              <div
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {selected && <Check className="w-3 h-3" />}
                              </div>
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <div className="flex items-center gap-1 flex-wrap">
                                {isVip && <Crown className="w-3.5 h-3.5 text-warning shrink-0" />}
                                {isPack && <Package className="w-3.5 h-3.5 text-success shrink-0" />}
                                <span className={`font-semibold break-words text-xs sm:text-sm ${selected ? "text-primary" : "text-foreground"}`}>
                                  {getServiceName(s, i18n.language)}
                                </span>
                              </div>
                            </td>
                            <td className="px-1 py-2.5 text-end align-middle whitespace-nowrap">
                              {s.startingFrom && (
                                <span className="text-[9px] text-muted-foreground block leading-none mb-0.5">
                                  {t("services.startingFrom")}
                                </span>
                              )}
                              <span className={`font-bold text-xs sm:text-sm ${selected ? "text-primary" : "text-foreground"}`}>
                                {finalRowPrice} <span className="text-[10px] text-muted-foreground">DH</span>
                              </span>
                              {carSize === "4x4" && (
                                <span className="block text-[9px] text-warning font-semibold leading-none mt-0.5">
                                  {s.price} + {SURCHARGE_4X4} (4×4)
                                </span>
                              )}
                            </td>
                            <td className="px-1 py-2.5 text-center align-middle whitespace-nowrap text-[11px] sm:text-xs text-muted-foreground">
                              {s.duration ? `${s.duration} د` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

        <WorkEntriesTable services={shopServices} myName={myName} branchId={currentBranch?.id} locale={i18n.language === "ar" ? "ar-MA" : "fr-FR"} />
      </div>
    </div>
  );
}

function WorkEntriesTable({
  services, myName, branchId, locale,
}: {
  services: ReturnType<typeof useApp>["services"];
  myName: string; branchId?: string; locale: string;
}) {
  const { t, i18n } = useTranslation();
  const { orders, updateOrder } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed" | "cancelled" | "waiting">("all");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("today");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const serviceName = (id: string) => {
    const sv = services.find((s) => s.id === id);
    return sv ? getServiceName(sv, i18n.language) : "—";
  };
  const serviceDuration = (id: string) => services.find((s) => s.id === id)?.duration ?? 0;

  const myOrders = useMemo(() => {
    const now = Date.now();
    return orders
      .filter((o) => (branchId ? o.branchId === branchId : true))
      .filter((o) => {
        if (dateFilter === "all") return true;
        const t = new Date(o.startAt || o.createdAt).getTime();
        if (dateFilter === "today") {
          const d = new Date(); d.setHours(0, 0, 0, 0);
          return t >= d.getTime();
        }
        return t >= now - 7 * 24 * 60 * 60 * 1000;
      })
      .filter((o) => (statusFilter === "all" ? true : o.status === statusFilter))
      .filter((o) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        if ((o.reference || "").toLowerCase().includes(q)) return true;
        return o.services.some((sid) => serviceName(sid).toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(b.startAt || b.createdAt).getTime() - new Date(a.startAt || a.createdAt).getTime());
  }, [orders, myName, branchId, statusFilter, dateFilter, search, services, i18n.language]);

  const totalPages = Math.max(1, Math.ceil(myOrders.length / PAGE_SIZE));
  const pageRows = myOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalRevenue = myOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);

  const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };
  const fmtTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-success/20 text-success border-success/40";
      case "in_progress": return "bg-primary/20 text-primary border-primary/40";
      case "cancelled": return "bg-destructive/20 text-destructive border-destructive/40";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };
  const statusLabel = (s: string) => {
    if (s === "completed") return t("employeeApp.statusCompleted", { defaultValue: "مكتمل" });
    if (s === "in_progress") return t("employeeApp.statusInProgress", { defaultValue: "جارٍ" });
    if (s === "cancelled") return t("employeeApp.statusCancelled", { defaultValue: "ملغى" });
    return t("employeeApp.statusWaiting", { defaultValue: "قيد الانتظار" });
  };

  const handleComplete = async (id: string) => {
    try { await updateOrder(id, { status: "completed", completedAt: new Date().toISOString() }); toast.success(t("employeeApp.markedCompleted", { defaultValue: "تم إكمال العملية" })); }
    catch (e: any) { toast.error(e?.message || "Error"); }
  };
  const handleCancel = async (id: string) => {
    try { await updateOrder(id, { status: "cancelled" }); toast.success(t("employeeApp.markedCancelled", { defaultValue: "تم إلغاء العملية" })); }
    catch (e: any) { toast.error(e?.message || "Error"); }
  };

  return (
    <Card className="p-3 rounded-2xl shadow-soft">
      <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">{t("employeeApp.workEntries", { defaultValue: "سجل العمليات" })}</h3>
          <Badge variant="secondary" className="text-[10px]">{myOrders.length}</Badge>
        </div>
        <div className="flex items-center gap-1 text-success font-bold text-sm">
          <Coins className="w-4 h-4" />
          {totalRevenue} DH
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("employeeApp.searchRefOrService", { defaultValue: "بحث بالمرجع أو اسم الخدمة..." })}
            className="ps-9 h-9 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-xs"
        >
          <option value="all">{t("employeeApp.allStatuses", { defaultValue: "كل الحالات" })}</option>
          <option value="in_progress">{statusLabel("in_progress")}</option>
          <option value="completed">{statusLabel("completed")}</option>
          <option value="cancelled">{statusLabel("cancelled")}</option>
          <option value="waiting">{statusLabel("waiting")}</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value as any); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-xs"
        >
          <option value="today">{t("employeeApp.dateToday", { defaultValue: "اليوم" })}</option>
          <option value="week">{t("employeeApp.dateWeek", { defaultValue: "آخر 7 أيام" })}</option>
          <option value="all">{t("employeeApp.dateAll", { defaultValue: "الكل" })}</option>
        </select>
      </div>

      <>
          {/* Mobile: stacked rows (no horizontal scroll) */}
          <div
            className="md:hidden flex flex-col gap-2 pb-28"
            style={{ paddingBottom: "max(7rem, env(safe-area-inset-bottom))" }}
          >
            {pageRows.length === 0 && (
              <div className="w-full rounded-xl border px-3 py-6 text-center text-xs text-muted-foreground bg-card">
                {t("employeeApp.noEntries", { defaultValue: "لا توجد عمليات." })}
              </div>
            )}
            {pageRows.map((o) => {
              const sid = o.services[0];
              const dur = sid ? serviceDuration(sid) : 0;
              return (
                <div key={o.id} className="w-full rounded-xl border px-3 py-3 min-h-[88px] flex flex-col gap-1.5 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-6 break-words whitespace-normal flex-1 min-w-0">
                      {o.services.map(serviceName).join(", ")}
                    </p>
                    <span className="text-base font-bold text-primary whitespace-nowrap shrink-0">{o.totalPrice} DH</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Ref: <span className="font-bold text-foreground">{o.reference || "—"}</span>
                    {dur > 0 && <span className="ms-2">· {dur}m</span>}
                    <span className="ms-2">· {o.carPlate}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("employeeApp.startAt", { defaultValue: "البداية" })}: {fmtDateTime(o.startAt || o.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("employeeApp.expectedEnd", { defaultValue: "نهاية متوقعة" })}: {fmtTime(o.expectedEndAt)}
                    {o.completedAt && (
                      <span className="ms-2">
                        · {t("employeeApp.actualEnd", { defaultValue: "نهاية فعلية" })}: {fmtTime(o.completedAt)}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Badge variant="outline" className={`text-[10px] ${statusColor(o.status)}`}>{statusLabel(o.status)}</Badge>
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-8 px-3 text-[11px]" onClick={() => handleComplete(o.id)}>
                          <Check className="w-3.5 h-3.5 me-1" />{t("employeeApp.complete", { defaultValue: "إكمال" })}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-3 text-[11px]" onClick={() => handleCancel(o.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet: full table */}
          <div className="hidden md:block overflow-x-auto -mx-1 md:pb-6">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap"><Hash className="w-3 h-3 inline me-1" />Ref</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.service", { defaultValue: "الخدمة" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.car", { defaultValue: "السيارة" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.employee", { defaultValue: "الموظف" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.startAt", { defaultValue: "البداية" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.expectedEnd", { defaultValue: "نهاية متوقعة" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.actualEnd", { defaultValue: "نهاية فعلية" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.duration", { defaultValue: "المدة" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("common.price", { defaultValue: "السعر" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.status", { defaultValue: "الحالة" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("employeeApp.notes", { defaultValue: "ملاحظات" })}</TableHead>
                  <TableHead className="text-start text-[10px] h-9 px-2 whitespace-nowrap">{t("common.actions", { defaultValue: "إجراء" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-xs text-muted-foreground py-6">
                      {t("employeeApp.noEntries", { defaultValue: "لا توجد عمليات." })}
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((o) => {
                  const sid = o.services[0];
                  const dur = sid ? serviceDuration(sid) : 0;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="text-[11px] px-2 py-1.5 font-mono font-bold whitespace-nowrap">{o.reference || "—"}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 max-w-[180px] truncate">{o.services.map(serviceName).join(", ")}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 max-w-[140px] truncate">
                        <span className="font-bold">{o.carPlate}</span>
                        <span className="text-muted-foreground"> · {o.carType}</span>
                      </TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 max-w-[120px] truncate">{o.employeeName || "—"}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 whitespace-nowrap">{fmtDateTime(o.startAt || o.createdAt)}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 whitespace-nowrap">{fmtTime(o.expectedEndAt)}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 whitespace-nowrap">{fmtTime(o.completedAt)}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 whitespace-nowrap">{dur > 0 ? `${dur}m` : "—"}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 font-bold text-primary whitespace-nowrap">{o.totalPrice} DH</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5">
                        <Badge variant="outline" className={`text-[10px] ${statusColor(o.status)}`}>{statusLabel(o.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 max-w-[140px] truncate text-muted-foreground">{o.notes || "—"}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5 whitespace-nowrap">
                        {o.status !== "completed" && o.status !== "cancelled" ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" className="h-7 px-2 text-[10px]" onClick={() => handleComplete(o.id)}>
                              <Check className="w-3 h-3 me-1" />{t("employeeApp.complete", { defaultValue: "إكمال" })}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleCancel(o.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[11px] text-muted-foreground">
                {t("common.page", { defaultValue: "صفحة" })} {page} / {totalPages}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}
      </>
    </Card>
  );
}
