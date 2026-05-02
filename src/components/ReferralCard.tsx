import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Copy, Check, Loader2, Users, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function ReferralCard() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{ uses: number; signups: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_or_create_my_referral_code");
      if (!cancelled && !error && data) {
        setCode(data as string);
        const { data: row } = await supabase
          .from("referral_codes")
          .select("uses_count, signups_count")
          .eq("user_id", user.id)
          .maybeSingle();
        if (row) setStats({ uses: row.uses_count, signups: row.signups_count });
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const link = code ? `${window.location.origin}/?ref=${code}` : "";

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(isAr ? "تم نسخ رابط الإحالة ✓" : "Referral link copied ✓");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isAr ? "تعذر النسخ" : "Copy failed");
    }
  };

  const handleShare = async () => {
    if (!link) return;
    const text = isAr
      ? `جرّب CarwashPro لإدارة مغسلتك بسهولة! استخدم رابطي: ${link}`
      : `Try CarwashPro to manage your car wash easily! Use my link: ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: "CarwashPro", text, url: link }); } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a2a]/60 to-[#12122e]/60 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {isAr ? "ادعُ صديقاً" : "Refer a friend"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "شارك رابطك الخاص واحصل على مكافآت" : "Share your unique link and earn rewards"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <input
              readOnly
              value={link}
              className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-foreground text-sm font-mono"
            />
            <button
              onClick={handleCopy}
              className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-colors"
              aria-label="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleShare}
              className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-sm font-bold hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-shadow"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  {isAr ? "النقرات" : "Clicks"}
                </div>
                <div className="text-xl font-bold text-foreground tabular-nums">{stats.uses}</div>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Users className="w-3.5 h-3.5" />
                  {isAr ? "تسجيلات" : "Signups"}
                </div>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">{stats.signups}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}