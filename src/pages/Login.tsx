import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]" />
      
      <div className="relative z-10 w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
            <Car className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">لافاج</h1>
          <p className="text-gray-400">نظام إدارة محلات غسل السيارات</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 space-y-4 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold text-white text-center">
              {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </h2>
            
            {isSignUp && (
              <Input
                placeholder="الاسم الكامل"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 text-lg"
              />
            )}
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 text-lg"
              required
            />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 text-lg"
              required
              minLength={6}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-[1.02]"
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
          className="mt-6 w-full text-center text-gray-400 hover:text-yellow-400 transition-colors text-sm"
        >
          {isSignUp ? "لديك حساب؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
        </button>
      </div>
    </div>
  );
}
