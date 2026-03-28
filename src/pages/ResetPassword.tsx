import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-car-wash.jpg";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    } else {
      // Also check if user has an active session from recovery flow
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setValid(true);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("كلمات المرور غير متطابقة"); return; }
    if (password.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم تغيير كلمة المرور بنجاح!");
      setTimeout(() => navigate("/login"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroImage} alt="H&Lavage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-background/90 via-background/40 to-transparent" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="relative z-10 w-full max-w-md p-8">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">إعادة تعيين كلمة المرور</h1>
            <p className="text-muted-foreground">أدخل كلمة المرور الجديدة</p>
          </div>

          {!valid ? (
            <div className="lavage-card p-6 text-center space-y-4">
              <p className="text-destructive font-bold">رابط غير صالح أو منتهي الصلاحية</p>
              <p className="text-muted-foreground text-sm">يرجى طلب رابط استعادة جديد</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="lavage-card p-6 space-y-4">
                <Input
                  type="password"
                  placeholder="كلمة المرور الجديدة"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                  required
                  minLength={6}
                />
                <Input
                  type="password"
                  placeholder="تأكيد كلمة المرور"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                  required
                  minLength={6}
                />
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold lavage-btn">
                  {loading ? "جاري التحديث..." : (
                    <><ShieldCheck className="w-5 h-5 ml-2" />تحديث كلمة المرور</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
