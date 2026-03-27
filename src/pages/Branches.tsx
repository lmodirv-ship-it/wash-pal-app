import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Branch } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Building2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export default function Branches() {
  const { branches, setBranches, currentBranch, setCurrentBranch } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const handleSubmit = () => {
    if (!form.name || !form.address || !form.phone) { toast.error("يرجى ملء جميع الحقول"); return; }
    if (editing) {
      setBranches((p) => p.map((b) => b.id === editing.id ? { ...b, ...form } : b));
      if (currentBranch.id === editing.id) setCurrentBranch({ ...currentBranch, ...form });
      toast.success("تم تعديل الفرع");
    } else {
      const b: Branch = { id: Date.now().toString(), ...form, isActive: true };
      setBranches((p) => [...p, b]);
      toast.success("تم إضافة الفرع");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", address: "", phone: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (b: Branch) => { setForm({ name: b.name, address: b.address, phone: b.phone }); setEditing(b); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">إدارة الفروع</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />فرع جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "تعديل الفرع" : "إضافة فرع جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="اسم الفرع" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="العنوان" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Button className="w-full" onClick={handleSubmit}>{editing ? "حفظ" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <Card key={b.id} className={`relative ${b.id === currentBranch.id ? "ring-2 ring-primary" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">{b.name}</h3>
                  {b.id === currentBranch.id && <Badge className="bg-primary text-primary-foreground text-xs">الفرع الحالي</Badge>}
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{b.address}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{b.phone}</div>
              </div>
              <div className="flex gap-2 mt-4">
                {b.id !== currentBranch.id && (
                  <Button variant="outline" size="sm" onClick={() => { setCurrentBranch(b); toast.success(`تم التبديل إلى ${b.name}`); }}>تبديل</Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => startEdit(b)}><Edit className="w-4 h-4" /></Button>
                {branches.length > 1 && b.id !== currentBranch.id && (
                  <Button variant="ghost" size="icon" onClick={() => { setBranches((p) => p.filter((x) => x.id !== b.id)); toast.success("تم حذف الفرع"); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
