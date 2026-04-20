import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Plus, Trash2, Edit, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

interface Template {
  id: string;
  shop_id: string;
  name: string;
  category: string;
  channel: string;
  subject: string | null;
  body: string;
  language: string;
  is_active: boolean;
}

const CATEGORIES = [
  { v: "welcome", l: "ترحيب" },
  { v: "reminder", l: "تذكير" },
  { v: "promo", l: "عرض ترويجي" },
  { v: "general", l: "عام" },
];
const CHANNELS = [
  { v: "whatsapp", l: "واتساب" },
  { v: "email", l: "إيميل" },
  { v: "sms", l: "SMS" },
];

export default function MessageTemplates() {
  const { currentShopId } = useApp();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", category: "general", channel: "whatsapp", subject: "", body: "", language: "ar" });

  const load = async () => {
    if (!currentShopId) return;
    setLoading(true);
    const { data } = await supabase.from("message_templates").select("*").eq("shop_id", currentShopId).order("created_at", { ascending: false });
    setTemplates((data || []) as Template[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentShopId]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", category: "general", channel: "whatsapp", subject: "", body: "", language: "ar" });
    setOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, category: t.category, channel: t.channel, subject: t.subject || "", body: t.body, language: t.language });
    setOpen(true);
  };

  const save = async () => {
    if (!currentShopId || !form.name || !form.body) { toast.error("الاسم والنص مطلوبان"); return; }
    if (editing) {
      const { error } = await supabase.from("message_templates").update(form).eq("id", editing.id);
      if (error) { toast.error("فشل الحفظ"); return; }
      toast.success("تم التحديث");
    } else {
      const { error } = await supabase.from("message_templates").insert({ ...form, shop_id: currentShopId });
      if (error) { toast.error("فشل الحفظ"); return; }
      toast.success("تمت الإضافة");
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا القالب؟")) return;
    await supabase.from("message_templates").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">📧 نماذج المراسلات</h1>
            <p className="text-sm text-muted-foreground">قوالب رسائل قابلة لإعادة الاستخدام لزبائنك وشركائك</p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />قالب جديد</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
          لم تُنشئ أي قالب بعد. ابدأ بقالب ترحيب أو تذكير.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map(t => (
            <Card key={t.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-[10px]">{CATEGORIES.find(c => c.v === t.category)?.l}</Badge>
                    <Badge variant="outline" className="text-[10px]">{CHANNELS.find(c => c.v === t.channel)?.l}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(t.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {t.subject && <p className="text-xs font-medium text-muted-foreground">الموضوع: {t.subject}</p>}
              <p className="text-sm whitespace-pre-wrap line-clamp-4 text-muted-foreground">{t.body}</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "تعديل قالب" : "قالب جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم القالب" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.channel === "email" && (
              <Input placeholder="موضوع الإيميل" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            )}
            <Textarea placeholder="نص الرسالة... استخدم {name} لاسم الزبون" rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
            <Button onClick={save} className="w-full">{editing ? "حفظ التعديلات" : "إضافة"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
