import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Clock, CheckCircle2, Loader2, Sparkles, History, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CustomerApp() {
  const { services, orders, branches, currentBranch, addOrder } = useApp();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [car, setCar] = useState({ plate: "", type: "" });

  const myName = profile?.name || "عميل";
  const myOrders = useMemo(
    () => orders.filter(o => o.customerName === myName),
    [orders, myName]
  );
  const active = myOrders.filter(o => o.status !== "completed" && o.status !== "cancelled");
  const history = myOrders.filter(o => o.status === "completed").slice(0, 10);
  const total = picked.reduce((s, id) => s + (services.find(x => x.id === id)?.price || 0), 0);

  const submit = async () => {
    if (!car.plate || picked.length === 0 || !currentBranch) {
      toast.error("اختر الخدمات وأدخل رقم اللوحة");
      return;
    }
    await addOrder({
      customerId: "",
      customerName: myName,
      carType: car.type || "غير محدد",
      carPlate: car.plate,
      services: picked,
      totalPrice: total,
      status: "waiting",
      branchId: currentBranch.id,
    });
    toast.success("تم إرسال طلبك بنجاح");
    setPicked([]); setCar({ plate: "", type: "" }); setOpen(false);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hero */}
      <Card className="p-6 rounded-3xl border-0 shadow-soft overflow-hidden relative" style={{ background: "var(--gradient-primary)" }}>
        <div className="relative z-10 text-white">
          <p className="text-white/80 text-sm">أهلاً</p>
          <h1 className="text-2xl font-bold mb-3">{myName}</h1>
          <Button onClick={() => setOpen(true)} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30 rounded-xl">
            <Plus className="w-4 h-4 ml-1" /> احجز غسيل الآن
          </Button>
        </div>
        <Droplets className="absolute -bottom-4 -left-4 w-32 h-32 text-white/10" />
      </Card>

      {/* Active orders */}
      {active.length > 0 && (
        <section>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" /> طلباتك الحالية
          </h2>
          <div className="space-y-2">
            {active.map(o => <OrderTrackCard key={o.id} order={o} />)}
          </div>
        </section>
      )}

      {/* Services list */}
      <section>
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" /> خدماتنا
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {services.map(s => (
            <Card key={s.id} className="p-4 rounded-2xl border-0 shadow-soft hover:shadow-glow transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Droplets className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">{s.duration} دقيقة</p>
              <p className="text-lg font-bold text-primary">{s.price} ر.س</p>
            </Card>
          ))}
        </div>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <History className="w-4 h-4" /> سجل الغسيل
          </h2>
          <div className="space-y-2">
            {history.map(o => (
              <Card key={o.id} className="p-3 flex items-center justify-between rounded-xl">
                <div>
                  <p className="font-semibold text-sm">{o.carPlate}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</p>
                </div>
                <span className="text-sm font-bold text-success">{o.totalPrice} ر.س</span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Booking dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حجز غسيل</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="رقم اللوحة" value={car.plate} onChange={e => setCar({ ...car, plate: e.target.value })} />
              <Input placeholder="نوع السيارة" value={car.type} onChange={e => setCar({ ...car, type: e.target.value })} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">اختر الخدمات</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {services.map(s => {
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
            <Button onClick={submit} className="w-full h-12 rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              تأكيد الحجز
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderTrackCard({ order }: { order: any }) {
  const steps = [
    { key: "waiting", label: "في الانتظار", icon: Clock },
    { key: "in_progress", label: "قيد التنفيذ", icon: Loader2 },
    { key: "completed", label: "مكتمل", icon: CheckCircle2 },
  ];
  const activeIdx = steps.findIndex(s => s.key === order.status);

  return (
    <Card className="p-4 rounded-2xl border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold">{order.carPlate}</p>
          <p className="text-xs text-muted-foreground">{order.services.length} خدمة · {order.totalPrice} ر.س</p>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary">
          {steps[activeIdx]?.label}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex-1 flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
              i <= activeIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              <s.icon className={`w-3.5 h-3.5 ${i === activeIdx && s.key === "in_progress" ? "animate-spin" : ""}`} />
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 rounded ${i < activeIdx ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
