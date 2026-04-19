// Central place for the platform's payment WhatsApp number.
// Used wherever the user needs to upgrade / pay for a plan.

export const PAYMENT_WHATSAPP = "212668546358"; // intl format, no '+'
export const PAYMENT_WHATSAPP_DISPLAY = "0668546358";

export type PlanId = "starter" | "pro" | "business" | "enterprise";
export type Cycle = "monthly" | "yearly";

const PLAN_LABELS: Record<PlanId, string> = {
  starter: "Starter (بداية)",
  pro: "Pro (احترافي)",
  business: "Business (متقدم)",
  enterprise: "Enterprise (شركات)",
};

export function buildUpgradeMessage(opts: {
  plan: PlanId;
  cycle?: Cycle;
  shopName?: string;
  ownerName?: string;
}) {
  const lines = [
    "السلام عليكم 👋",
    `أرغب في الاشتراك في باقة *${PLAN_LABELS[opts.plan]}*` +
      (opts.cycle ? ` (${opts.cycle === "yearly" ? "سنوي" : "شهري"})` : ""),
  ];
  if (opts.shopName) lines.push(`اسم المحل: ${opts.shopName}`);
  if (opts.ownerName) lines.push(`الاسم: ${opts.ownerName}`);
  lines.push("\nمن منصة H&Lavage");
  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${PAYMENT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppUpgrade(opts: {
  plan: PlanId;
  cycle?: Cycle;
  shopName?: string;
  ownerName?: string;
}) {
  const url = buildWhatsAppUrl(buildUpgradeMessage(opts));
  window.open(url, "_blank", "noopener,noreferrer");
}
