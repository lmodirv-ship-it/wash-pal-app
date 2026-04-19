import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, MailQuestion } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase.from("invites").select("email,role,status,shop_id").eq("token", token).maybeSingle();
      setInvite(data);
      setLoading(false);
    })();
  }, [token]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#030308]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    // Save token and redirect to login
    sessionStorage.setItem("pending_invite_token", token || "");
    return <Navigate to={`/login?invite=${token}`} replace />;
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030308] p-6" dir="rtl">
        <div className="max-w-md w-full rounded-2xl border border-white/8 bg-[#060612]/80 p-8 text-center space-y-4">
          <MailQuestion className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold">دعوة غير صالحة</h1>
          <p className="text-sm text-muted-foreground">الرابط منتهي الصلاحية أو غير موجود.</p>
          <Button onClick={() => navigate("/")} className="w-full">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { error } = await supabase.rpc("accept_invite", { _token: token! });
      if (error) throw error;
      toast.success("تم قبول الدعوة 🎉");
      navigate("/post-login", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "تعذّر قبول الدعوة");
    }
    setAccepting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308] p-6" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.08)_0%,transparent_60%)]" />
      <div className="relative max-w-md w-full rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Check className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">دعوة للانضمام</h1>
        <p className="text-sm text-muted-foreground">
          تم دعوتك للانضمام كـ <span className="font-bold text-primary">{invite.role === "manager" ? "مدير" : "موظف"}</span>
        </p>
        {invite.status !== "pending" && (
          <p className="text-xs text-amber-500">هذه الدعوة تم استخدامها مسبقاً.</p>
        )}
        <Button onClick={handleAccept} disabled={accepting || invite.status !== "pending"} className="w-full h-12 font-bold bg-gradient-to-r from-primary/80 to-primary text-primary-foreground">
          {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : "قبول الدعوة"}
        </Button>
      </div>
    </div>
  );
}
