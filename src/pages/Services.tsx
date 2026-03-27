import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Droplets, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function Services() {
  const { services, addService, updateService, deleteService } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", description: "" });

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration) { toast.error("يرجى ملء جميع الحقول"); return; }
    if (editing) {
      await updateService(editing.id, { name: form.name, price: Number(form.price), duration: Number(form.duration), description: form.description });
      toast.success("تم تعديل الخدمة");
    } else {
      await addService({ name: form.name, price: Number(form.price), duration: Number(form.duration), description: form.description });
      toast.success("تم إضافة الخدمة");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", price: "", duration: "", description: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (s: Service) => {
    setForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), description: s.description });
    setEditing(s); setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />خدمة جديدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="اسم الخدمة" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="السعر (ر.س)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                <Input type="number" placeholder="المدة (دقيقة)" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
              </div>
              <Textarea placeholder="الوصف" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <Button className="w-full" onClick={handleSubmit}>{editing ? "حفظ" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((s) => (
          <Card key={s.id} className="relative group">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{s.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{s.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{s.duration} دقيقة</div>
                <div className="flex items-center gap-1 font-bold text-primary"><DollarSign className="w-4 h-4" />{s.price} ر.س</div>
              </div>
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success("تم حذف الخدمة"); }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
