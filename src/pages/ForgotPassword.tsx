import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error(t("auth.enterEmail")); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else { setSent(true); toast.success(t("auth.resetSent")); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="absolute top-4 end-4 z-20"><LanguageSwitcher /></div>
      <div className="flex-1 flex items-center justify-center bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="relative z-10 w-full max-w-md p-8">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
              <Mail className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("auth.forgotTitle")}</h1>
            <p className="text-muted-foreground">{t("auth.forgotSub")}</p>
          </div>

          {sent ? (
            <div className="lavage-card p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t("auth.sent")}</h2>
              <p className="text-muted-foreground">{t("auth.checkEmail")}</p>
              <Link to="/login">
                <Button variant="outline" className="mt-4 lavage-btn">
                  <ArrowRight className="w-4 h-4 mx-2" />{t("auth.backToLogin")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="lavage-card p-6 space-y-4">
                <Input type="email" placeholder={t("common.email")} value={email} onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg" required />
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold lavage-btn">
                  {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </Button>
              </div>
            </form>
          )}

          <Link to="/login" className="mt-6 block text-center text-muted-foreground hover:text-primary transition-colors text-sm">
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
