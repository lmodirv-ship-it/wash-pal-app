import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Star, Package } from "lucide-react";
import { toast } from "sonner";

interface PricingPlan {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  trial_days: number;
  max_branches: number;
  max_employees: number;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const empty = {
  code: "", name_ar: "", name_en: "", name_fr: "",
  monthly_price: 0, yearly_price: 0, currency: "MAD",
  trial_days: 14, max_branches: 1, max_employees: 5,
  featuresText: "", is_active: true, is_featured: false, sort_order: 0,
};

export default function AdminPricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PricingPlan | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("فشل تحميل الباقات");
    setPlans(((data as any[]) || []).map((p) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(empty); setEditing(null); setOpen(false); };

  const startEdit = (p: PricingPlan) => {
    setEditing(p);
    setForm({
      code: p.code, name_ar: p.name_ar, name_en: p.name_en, name_fr: p.name_fr,
      monthly_price: Number(p.monthly_price), yearly_price: Number(p.yearly_price),
      currency: p.currency, trial_days: p.trial_days,
      max_branches: p.max_branches, max_employees: p.max_employees,
      featuresText: (p.features || []).join("\n"),
      is_active: p.is_active, is_featured: p.is_featured, sort_order: p.sort_order,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code || !form.name_ar) { toast.error("الكود والاسم بالعربية مطلوبان"); return; }
    const features = form.featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = {
      code: form.code, name_ar: form.name_ar, name_en: form.name_en, name_fr: form.name_fr,
      monthly_price: Number(form.monthly_price), yearly_price: Number(form.yearly_price),
      currency: form.currency, trial_days: Number(form.trial_days),
      max_branches: Number(form.max_branches), max_employees: Number(form.max_employees),
      features, is_active: form.is_active, is_featured: form.is_featured, sort_order: Number(form.sort_order),
    };
    const { error } = editing
      ? await supabase.from("pricing_plans").update(payload).eq("id", editing.id)
      : await supabase.from("pricing_plans").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "تم تحديث الباقة" : "تمت إضافة الباقة");
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الباقة؟")) return;
    const { error } = await supabase.from("pricing_plans").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); load();
  };

  const toggle = async (p: PricingPlan, field: "is_active" | "is_featured") => {
    const update = field === "is_active" ? { is_active: !p.is_active } : { is_featured: !p.is_featured };
    const { error } = await supabase.from("pricing_plans").update(update).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة باقات الأسعار</h1>
          <p className="text-sm text-muted-foreground">باقات اشتراك المنصة المعروضة للزبائن</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="lavage-btn"><Plus className="w-4 h-4 mx-2" /> باقة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editing ? "تعديل الباقة" : "إضافة باقة جديدة"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pe-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">الكود (إنجليزي)</label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="starter" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">العملة</label>
                  <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">الاسم (AR)</label>
                  <Input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">الاسم (EN)</label>
                  <Input value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">الاسم (FR)</label>
                  <Input value={form.name_fr} onChange={(e) => setForm((f) => ({ ...f, name_fr: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">السعر الشهري</label>
                  <Input type="number" value={form.monthly_price} onChange={(e) => setForm((f) => ({ ...f, monthly_price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">السعر السنوي</label>
                  <Input type="number" value={form.yearly_price} onChange={(e) => setForm((f) => ({ ...f, yearly_price: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">أيام التجربة</label>
                  <Input type="number" value={form.trial_days} onChange={(e) => setForm((f) => ({ ...f, trial_days: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">حد الفروع</label>
                  <Input type="number" value={form.max_branches} onChange={(e) => setForm((f) => ({ ...f, max_branches: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">حد الموظفين</label>
                  <Input type="number" value={form.max_employees} onChange={(e) => setForm((f) => ({ ...f, max_employees: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الميزات (سطر لكل ميزة)</label>
                <Textarea rows={5} value={form.featuresText} onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))} placeholder="فرع واحد&#10;حتى 3 موظفين&#10;تقارير أساسية" />
              </div>
              <div className="grid grid-cols-3 gap-3 items-center">
                <div>
                  <label className="text-xs text-muted-foreground">الترتيب</label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} /> مفعّلة
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} /> مميّزة
                </label>
              </div>
              <Button className="w-full lavage-btn" onClick={save}>{editing ? "حفظ التعديلات" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">الكود</TableHead>
              <TableHead className="text-muted-foreground">الاسم</TableHead>
              <TableHead className="text-muted-foreground">الشهري</TableHead>
              <TableHead className="text-muted-foreground">السنوي</TableHead>
              <TableHead className="text-muted-foreground">التجربة</TableHead>
              <TableHead className="text-muted-foreground">الفروع</TableHead>
              <TableHead className="text-muted-foreground">الموظفون</TableHead>
              <TableHead className="text-muted-foreground">الحالة</TableHead>
              <TableHead className="text-muted-foreground">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                لا توجد باقات بعد
              </TableCell></TableRow>
            ) : plans.map((p) => (
              <TableRow key={p.id} className="lavage-table-row border-border">
                <TableCell className="font-mono text-xs text-foreground">{p.code}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {p.name_ar}
                    {p.is_featured && <Star className="w-3.5 h-3.5 text-warning fill-warning" />}
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{p.monthly_price} {p.currency}</TableCell>
                <TableCell className="text-foreground">{p.yearly_price} {p.currency}</TableCell>
                <TableCell className="text-foreground">{p.trial_days} يوم</TableCell>
                <TableCell className="text-foreground">{p.max_branches}</TableCell>
                <TableCell className="text-foreground">{p.max_employees}</TableCell>
                <TableCell>
                  <Badge className={p.is_active ? "bg-success text-success-foreground" : "bg-muted"} onClick={() => toggle(p, "is_active")} role="button">
                    {p.is_active ? "مفعّلة" : "معطّلة"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="lavage-glow"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
