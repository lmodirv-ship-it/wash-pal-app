import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Copy, Trash2, Loader2, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { name: string } | null;
  email?: string | null;
}
interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  created_at: string;
}

export default function Team() {
  const { currentShopId, tenantShops } = useApp();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", role: "employee" });
  const [submitting, setSubmitting] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);

  const currentShop = tenantShops.find((s) => s.id === currentShopId);
  const isOwner = currentShop?.ownerId === user?.id;
  const canInvite = isOwner || myRole === "supervisor" || myRole === "manager";

  const load = async () => {
    if (!currentShopId) return;
    setLoading(true);
    const [mRes, iRes, meRes] = await Promise.all([
      supabase.from("shop_members").select("id,user_id,role,created_at").eq("shop_id", currentShopId),
      supabase.from("invites").select("id,email,role,token,status,created_at").eq("shop_id", currentShopId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("shop_members").select("role").eq("shop_id", currentShopId).eq("user_id", user?.id || "").maybeSingle(),
    ]);
    const ms = mRes.data || [];
    // Fetch profiles for member display
    const ids = ms.map((m: any) => m.user_id);
    let profiles: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("user_id,name").in("user_id", ids);
      profiles = data || [];
    }
    setMembers(ms.map((m: any) => ({ ...m, profile: profiles.find((p) => p.user_id === m.user_id) || null })));
    setInvites(iRes.data || []);
    setMyRole((meRes.data as any)?.role || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentShopId]);

  const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId || !user) return;
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) { toast.error("بريد غير صالح"); return; }

    setSubmitting(true);
    try {
      // Check if user already exists by querying profiles join (best-effort via RPC not available);
      // We always create an invite row; trigger handles auto-link if user signs up.
      const { data, error } = await supabase
        .from("invites")
        .insert({ email, shop_id: currentShopId, role: form.role, invited_by: user.id })
        .select("token")
        .single();
      if (error) throw error;

      // Try copying the link
      try {
        await navigator.clipboard.writeText(inviteLink(data.token));
        toast.success("تم إنشاء الدعوة ونسخ الرابط ✨");
      } catch {
        toast.success("تم إنشاء الدعوة");
      }
      setForm({ email: "", role: "employee" });
      await load();
    } catch (err: any) {
      toast.error(err?.message || "تعذّر إنشاء الدعوة");
    }
    setSubmitting(false);
  };

  const revokeInvite = async (id: string) => {
    await supabase.from("invites").delete().eq("id", id);
    toast.success("تم حذف الدعوة");
    load();
  };

  const removeMember = async (id: string, userId: string) => {
    if (userId === currentShop?.ownerId) { toast.error("لا يمكن إزالة المالك"); return; }
    if (!confirm("إزالة هذا العضو من المتجر؟")) return;
    await supabase.from("shop_members").delete().eq("id", id);
    toast.success("تمت الإزالة");
    load();
  };

  const copyLink = async (token: string) => {
    try { await navigator.clipboard.writeText(inviteLink(token)); toast.success("تم النسخ"); }
    catch { toast.error("تعذّر النسخ"); }
  };

  if (!currentShopId) {
    return <div className="p-8 text-center text-muted-foreground">اختر متجراً أولاً</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">فريق العمل</h1>
          <p className="text-sm text-muted-foreground">{currentShop?.name}</p>
        </div>
      </div>

      {canInvite && (
        <form onSubmit={handleInvite} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="font-bold">دعوة عضو جديد</h2>
          </div>
          <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="employee@email.com" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">الدور</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full md:w-auto h-10 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                إرسال الدعوة
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">سيُنسخ رابط الدعوة تلقائياً. شاركه مع الشخص لينضم بعد التسجيل.</p>
        </form>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold">دعوات معلقة ({invites.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {invites.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">{inv.role === "manager" ? "مدير" : "موظف"} • {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)} className="gap-2"><Copy className="w-3.5 h-3.5" />نسخ الرابط</Button>
                  <Button size="sm" variant="ghost" onClick={() => revokeInvite(inv.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold">الأعضاء ({members.length})</h3>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                    {(m.profile?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.profile?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">انضم {new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.user_id === currentShop?.ownerId ? "default" : "secondary"}>
                    {m.user_id === currentShop?.ownerId ? "المالك" : m.role === "supervisor" ? "مشرف" : m.role === "manager" ? "مدير" : "موظف"}
                  </Badge>
                  {canInvite && m.user_id !== currentShop?.ownerId && m.user_id !== user?.id && (
                    <Button size="sm" variant="ghost" onClick={() => removeMember(m.id, m.user_id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
