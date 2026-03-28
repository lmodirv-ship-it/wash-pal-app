import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-car-wash.jpg";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      if (!form.name) { toast.error("يرجى إدخال الاسم"); setLoading(false); return; }
      const { error } = await signUp(form.email, form.password, form.name);
      if (error) toast.error(error); else toast.success("تم إنشاء الحساب بنجاح");
    } else {
      const { error } = await signIn(form.email, form.password);
      if (error) toast.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Right side - Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroImage} alt="H&Lavage Car Wash" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-l from-background/90 via-background/40 to-transparent" />
        <div className="absolute bottom-10 right-10 z-10">
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">H&Lavage</h2>
          <p className="text-lg text-white/80 mt-2 drop-shadow">نظام إدارة محلات غسل السيارات الأكثر تطوراً</p>
        </div>
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        
        <div className="relative z-10 w-full max-w-md p-8">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
              <span className="text-3xl font-black text-primary-foreground">H&L</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">H&Lavage</h1>
            <p className="text-muted-foreground">نظام إدارة محلات غسل السيارات</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="lavage-card p-6 space-y-4">
              <h2 className="text-xl font-bold text-foreground text-center">
                {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
              </h2>
              
              {isSignUp && (
                <Input
                  placeholder="الاسم الكامل"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                />
              )}
              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                required
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                required
                minLength={6}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-bold lavage-btn"
              >
                {loading ? "جاري..." : isSignUp ? (
                  <><UserPlus className="w-5 h-5 ml-2" />إنشاء حساب</>
                ) : (
                  <><LogIn className="w-5 h-5 ml-2" />دخول</>
                )}
              </Button>
            </div>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-6 w-full text-center text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            {isSignUp ? "لديك حساب؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
          </button>
        </div>
      </div>
    </div>
  );
}
