import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Droplets, Clock, DollarSign, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Services() {
  const { services, addService, updateService, deleteService, addInvoice, currentBranch } = useApp();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", description: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

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

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const totalPrice = selectedServices.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0);

  const handleCreateInvoice = async () => {
    if (selectedServices.length === 0) { toast.error("يرجى اختيار خدمة واحدة على الأقل"); return; }
    await addInvoice({
      orderId: crypto.randomUUID(),
      customerName: "عميل مباشر",
      services: selectedServices.map(id => {
        const svc = services.find(s => s.id === id);
        return { name: svc?.name || '', price: svc?.price || 0 };
      }),
      totalAmount: totalPrice,
      paidAmount: totalPrice,
      isPaid: true,
      createdAt: new Date().toISOString(),
      branchId: currentBranch?.id || '',
    });
    setSelectedServices([]);
    toast.success("تم إنشاء الفاتورة بنجاح");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">إدارة الخدمات</h1>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="lavage-btn"><Plus className="w-4 h-4 ml-2" />خدمة جديدة</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
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
        )}
      </div>

      {/* Services as Button Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((s) => {
          const isSelected = selectedServices.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleService(s.id)}
              className={`lavage-card p-5 text-right transition-all duration-300 group cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-[0_0_25px_rgba(250,204,21,0.2)]' 
                  : 'hover:shadow-[0_0_20px_rgba(250,204,21,0.1)]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary' : 'bg-muted'
                }`}>
                  <Droplets className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{s.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{s.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{s.duration} دقيقة</div>
                <div className="flex items-center gap-1 font-bold text-primary"><DollarSign className="w-4 h-4" />{s.price} ر.س</div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 mt-3 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success("تم حذف الخدمة"); }} className="lavage-glow">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Invoice Total */}
      {selectedServices.length > 0 && (
        <div className="lavage-card p-6 sticky bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{selectedServices.length} خدمة مختارة</p>
                <p className="text-3xl font-bold text-primary">{totalPrice} ر.س</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedServices([])} className="lavage-glow">
                إلغاء
              </Button>
              <Button onClick={handleCreateInvoice} className="lavage-btn">
                <DollarSign className="w-4 h-4 ml-1" />
                إنشاء فاتورة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
