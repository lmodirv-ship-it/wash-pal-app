import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, UserPlus, Camera, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"register" | "verify" | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [showAdminInput, setShowAdminInput] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      toast.error("لا يمكن الوصول إلى الكاميرا");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setShowCamera(false);
    setCameraMode(null);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleAdminCheck = async () => {
    if (!adminEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-camera-auth", {
        body: { email: adminEmail, action: "check" },
      });
      if (error) throw error;
      if (data?.isAdmin) {
        setCameraMode(data.hasPhoto ? "verify" : "register");
        setShowCamera(true);
        setTimeout(startCamera, 100);
      } else {
        toast.error("هذا البريد ليس حساب مدير");
      }
    } catch (err: any) {
      toast.error(err?.message || "خطأ في التحقق");
    }
    setLoading(false);
  };

  const handleCameraAuth = async () => {
    setCapturing(true);
    const photo = capturePhoto();
    if (!photo) {
      toast.error("فشل التقاط الصورة");
      setCapturing(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-camera-auth", {
        body: {
          email: adminEmail,
          face_image: photo,
          action: cameraMode === "register" ? "register" : "verify"
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        if (data.verified === false) {
          toast.error("⚠️ تم حفظ صورة المتسلل", { duration: 5000 });
          stopCamera();
        }
        setCapturing(false);
        return;
      }

      if (data?.action_link) {
        const url = new URL(data.action_link);
        const token = url.searchParams.get("token") || data.token;
        if (token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email: adminEmail,
            token: token,
            type: "magiclink",
          });
          if (verifyError) {
            toast.error("خطأ في تسجيل الدخول: " + verifyError.message);
            setCapturing(false);
            return;
          }
        }
      }

      toast.success(cameraMode === "register"
        ? "تم تسجيل الوجه وتسجيل الدخول بنجاح!"
        : "تم التحقق بنجاح! مرحباً بك يا مدير");
      stopCamera();
    } catch (err: any) {
      toast.error(err?.message || "خطأ في المصادقة");
    }
    setCapturing(false);
  };

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[#030308]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.05)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-[0_0_50px_hsl(var(--primary)/0.4)]">
            <span className="text-3xl font-black text-primary-foreground">H&L</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">H&Lavage</h1>
          <p className="text-sm text-muted-foreground mt-1">نظام إدارة محلات غسل السيارات</p>
        </div>

        {/* Admin Camera Button - Top */}
        <button
          onClick={() => setShowAdminInput(!showAdminInput)}
          className="w-full mb-4 group relative overflow-hidden rounded-xl py-3 px-5 font-bold text-base transition-all duration-500
            bg-gradient-to-r from-[#0a0a1a] to-[#0d0d2a] border border-primary/20
            hover:border-primary/60 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center gap-2 text-primary/80 group-hover:text-primary transition-colors">
            <Camera className="w-5 h-5" />
            <span>دخول المدير بالكاميرا</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
        </button>

        {/* Admin email input */}
        {showAdminInput && (
          <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-[#060612] space-y-3 animate-fade-in">
            <Input
              type="email"
              placeholder="البريد الإلكتروني للمدير"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="bg-[#0a0a1e] border-primary/20 text-foreground h-11 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(250,204,21,0.1)]"
            />
            <Button
              onClick={handleAdminCheck}
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary/80 to-primary text-primary-foreground font-bold
                hover:shadow-[0_0_25px_rgba(250,204,21,0.3)] transition-all duration-300"
            >
              {loading ? "جاري التحقق..." : "فتح الكاميرا والتحقق"}
            </Button>
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="relative max-w-lg w-full mx-4 p-6 rounded-2xl bg-[#060612] border border-primary/20 space-y-4
              shadow-[0_0_60px_rgba(250,204,21,0.1)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  {cameraMode === "register" ? "تسجيل وجه المدير" : "التحقق من الهوية"}
                </h3>
                <button onClick={stopCamera} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {cameraMode === "register"
                  ? "التقط صورة وجهك لتسجيلها كمرجع للدخول المستقبلي"
                  : "انظر إلى الكاميرا للتحقق من هويتك"}
              </p>

              <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-black">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full aspect-video object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-52 border-2 border-primary/40 rounded-[50%] animate-pulse" />
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <Button
                onClick={handleCameraAuth}
                disabled={capturing}
                className="w-full h-12 font-bold bg-gradient-to-r from-primary/80 to-primary text-primary-foreground
                  hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-all duration-300"
              >
                {capturing ? "جاري التحقق..." : (
                  <>
                    <Camera className="w-5 h-5 ml-2" />
                    {cameraMode === "register" ? "تسجيل الوجه والدخول" : "التحقق والدخول"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Employee Login Form - Table style with border */}
        <div className="rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl overflow-hidden
          shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-foreground text-center">
              {isSignUp ? "إنشاء حساب جديد" : "تسجيل دخول الموظف"}
            </h2>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">الاسم الكامل</label>
                <Input
                  placeholder="أدخل اسمك"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">كلمة المرور</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all"
                required
                minLength={6}
              />
            </div>

            {!isSignUp && (
              <Link to="/forgot-password" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                نسيت كلمة المرور؟
              </Link>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-bold text-base relative overflow-hidden group
                bg-gradient-to-r from-[#0a0a2a] to-[#12122e] border border-white/10
                hover:border-primary/40 hover:shadow-[0_0_25px_rgba(250,204,21,0.12)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative text-foreground group-hover:text-primary transition-colors duration-300">
                {loading ? "جاري..." : (
                  isSignUp ? (
                    <span className="flex items-center justify-center gap-2"><UserPlus className="w-5 h-5" />إنشاء حساب</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />دخول</span>
                  )
                )}
              </span>
            </Button>
          </form>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01]">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              {isSignUp ? "لديك حساب؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
