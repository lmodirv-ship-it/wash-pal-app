import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { AlertTriangle, Sparkles, MessageCircle, X } from "lucide-react";
import { openWhatsAppUpgrade, PAYMENT_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

interface SubRow {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string;
  billing_cycle: string;
}

export function TrialBanner() {
  const { currentShopId, tenantShops } = useApp();
  const [sub, setSub] = useState<SubRow | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [shopName, setShopName] = useState<string>("");

  useEffect(() => {
    if (!currentShopId) return;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, trial_ends_at, current_period_end, billing_cycle")
        .eq("shop_id", currentShopId)
        .maybeSingle();
      setSub(data as any);
      const shop = tenantShops.find((s) => s.id === currentShopId);
      setShopName(shop?.name || "");
    })();
  }, [currentShopId, tenantShops]);

  if (!sub || dismissed) return null;

  const now = Date.now();
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : 0;
  const periodEnd = new Date(sub.current_period_end).getTime();
  const isTrial = sub.status === "trial" && trialEnd > 0;
  const isExpired =
    sub.status === "expired" ||
    sub.status === "canceled" ||
    (isTrial && trialEnd < now) ||
    (sub.status === "active" && periodEnd < now);

  const daysLeft = isTrial ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : 0;

  // Show only when on trial OR expired
  if (!isTrial && !isExpired && sub.plan === "starter") return null;
  if (sub.status === "active" && !isExpired) return null;

  const upgrade = () =>
    openWhatsAppUpgrade({
      plan: sub.plan === "starter" ? "pro" : (sub.plan as any),
      cycle: (sub.billing_cycle as any) || "monthly",
      shopName,
    });

  if (isExpired) {
    return (
      <div className="relative rounded-2xl border border-destructive/40 bg-destructive/10 p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-destructive">انتهت تجربتك المجانية</p>
          <p className="text-xs text-muted-foreground">
            للاستمرار في استخدام النظام، اشترك في إحدى الباقات. الدفع عبر WhatsApp:{" "}
            <span dir="ltr" className="font-semibold">{PAYMENT_WHATSAPP_DISPLAY}</span>
          </p>
        </div>
        <button
          onClick={upgrade}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 h-10 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg"
        >
          <MessageCircle className="w-4 h-4" />
          اشترك الآن
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 mb-4 flex items-center gap-3 flex-wrap">
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-[200px]">
        <p className="font-bold text-foreground">
          أنت في فترة التجربة — متبقي <span className="text-primary">{daysLeft}</span> يوم
        </p>
        <p className="text-xs text-muted-foreground">
          رقّ باقتك للاستمرار بدون انقطاع. الدفع عبر WhatsApp:{" "}
          <span dir="ltr" className="font-semibold">{PAYMENT_WHATSAPP_DISPLAY}</span>
        </p>
      </div>
      <button
        onClick={upgrade}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 h-10 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg"
      >
        <MessageCircle className="w-4 h-4" />
        ترقية الباقة
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1.5 rounded-lg hover:bg-background/60 text-muted-foreground"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
