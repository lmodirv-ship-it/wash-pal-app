import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Search, Inbox, Copy } from "lucide-react";

type Req = {
  id: string;
  shop_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

export default function JoinRequests() {
  const { currentShop } = useApp();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<Req | null>(null);
  const [reason, setReason] = useState("");
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employee_join_requests")
      .select("id,shop_id,user_id,full_name,email,phone,status,rejection_reason,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentShop?.id]);

  // Load shop reference code for sharing
  useEffect(() => {
    if (!currentShop?.id) { setReferenceCode(null); return; }
    (async () => {
      const { data } = await supabase.from("shops").select("reference_code").eq("id", currentShop.id).maybeSingle();
      setReferenceCode((data as any)?.reference_code ?? null);
    })();
  }, [currentShop?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((r) => r.status === tab)
      .filter((r) => !q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.phone || "").includes(q));
  }, [items, tab, search]);

  const counts = useMemo(() => ({
    pending: items.filter((r) => r.status === "pending").length,
    approved: items.filter((r) => r.status === "approved").length,
    rejected: items.filter((r) => r.status === "rejected").length,
  }), [items]);

  const approve = async (req: Req) => {
    const { error } = await supabase.rpc("approve_join_request", { _request_id: req.id });
    if (error) return toast.error(error.message);
    toast.success(`تم قبول ${req.full_name}`);
    load();
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const { error } = await supabase.rpc("reject_join_request", { _request_id: rejectTarget.id, _reason: reason });
    if (error) return toast.error(error.message);
    toast.success("تم رفض الطلب");
    setRejectTarget(null);
    setReason("");
    load();
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">طلبات انضمام الموظفين</h1>
          <p className="text-sm text-muted-foreground mt-1">راجع وأقبل/ارفض طلبات الانضمام لمتجرك</p>
        </div>
        {referenceCode && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
            <div>
              <div className="text-xs text-muted-foreground">رقم تعريف المحل</div>
              <div className="text-lg font-mono font-bold text-primary tracking-wider">{referenceCode}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(referenceCode); toast.success("تم النسخ"); }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="pr-10" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">قيد المراجعة <Badge variant="secondary" className="mr-2">{counts.pending}</Badge></TabsTrigger>
          <TabsTrigger value="approved">مقبول <Badge variant="secondary" className="mr-2">{counts.approved}</Badge></TabsTrigger>
          <TabsTrigger value="rejected">مرفوض <Badge variant="secondary" className="mr-2">{counts.rejected}</Badge></TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as const).map((s) => (
          <TabsContent key={s} value={s}>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
                <Inbox className="w-12 h-12 opacity-40" />
                <span>لا توجد طلبات</span>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-right p-3">الاسم</th>
                      <th className="text-right p-3">البريد</th>
                      <th className="text-right p-3">الهاتف</th>
                      <th className="text-right p-3">التاريخ</th>
                      <th className="text-right p-3">الحالة</th>
                      <th className="text-right p-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3 font-medium text-foreground">{r.full_name}</td>
                        <td className="p-3">{r.email}</td>
                        <td className="p-3">{r.phone || "—"}</td>
                        <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString("ar")}</td>
                        <td className="p-3">
                          {r.status === "pending" && <Badge variant="secondary">قيد المراجعة</Badge>}
                          {r.status === "approved" && <Badge className="bg-emerald-600 hover:bg-emerald-600">مقبول</Badge>}
                          {r.status === "rejected" && (
                            <div className="space-y-1">
                              <Badge variant="destructive">مرفوض</Badge>
                              {r.rejection_reason && <div className="text-xs text-muted-foreground max-w-xs truncate">{r.rejection_reason}</div>}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {r.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approve(r)} className="bg-emerald-600 hover:bg-emerald-700">
                                <Check className="w-4 h-4 ml-1" /> قبول
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setRejectTarget(r)}>
                                <X className="w-4 h-4 ml-1" /> رفض
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض طلب انضمام</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">رفض طلب: <span className="font-semibold">{rejectTarget?.full_name}</span></p>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض (اختياري)" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmReject}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}