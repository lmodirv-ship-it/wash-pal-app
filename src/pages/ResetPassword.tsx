import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setValid(true);
    else supabase.auth.getSession().then(({ data: { session } }) => { if (session) setValid(true); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(t("auth.passwordsDontMatch")); return; }
    if (password.length < 6) { toast.error(t("auth.passwordTooShort")); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success(t("auth.passwordChanged")); setTimeout(() => navigate("/login"), 2000); }
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
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("auth.resetTitle")}</h1>
            <p className="text-muted-foreground">{t("auth.resetSub")}</p>
          </div>

          {!valid ? (
            <div className="lavage-card p-6 text-center space-y-4">
              <p className="text-destructive font-bold">{t("auth.invalidLink")}</p>
              <p className="text-muted-foreground text-sm">{t("auth.requestNewLink")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="lavage-card p-6 space-y-4">
                <Input type="password" placeholder={t("auth.newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg" required minLength={6} />
                <Input type="password" placeholder={t("auth.confirmPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg" required minLength={6} />
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold lavage-btn">
                  {loading ? t("auth.updating") : (<><ShieldCheck className="w-5 h-5 mx-2" />{t("auth.updatePassword")}</>)}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
