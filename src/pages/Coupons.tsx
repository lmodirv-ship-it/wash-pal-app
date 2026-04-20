import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ticket, Plus, Trash2, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

interface Coupon {
  id: string;
  shop_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

export default function Coupons() {
  const { currentShopId } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: 10, max_uses: "", expires_at: "", notes: "" });

  const load = async () => {
    if (!currentShopId) return;
    setLoading(true);
    const { data } = await supabase.from("discount_coupons").select("*").eq("shop_id", currentShopId).order("created_at", { ascending: false });
    setCoupons((data || []) as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentShopId]);

  const generateCode = () => {
    const code = "PROMO" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm(f => ({ ...f, code }));
  };

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", discount_type: "percentage", discount_value: 10, max_uses: "", expires_at: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_uses: c.max_uses?.toString() || "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      notes: c.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!currentShopId || !form.code) { toast.error("الكود مطلوب"); return; }
    const payload: any = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from("discount_coupons").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("تم التحديث");
    } else {
      const { error } = await supabase.from("discount_coupons").insert({ ...payload, shop_id: currentShopId });
      if (error) { toast.error(error.message); return; }
      toast.success("تم الإنشاء");
    }
    setOpen(false);
    load();
  };

  const toggle = async (c: Coupon) => {
    await supabase.from("discount_coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الكوبون؟")) return;
    await supabase.from("discount_coupons").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">🎟️ كوبونات الخصم</h1>
            <p className="text-sm text-muted-foreground">أنشئ أكواد ترويجية لزبائنك</p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />كوبون جديد</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : coupons.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-2 opacity-30" />
          لم تُنشئ أي كوبون بعد.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {coupons.map(c => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const exhausted = c.max_uses && c.used_count >= c.max_uses;
            return (
              <Card key={c.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <button onClick={() => copyCode(c.code)} className="font-mono text-lg font-bold text-primary hover:underline flex items-center gap-1">
                      {c.code} <Copy className="w-3 h-3" />
                    </button>
                    <p className="text-2xl font-bold mt-1">
                      {c.discount_value}{c.discount_type === "percentage" ? "%" : " د.م"}
                    </p>
                  </div>
                  <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {expired && <Badge variant="destructive" className="text-[10px]">منتهي</Badge>}
                  {exhausted && <Badge variant="destructive" className="text-[10px]">نفد</Badge>}
                  {!c.is_active && <Badge variant="secondary" className="text-[10px]">معطل</Badge>}
                  {c.max_uses && <Badge variant="outline" className="text-[10px]">{c.used_count}/{c.max_uses}</Badge>}
                  {c.expires_at && <Badge variant="outline" className="text-[10px]">ينتهي {new Date(c.expires_at).toLocaleDateString("ar")}</Badge>}
                </div>
                {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                <div className="flex gap-1 justify-end pt-2 border-t border-border">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "تعديل كوبون" : "كوبون جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="الكود (مثل PROMO20)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              <Button type="button" variant="outline" onClick={generateCode}>توليد</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة %</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت د.م</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="القيمة" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} />
            </div>
            <Input type="number" placeholder="الحد الأقصى للاستخدام (اختياري)" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} />
            <Input type="date" placeholder="تاريخ الانتهاء" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
            <Input placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <Button onClick={save} className="w-full">{editing ? "حفظ" : "إنشاء"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
