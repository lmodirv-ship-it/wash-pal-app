import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Camera, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { signIn, user, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); }, [stream]);

  if (!authLoading && user) return <Navigate to="/post-login" replace />;

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null); setShowCamera(false);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current; const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleCameraVerify = async () => {
    setVerifying(true);
    const photo = capturePhoto();
    if (!photo) { toast.error(t("auth.captureError")); setVerifying(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke("admin-camera-auth", {
        body: { email: form.email, face_image: photo, action: "verify" },
      });
      if (error) throw error;
      if (data?.error || data?.verified === false) {
        toast.error(t("auth.faceMismatch"), { duration: 5000 });
        stopCamera(); await supabase.auth.signOut(); return;
      }
      toast.success(t("auth.verifySuccess"));
      stopCamera();
    } catch (err: any) {
      toast.error(err?.message || t("auth.verifyError"));
      stopCamera(); await supabase.auth.signOut();
    }
    setVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await signIn(form.email, form.password);
    if (error) { toast.error(error); setLoading(false); return; }
    toast.success("مرحباً بعودتك 👋"); setLoading(false);
  };

  const isRtl = i18n.language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-4 end-4 z-20"><LanguageSwitcher /></div>
      <div className="absolute inset-0 bg-[#030308]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.05)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-[0_0_50px_hsl(var(--primary)/0.4)]">
            <span className="text-3xl font-black text-primary-foreground">H&L</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">H&Lavage</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.systemTitle")}</p>
        </div>

        {showCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="relative max-w-lg w-full mx-4 p-6 rounded-2xl bg-[#060612] border border-primary/20 space-y-4 shadow-[0_0_60px_rgba(250,204,21,0.1)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  {t("auth.adminVerify")}
                </h3>
                <button onClick={() => { stopCamera(); supabase.auth.signOut(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("auth.lookCamera")}</p>
              <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" style={{ transform: "scaleX(-1)" }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-52 border-2 border-primary/40 rounded-[50%] animate-pulse" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button onClick={handleCameraVerify} disabled={verifying} className="w-full h-12 font-bold bg-gradient-to-r from-primary/80 to-primary text-primary-foreground hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-all duration-300">
                {verifying ? t("auth.verifying") : (<><Camera className="w-5 h-5 mx-2" />{t("auth.verifyAndLogin")}</>)}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-foreground text-center">{t("auth.login")}</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t("common.email")}</label>
              <Input type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t("auth.password")}</label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all" required minLength={6} />
            </div>

            <Link to="/forgot-password" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("auth.forgotPassword")}
            </Link>

            <Button type="submit" disabled={loading} className="w-full h-12 font-bold text-base relative overflow-hidden group bg-gradient-to-r from-[#0a0a2a] to-[#12122e] border border-white/10 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(250,204,21,0.12)] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative text-foreground group-hover:text-primary transition-colors duration-300">
                {loading ? t("auth.loggingIn") : (
                  <span className="flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />{t("auth.enter")}</span>
                )}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
