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
import { useTranslation } from "react-i18next";
import { getServiceName } from "@/lib/serviceI18n";

export default function CustomerApp() {
  const { services, orders, currentBranch, addOrder } = useApp();
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [car, setCar] = useState({ plate: "", type: "" });

  const myName = profile?.name || t("common.customer");
  const myOrders = useMemo(() => orders.filter(o => o.customerName === myName), [orders, myName]);
  const active = myOrders.filter(o => o.status !== "completed" && o.status !== "cancelled");
  const history = myOrders.filter(o => o.status === "completed").slice(0, 10);
  const total = picked.reduce((s, id) => s + (services.find(x => x.id === id)?.price || 0), 0);

  const submit = async () => {
    if (!car.plate || picked.length === 0 || !currentBranch) {
      toast.error(t("customerApp.bookingError")); return;
    }
    await addOrder({
      customerId: "", customerName: myName,
      carType: car.type || t("customerApp.notSpecified"), carPlate: car.plate,
      services: picked, totalPrice: total, status: "waiting", branchId: currentBranch.id,
    });
    toast.success(t("customerApp.bookingSent"));
    setPicked([]); setCar({ plate: "", type: "" }); setOpen(false);
  };

  return (
    <div className="space-y-5 pb-24">
      <Card className="p-6 rounded-3xl border-0 shadow-soft overflow-hidden relative" style={{ background: "var(--gradient-primary)" }}>
        <div className="relative z-10 text-white">
          <p className="text-white/80 text-sm">{t("customerApp.hello")}</p>
          <h1 className="text-2xl font-bold mb-3">{myName}</h1>
          <Button onClick={() => setOpen(true)} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30 rounded-xl">
            <Plus className="w-4 h-4 mx-1" /> {t("customerApp.bookNow")}
          </Button>
        </div>
        <Droplets className="absolute -bottom-4 -start-4 w-32 h-32 text-white/10" />
      </Card>

      {active.length > 0 && (
        <section>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" /> {t("customerApp.currentOrders")}
          </h2>
          <div className="space-y-2">
            {active.map(o => <OrderTrackCard key={o.id} order={o} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" /> {t("customerApp.ourServices")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {services.map(s => (
            <Card key={s.id} className="p-4 rounded-2xl border-0 shadow-soft hover:shadow-glow transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Droplets className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">{s.duration} {t("common.minutes")}</p>
              <p className="text-lg font-bold text-primary">{s.price} {t("common.currency")}</p>
            </Card>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <History className="w-4 h-4" /> {t("customerApp.history")}
          </h2>
          <div className="space-y-2">
            {history.map(o => (
              <Card key={o.id} className="p-3 flex items-center justify-between rounded-xl">
                <div>
                  <p className="font-semibold text-sm">{o.carPlate}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString(locale)}</p>
                </div>
                <span className="text-sm font-bold text-success">{o.totalPrice} {t("common.currency")}</span>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("customerApp.booking")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={t("orders.carPlate")} value={car.plate} onChange={e => setCar({ ...car, plate: e.target.value })} />
              <Input placeholder={t("orders.carType")} value={car.type} onChange={e => setCar({ ...car, type: e.target.value })} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">{t("customerApp.chooseServices")}</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {services.map(s => {
                  const sel = picked.includes(s.id);
                  return (
                    <button key={s.id}
                      onClick={() => setPicked(p => sel ? p.filter(x => x !== s.id) : [...p, s.id])}
                      className={`p-3 rounded-xl border-2 text-start transition-all ${
                        sel ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/40"
                      }`}>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.price} {t("common.currency")}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t("customerApp.total")}</span>
              <span className="text-2xl font-bold text-primary">{total} {t("common.currency")}</span>
            </div>
            <Button onClick={submit} className="w-full h-12 rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              {t("customerApp.confirmBooking")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderTrackCard({ order }: { order: any }) {
  const { t } = useTranslation();
  const steps = [
    { key: "waiting", label: t("customerApp.waiting"), icon: Clock },
    { key: "in_progress", label: t("customerApp.inProgress"), icon: Loader2 },
    { key: "completed", label: t("customerApp.completedStep"), icon: CheckCircle2 },
  ];
  const activeIdx = steps.findIndex(s => s.key === order.status);

  return (
    <Card className="p-4 rounded-2xl border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold">{order.carPlate}</p>
          <p className="text-xs text-muted-foreground">{order.services.length} · {order.totalPrice} {t("common.currency")}</p>
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
