import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Car, CheckCircle2, Play, Plus, Award, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Service } from "@/types";

export default function EmployeeApp() {
  const { services, orders, currentBranch, addOrder, updateOrder } = useApp();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [carInfo, setCarInfo] = useState({ name: "", plate: "", type: "" });

  const today = new Date().toISOString().slice(0, 10);
  const myName = profile?.name || "أنا";

  const myOrders = useMemo(() => orders.filter(o => o.employeeName === myName), [orders, myName]);
  const todayOrders = useMemo(
    () => myOrders.filter(o => o.createdAt.startsWith(today)),
    [myOrders, today]
  );
  const todayEarnings = todayOrders.reduce((s, o) => s + o.totalPrice, 0);
  const completedToday = todayOrders.filter(o => o.status === "completed").length;
  const inProgress = orders.filter(o => o.status === "in_progress" && o.employeeName === myName);
  const waiting = orders.filter(o => o.status === "waiting").slice(0, 6);

  // Ranking
  const ranking = useMemo(() => {
    const map = new Map<string, number>();
    orders.filter(o => o.createdAt.startsWith(today)).forEach(o => {
      if (o.employeeName) map.set(o.employeeName, (map.get(o.employeeName) || 0) + 1);
    });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const myRank = sorted.findIndex(([n]) => n === myName) + 1;
    return { myRank: myRank || sorted.length + 1, total: sorted.length || 1 };
  }, [orders, myName, today]);

  const total = picked.reduce((s, id) => s + (services.find(x => x.id === id)?.price || 0), 0);

  const submitOrder = async () => {
    if (!carInfo.plate || picked.length === 0 || !currentBranch) {
      toast.error("اختر الخدمات وأدخل رقم اللوحة");
      return;
    }
    await addOrder({
      customerId: "",
      customerName: carInfo.name || "عميل مباشر",
      carType: carInfo.type || "غير محدد",
      carPlate: carInfo.plate,
      services: picked,
      totalPrice: total,
      status: "waiting",
      employeeName: myName,
      branchId: currentBranch.id,
    });
    toast.success("تم تسجيل الطلب");
    setPicked([]); setCarInfo({ name: "", plate: "", type: "" }); setOpen(false);
  };

  const startWash = async (id: string) => {
    await updateOrder(id, { status: "in_progress", employeeName: myName });
    toast.success("بدأت الغسيل");
  };
  const completeWash = async (id: string) => {
    await updateOrder(id, { status: "completed", completedAt: new Date().toISOString() });
    toast.success("تم إكمال الغسيل");
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">مرحباً</p>
          <h1 className="text-2xl font-bold">{myName} 👋</h1>
        </div>
        <Badge className="bg-success/10 text-success border-success/20 text-sm py-1.5 px-3">
          <Sparkles className="w-3.5 h-3.5 ml-1" /> نشط
        </Badge>
      </div>

      {/* Stats grid (mobile first) */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={<Car className="w-5 h-5" />} label="سيارات اليوم" value={todayOrders.length} color="primary" />
        <StatTile icon={<CheckCircle2 className="w-5 h-5" />} label="مكتملة" value={completedToday} color="success" />
        <StatTile icon={<TrendingUp className="w-5 h-5" />} label="إيراداتي" value={`${todayEarnings} ر.س`} color="accent" />
        <StatTile icon={<Award className="w-5 h-5" />} label="ترتيبي" value={`#${ranking.myRank}`} color="warning" />
      </div>

      {/* Big primary action */}
      <Button
        onClick={() => setOpen(true)}
        className="w-full h-20 text-lg font-bold rounded-2xl shadow-glow"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Plus className="w-6 h-6 ml-2" />
        تسجيل طلب جديد
      </Button>

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
                  <p className="text-xs text-muted-foreground">{o.customerName} · {o.totalPrice} ر.س</p>
                </div>
                <Button
                  onClick={() => completeWash(o.id)}
                  className="bg-success hover:bg-success/90 text-success-foreground rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4 ml-1" /> إنهاء
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Waiting queue */}
      <section>
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <Car className="w-4 h-4 text-warning" /> طابور الانتظار ({waiting.length})
        </h2>
        {waiting.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا يوجد طلبات في الانتظار</Card>
        ) : (
          <div className="space-y-2">
            {waiting.map(o => (
              <Card key={o.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">{o.carPlate}</p>
                  <p className="text-xs text-muted-foreground">{o.customerName} · {o.services.length} خدمة · {o.totalPrice} ر.س</p>
                </div>
                <Button onClick={() => startWash(o.id)} className="rounded-xl">
                  <Play className="w-4 h-4 ml-1" /> ابدأ
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* New order dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>طلب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم العميل (اختياري)" value={carInfo.name} onChange={e => setCarInfo({ ...carInfo, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="رقم اللوحة" value={carInfo.plate} onChange={e => setCarInfo({ ...carInfo, plate: e.target.value })} />
              <Input placeholder="نوع السيارة" value={carInfo.type} onChange={e => setCarInfo({ ...carInfo, type: e.target.value })} />
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">اختر الخدمات</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {services.map((s: Service) => {
                  const sel = picked.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setPicked(p => sel ? p.filter(x => x !== s.id) : [...p, s.id])}
                      className={`p-3 rounded-xl border-2 text-right transition-all ${
                        sel ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.price} ر.س</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">الإجمالي</span>
              <span className="text-2xl font-bold text-primary">{total} ر.س</span>
            </div>

            <Button onClick={submitOrder} className="w-full h-12 rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              تأكيد الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="p-4 rounded-2xl border-0 shadow-soft">
      <div className={`w-10 h-10 rounded-xl bg-${color}/10 text-${color} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </Card>
  );
}
