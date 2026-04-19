import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, Car, Save } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeApp() {
  const { services, currentBranch, addOrder } = useApp();
  const { profile } = useAuth();

  const [plate, setPlate] = useState("");
  const [carType, setCarType] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const activeServices = useMemo(() => services.filter(s => s.isActive), [services]);
  const picked = activeServices.find(s => s.id === serviceId);
  const myName = profile?.name || "موظف";

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
        carType: carType.trim(),
        carPlate: plate.trim().toUpperCase(),
        services: [picked.id],
        totalPrice: picked.price,
        status: "waiting",
        employeeName: myName,
        branchId: currentBranch.id,
      });
      toast.success(`✓ تم الحفظ - ${picked.price} DH`);
      setPlate(""); setCarType(""); setServiceId("");
    } catch (e: any) {
      toast.error("فشل الحفظ: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-24 pt-2">
      <div className="text-center">
        <h1 className="text-2xl font-bold">تسجيل سيارة</h1>
        <p className="text-sm text-muted-foreground mt-1">{myName}</p>
      </div>

      <Card className="p-5 rounded-2xl space-y-4 shadow-soft">
        {/* Plate */}
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Car className="w-4 h-4 text-primary" /> رقم اللوحة
          </Label>
          <Input
            autoFocus
            placeholder="1234-أ-ب"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            className="h-14 text-xl font-bold text-center uppercase"
          />
        </div>

        {/* Car type */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">نوع السيارة</Label>
          <Input
            placeholder="مثال: تويوتا كامري"
            value={carType}
            onChange={e => setCarType(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Service picker */}
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Droplets className="w-4 h-4 text-primary" /> اختر الخدمة
          </Label>
          {activeServices.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">لا توجد خدمات مفعّلة</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeServices.map(s => {
                const selected = s.id === serviceId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    className={`p-3 rounded-xl border-2 text-right transition-all active:scale-[0.97] ${
                      selected
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className="font-bold text-sm line-clamp-1">{s.name}</p>
                    <p className={`text-base font-bold mt-0.5 ${selected ? "text-primary" : "text-foreground"}`}>
                      {s.price} <span className="text-[10px] text-muted-foreground">DH</span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Save */}
        <Button
          onClick={submit}
          disabled={saving}
          className="w-full h-14 rounded-xl text-base font-bold"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Save className="w-5 h-5 ml-2" />
          {saving ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </Card>
    </div>
  );
}
