import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Car, CheckCircle2, Play, Award, TrendingUp, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Service } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export default function EmployeeApp() {
  const { services, orders, currentBranch, addOrder, updateOrder, refreshAll } = useApp();
  const { profile } = useAuth();

  const [picked, setPicked] = useState<Service | null>(null);
  const [form, setForm] = useState({ carModel: "", plate: "", price: "" });
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const myName = profile?.name || "أنا";

  // Only ACTIVE services are visible to employees
  const activeServices = useMemo(() => services.filter(s => s.isActive), [services]);

  const myOrders = useMemo(() => orders.filter(o => o.employeeName === myName), [orders, myName]);
  const todayOrders = useMemo(() => myOrders.filter(o => o.createdAt.startsWith(today)), [myOrders, today]);
  const todayEarnings = todayOrders.reduce((s, o) => s + o.totalPrice, 0);
  const completedToday = todayOrders.filter(o => o.status === "completed").length;
  const inProgress = orders.filter(o => o.status === "in_progress" && o.employeeName === myName);
  const waiting = orders.filter(o => o.status === "waiting").slice(0, 6);

  const ranking = useMemo(() => {
    const map = new Map<string, number>();
    orders.filter(o => o.createdAt.startsWith(today)).forEach(o => {
      if (o.employeeName) map.set(o.employeeName, (map.get(o.employeeName) || 0) + 1);
    });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const myRank = sorted.findIndex(([n]) => n === myName) + 1;
    return { myRank: myRank || sorted.length + 1 };
  }, [orders, myName, today]);

  // Realtime: refresh on any orders change
  useEffect(() => {
    const ch = supabase
      .channel("emp-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refreshAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshAll]);

  const openForm = (svc: Service) => {
    setPicked(svc);
    setForm({ carModel: "", plate: "", price: svc.price.toString() });
  };

  const closeForm = () => { setPicked(null); setForm({ carModel: "", plate: "", price: "" }); };

  const submit = async () => {
    if (!picked || !currentBranch) return;
    if (!form.plate.trim()) { toast.error("رقم اللوحة مطلوب"); return; }
    const price = Number(form.price);
    if (isNaN(price) || price < 0) { toast.error("سعر غير صحيح"); return; }

    setSaving(true);
    try {
      await addOrder({
        customerId: "",
        customerName: "عميل مباشر",
        carType: form.carModel.trim() || "غير محدد",
        carPlate: form.plate.trim().toUpperCase(),
        services: [picked.id],
        totalPrice: price,
        status: "waiting",
        employeeName: myName,
        branchId: currentBranch.id,
      });
      toast.success(`✓ ${picked.name} - ${price} DH`);
      closeForm();
    } catch (e: any) {
      toast.error("فشل الحفظ: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const startWash = async (id: string) => {
    await updateOrder(id, { status: "in_progress", employeeName: myName });
    toast.success("بدأ الغسيل");
  };
  const completeWash = async (id: string) => {
    await updateOrder(id, { status: "completed", completedAt: new Date().toISOString() });
    toast.success("تم الإنهاء");
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">مرحباً</p>
          <h1 className="text-2xl font-bold">{myName} 👋</h1>
        </div>
        <Badge className="bg-success/10 text-success border-success/20 py-1.5 px-3">
          <Sparkles className="w-3.5 h-3.5 ml-1" /> نشط
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={<Car className="w-5 h-5" />} label="سيارات اليوم" value={todayOrders.length} color="primary" />
        <StatTile icon={<CheckCircle2 className="w-5 h-5" />} label="مكتملة" value={completedToday} color="success" />
        <StatTile icon={<TrendingUp className="w-5 h-5" />} label="إيراداتي" value={`${todayEarnings} DH`} color="accent" />
        <StatTile icon={<Award className="w-5 h-5" />} label="ترتيبي" value={`#${ranking.myRank}`} color="warning" />
      </div>

      {/* SERVICES — POS BIG BUTTONS */}
      <section>
        <h2 className="font-bold mb-3 flex items-center gap-2 text-lg">
          <Droplets className="w-5 h-5 text-primary" /> اختر الخدمة
        </h2>
        {activeServices.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا توجد خدمات مفعّلة. اطلب من الإدارة تفعيلها.</Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activeServices.map(s => (
              <button
                key={s.id}
                onClick={() => openForm(s)}
                className="group relative p-5 rounded-2xl border-2 border-border bg-card text-right transition-all
                          hover:border-primary hover:shadow-glow active:scale-[0.97] active:bg-primary/5"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Droplets className="w-5 h-5" />
                </div>
                <p className="font-bold text-base mb-1 line-clamp-1">{s.name}</p>
                <p className="text-xl font-bold text-primary">{s.price} <span className="text-xs font-medium text-muted-foreground">DH</span></p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" /> قيد التنفيذ
          </h2>
          <div className="space-y-2">
            {inProgress.map(o => (
              <Card key={o.id} className="p-4 flex items-center justify-between border-primary/30 bg-primary/5">
                <div>
                  <p className="font-bold">{o.carPlate}</p>
                  <p className="text-xs text-muted-foreground">{o.carType} · {o.totalPrice} DH</p>
                </div>
                <Button onClick={() => completeWash(o.id)} className="bg-success hover:bg-success/90 text-success-foreground rounded-xl">
                  <CheckCircle2 className="w-4 h-4 ml-1" /> إنهاء
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Waiting */}
      {waiting.length > 0 && (
        <section>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Car className="w-4 h-4 text-warning" /> طابور الانتظار ({waiting.length})
          </h2>
          <div className="space-y-2">
            {waiting.map(o => (
              <Card key={o.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">{o.carPlate}</p>
                  <p className="text-xs text-muted-foreground">{o.carType} · {o.totalPrice} DH</p>
                </div>
                <Button onClick={() => startWash(o.id)} className="rounded-xl">
                  <Play className="w-4 h-4 ml-1" /> ابدأ
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quick POS form */}
      <Dialog open={!!picked} onOpenChange={(v) => !v && closeForm()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{picked?.name}</span>
              <Badge className="bg-primary/10 text-primary border-primary/30">{picked?.price} DH</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">رقم اللوحة *</Label>
              <Input
                autoFocus
                placeholder="مثال: 1234-أ-ب"
                value={form.plate}
                onChange={e => setForm({ ...form, plate: e.target.value })}
                className="h-12 text-lg font-bold text-center uppercase"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">موديل السيارة (اختياري)</Label>
              <Input
                placeholder="مثال: تويوتا كامري"
                value={form.carModel}
                onChange={e => setForm({ ...form, carModel: e.target.value })}
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">السعر (DH)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="h-11 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={closeForm} className="h-12 rounded-xl">
                <X className="w-4 h-4 ml-1" /> إلغاء
              </Button>
              <Button
                onClick={submit}
                disabled={saving}
                className="h-12 rounded-xl text-base font-bold"
                style={{ background: "var(--gradient-primary)" }}
              >
                {saving ? "جاري..." : "حفظ ✓"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <Card className="p-4 rounded-2xl border-0 shadow-soft">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </Card>
  );
}
