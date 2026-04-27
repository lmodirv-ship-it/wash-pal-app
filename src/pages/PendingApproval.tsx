import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, LogOut, RefreshCw } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Req = {
  id: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  shop_id: string;
  created_at: string;
};

export default function PendingApproval() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [req, setReq] = useState<Req | null>(null);
  const [fetching, setFetching] = useState(true);

  const loadLatest = async () => {
    if (!user) return;
    setFetching(true);
    const { data } = await supabase
      .from("employee_join_requests")
      .select("id,status,rejection_reason,shop_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setReq((data?.[0] as any) ?? null);
    setFetching(false);
  };

  useEffect(() => { if (user) loadLatest(); }, [user]);

  // Auto-redirect if approved
  useEffect(() => {
    if (req?.status === "approved") {
      toast.success("تمت الموافقة على طلبك. مرحباً بك!");
      const t = setTimeout(() => navigate("/employee", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [req?.status, navigate]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const statusVisual = (() => {
    if (!req) return { icon: Clock, color: "text-muted-foreground", title: "لا يوجد طلب", body: "لم تقدم طلب انضمام بعد." };
    if (req.status === "pending") return { icon: Clock, color: "text-amber-400", title: "طلبك قيد المراجعة", body: "سيتم إعلامك فور موافقة المسؤول." };
    if (req.status === "approved") return { icon: CheckCircle2, color: "text-emerald-400", title: "تمت الموافقة", body: "جارٍ تحويلك إلى لوحة الموظف..." };
    return { icon: XCircle, color: "text-red-400", title: "تم رفض الطلب", body: req.rejection_reason || "تواصل مع المسؤول لمزيد من التفاصيل." };
  })();

  const Icon = statusVisual.icon;

  return (
    <div className="min-h-screen bg-[#030308] flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl p-8 text-center space-y-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <div className={`mx-auto w-20 h-20 rounded-full bg-white/5 flex items-center justify-center ${statusVisual.color}`}>
          <Icon className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{statusVisual.title}</h1>
        <p className="text-sm text-muted-foreground">{statusVisual.body}</p>

        {req?.status === "rejected" && (
          <Button onClick={() => navigate("/join-shop")} className="w-full">
            تقديم طلب جديد
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={loadLatest} disabled={fetching}>
            <RefreshCw className={`w-4 h-4 ml-2 ${fetching ? "animate-spin" : ""}`} />
            تحديث الحالة
          </Button>
          <Button variant="outline" className="flex-1" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="w-4 h-4 ml-2" />
            خروج
          </Button>
        </div>
      </div>
    </div>
  );
}