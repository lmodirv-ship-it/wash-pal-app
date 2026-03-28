import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-car-wash.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("يرجى إدخال البريد الإلكتروني"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("تم إرسال رابط استعادة كلمة المرور");
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
              <Mail className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">استعادة كلمة المرور</h1>
            <p className="text-muted-foreground">أدخل بريدك الإلكتروني لإرسال رابط الاستعادة</p>
          </div>

          {sent ? (
            <div className="lavage-card p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">تم الإرسال!</h2>
              <p className="text-muted-foreground">تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور.</p>
              <Link to="/login">
                <Button variant="outline" className="mt-4 lavage-btn">
                  <ArrowRight className="w-4 h-4 ml-2" />العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="lavage-card p-6 space-y-4">
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                  required
                />
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold lavage-btn">
                  {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                </Button>
              </div>
            </form>
          )}

          <Link to="/login" className="mt-6 block text-center text-muted-foreground hover:text-primary transition-colors text-sm">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
