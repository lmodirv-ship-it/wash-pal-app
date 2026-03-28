import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, UserPlus, Camera, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-car-wash.jpg";

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

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("لا يمكن الوصول إلى الكاميرا");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
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

  // Check if email belongs to admin
  const handleAdminCheck = async () => {
    if (!form.email) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-camera-auth", {
        body: { email: form.email, action: "check" },
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

  // Capture and send face for verification/registration
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
          email: form.email, 
          face_image: photo, 
          action: cameraMode === "register" ? "register" : "verify" 
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        if (data.verified === false) {
          stopCamera();
        }
        setCapturing(false);
        return;
      }

      // If we got an action_link, use it to verify the OTP
      if (data?.action_link) {
        // Extract token from action link
        const url = new URL(data.action_link);
        const token = url.searchParams.get("token") || data.token;
        
        if (token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email: form.email,
            token: token,
            type: "magiclink",
          });
          
          if (verifyError) {
            // Fallback: try hashed token
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

          {/* Camera Modal */}
          {showCamera && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="lavage-card p-6 max-w-lg w-full mx-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    {cameraMode === "register" ? "تسجيل وجه المدير" : "التحقق من الهوية"}
                  </h3>
                  <button onClick={stopCamera} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {cameraMode === "register" 
                    ? "التقط صورة وجهك لتسجيلها كمرجع للدخول المستقبلي" 
                    : "انظر إلى الكاميرا للتحقق من هويتك"}
                </p>

                <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-black">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full aspect-video object-cover mirror"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-60 border-2 border-primary/50 rounded-[50%] animate-pulse" />
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <Button 
                  onClick={handleCameraAuth} 
                  disabled={capturing}
                  className="w-full h-12 text-lg font-bold lavage-btn"
                >
                  {capturing ? (
                    "جاري التحقق..."
                  ) : (
                    <>
                      <Camera className="w-5 h-5 ml-2" />
                      {cameraMode === "register" ? "تسجيل الوجه والدخول" : "التحقق والدخول"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

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
              
              {!isSignUp && (
                <>
                  <Input
                    type="password"
                    placeholder="كلمة المرور"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
                    minLength={6}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 text-sm font-bold lavage-btn"
                    >
                      {loading ? "جاري..." : (
                        <><LogIn className="w-4 h-4 ml-1" />دخول الموظف</>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleAdminCheck}
                      disabled={loading}
                      className="h-12 text-sm font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {loading ? "جاري..." : (
                        <><Camera className="w-4 h-4 ml-1" />دخول المدير</>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {isSignUp && (
                <>
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
                    {loading ? "جاري..." : (
                      <><UserPlus className="w-5 h-5 ml-2" />إنشاء حساب</>
                    )}
                  </Button>
                </>
              )}
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
