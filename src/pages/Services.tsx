import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Droplets, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Services() {
  const { services, addService, updateService, deleteService } = useApp();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", description: "" });

  const handleSubmit = async () => {
    if (!form.name || !form.price) { toast.error("الاسم والسعر مطلوبان"); return; }
    if (editing) {
      await updateService(editing.id, { name: form.name, price: Number(form.price), duration: Number(form.duration) || 0, description: form.description });
      toast.success("تم تعديل الخدمة");
    } else {
      await addService({ name: form.name, price: Number(form.price), duration: Number(form.duration) || 0, description: form.description, isActive: true });
      toast.success("تم إضافة الخدمة");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", price: "", duration: "", description: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (s: Service) => {
    setForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), description: s.description });
    setEditing(s); setDialogOpen(true);
  };

  const toggleActive = async (s: Service) => {
    await updateService(s.id, { isActive: !s.isActive });
    toast.success(s.isActive ? "تم تعطيل الخدمة" : "تم تفعيل الخدمة");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
          <p className="text-sm text-muted-foreground">الخدمات المعطّلة لن تظهر للموظفين</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                <Plus className="w-4 h-4 ml-1" />خدمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="اسم الخدمة (مثال: غسيل عادي)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="السعر (DH)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  <Input type="number" placeholder="المدة (دقيقة)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <Textarea placeholder="الوصف (اختياري)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button className="w-full rounded-xl" onClick={handleSubmit} style={{ background: "var(--gradient-primary)" }}>
                  {editing ? "حفظ التعديلات" : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((s) => (
          <Card key={s.id} className={`p-5 rounded-2xl transition-all ${s.isActive ? "" : "opacity-60 bg-muted/30"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              {s.isActive
                ? <Badge className="bg-success/10 text-success border-success/20">مفعّلة</Badge>
                : <Badge variant="outline" className="text-muted-foreground">معطّلة</Badge>}
            </div>
            <h3 className="font-bold text-lg mb-1">{s.name}</h3>
            {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.description}</p>}
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-primary">{s.price} <span className="text-sm font-medium text-muted-foreground">DH</span></span>
              {s.duration > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />{s.duration}د</span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                  <span className="text-xs text-muted-foreground">{s.isActive ? "نشطة" : "معطّلة"}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(s)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success("تم الحذف"); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
