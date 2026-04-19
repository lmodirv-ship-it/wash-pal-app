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
import { Car, Save, Crown, Sparkles, Package, Droplets, Check } from "lucide-react";
import { toast } from "sonner";

const CATS: { id: ServiceCategory; label: string; icon: any; cls: string }[] = [
  { id: "standard", label: "Standard", icon: Droplets, cls: "text-primary" },
  { id: "vip", label: "VIP", icon: Crown, cls: "text-warning" },
  { id: "extra", label: "Extra", icon: Sparkles, cls: "text-accent-foreground" },
  { id: "packs", label: "Packs", icon: Package, cls: "text-success" },
];

export default function EmployeeApp() {
  const { services, currentBranch, addOrder } = useApp();
  const { profile } = useAuth();

  const [plate, setPlate] = useState("");
  const [carType, setCarType] = useState("");
  const [carSize, setCarSize] = useState<"normal" | "4x4">("normal");
  const [serviceId, setServiceId] = useState<string>("");
  const [tab, setTab] = useState<ServiceCategory>("standard");
  const [saving, setSaving] = useState(false);

  const SURCHARGE_4X4 = 10;

  const activeServices = useMemo(() => services.filter(s => s.isActive), [services]);
  const picked = activeServices.find(s => s.id === serviceId);
  const myName = profile?.name || "موظف";

  const grouped = useMemo(() => {
    const out: Record<ServiceCategory, typeof activeServices> = { standard: [], vip: [], extra: [], packs: [] };
    activeServices.forEach(s => out[s.category]?.push(s));
    return out;
  }, [activeServices]);

  const finalPrice = picked ? picked.price + (carSize === "4x4" ? SURCHARGE_4X4 : 0) : 0;

  const submit = async () => {
    if (!plate.trim()) { toast.error("رقم اللوحة مطلوب"); return; }
    if (!carType.trim()) { toast.error("نوع السيارة مطلوب"); return; }
    if (!picked) { toast.error("اختر الخدمة"); return; }
    if (!currentBranch) { toast.error("لا يوجد فرع"); return; }

    setSaving(true);
    try {
      await addOrder({
        customerId: "",
        customerName: "عميل مباشر",
        carType: `${carType.trim()} (${carSize === "4x4" ? "4x4" : "Normal"})`,
        carPlate: plate.trim().toUpperCase(),
        services: [picked.id],
        totalPrice: finalPrice,
        status: "waiting",
        employeeName: myName,
        branchId: currentBranch.id,
        notes: carSize === "4x4" ? `+${SURCHARGE_4X4} DH زيادة 4x4` : undefined,
      });
      toast.success(`✓ تم الحفظ - ${finalPrice} DH`);
      setPlate(""); setCarType(""); setServiceId(""); setCarSize("normal");
    } catch (e: any) {
      toast.error("فشل الحفظ: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-32 pt-2">
      <div className="text-center">
        <h1 className="text-2xl font-bold">تسجيل سيارة</h1>
        <p className="text-sm text-muted-foreground mt-1">{myName}</p>
      </div>

      <Card className="p-4 rounded-2xl space-y-3 shadow-soft">
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Car className="w-4 h-4 text-primary" /> رقم اللوحة
          </Label>
          <Input
            autoFocus
            placeholder="1234-أ-ب"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            className="h-12 text-lg font-bold text-center uppercase"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">نوع السيارة</Label>
          <Input
            placeholder="مثال: تويوتا كامري"
            value={carType}
            onChange={e => setCarType(e.target.value)}
            className="h-11"
          />
        </div>
      </Card>

      <Card className="p-3 rounded-2xl shadow-soft">
        <Label className="text-sm font-semibold mb-3 block px-1">اختر الخدمة</Label>
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
                <p className="text-center text-sm text-muted-foreground py-6">لا توجد خدمات</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {grouped[c.id].map(s => {
                    const selected = s.id === serviceId;
                    const isVip = s.category === "vip";
                    const isPack = s.category === "packs";
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setServiceId(s.id)}
                        className={`relative p-3 rounded-xl border-2 text-right transition-all active:scale-[0.97] min-h-[88px] ${
                          selected
                            ? "border-primary bg-primary/15 shadow-glow"
                            : isVip
                            ? "border-warning/40 bg-gradient-to-br from-warning/10 to-transparent hover:border-warning"
                            : isPack
                            ? "border-success/40 bg-gradient-to-br from-success/10 to-transparent hover:border-success"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        {isVip && !selected && <Crown className="w-3.5 h-3.5 text-warning absolute top-1.5 left-1.5" />}
                        {isPack && !selected && <Package className="w-3.5 h-3.5 text-success absolute top-1.5 left-1.5" />}
                        <p className="font-bold text-sm line-clamp-2 leading-tight">{s.name}</p>
                        <div className="mt-1.5">
                          {s.startingFrom && <span className="text-[9px] text-muted-foreground block leading-none">ابتداءً من</span>}
                          <p className={`text-lg font-bold ${selected ? "text-primary" : "text-foreground"}`}>
                            {s.price} <span className="text-[10px] text-muted-foreground">DH</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {picked && (
        <Card className="p-3 rounded-xl bg-primary/10 border-primary/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">الخدمة المختارة</p>
            <p className="font-bold text-sm">{picked.name}</p>
          </div>
          <Badge className="bg-primary text-primary-foreground text-base font-bold">
            {picked.startingFrom && "≥ "}{picked.price} DH
          </Badge>
        </Card>
      )}

      <Button
        onClick={submit}
        disabled={saving}
        className="w-full h-14 rounded-xl text-base font-bold sticky bottom-20"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Save className="w-5 h-5 ml-2" />
        {saving ? "جاري الحفظ..." : "حفظ الطلب"}
      </Button>
    </div>
  );
}
