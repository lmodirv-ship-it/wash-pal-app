import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", carType: "", carPlate: "" });

  const filtered = customers.filter((c) => c.name.includes(search) || c.phone.includes(search) || c.carPlate.includes(search) || c.reference?.includes(search));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.carType || !form.carPlate) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    if (editing) {
      await updateCustomer(editing.id, form);
      toast.success("تم تعديل بيانات العميل");
    } else {
      await addCustomer({ ...form, role: 'customer' });
      toast.success("تم إضافة العميل بنجاح");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", phone: "", email: "", carType: "", carPlate: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (c: Customer) => { setForm({ name: c.name, phone: c.phone, email: c.email || "", carType: c.carType, carPlate: c.carPlate }); setEditing(c); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">إدارة العملاء</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 ml-2" />عميل جديد</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editing ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="الاسم" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="البريد الإلكتروني (اختياري)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="نوع السيارة" value={form.carType} onChange={(e) => setForm((f) => ({ ...f, carType: e.target.value }))} />
                <Input placeholder="رقم اللوحة" value={form.carPlate} onChange={(e) => setForm((f) => ({ ...f, carPlate: e.target.value }))} />
              </div>
              <Button className="w-full lavage-btn" onClick={handleSubmit}>{editing ? "حفظ التعديلات" : "إضافة العميل"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="بحث بالاسم أو الهاتف أو المرجع..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">المرجع</TableHead><TableHead className="text-muted-foreground">الاسم</TableHead><TableHead className="text-muted-foreground">الصلاحية</TableHead>
              <TableHead className="text-muted-foreground">الهاتف</TableHead><TableHead className="text-muted-foreground">السيارة</TableHead><TableHead className="text-muted-foreground">اللوحة</TableHead>
              <TableHead className="text-muted-foreground">تاريخ التسجيل</TableHead><TableHead className="text-muted-foreground">الزيارات</TableHead><TableHead className="text-muted-foreground">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border"><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا يوجد عملاء</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="lavage-table-row border-border">
                <TableCell className="font-mono text-xs text-foreground">{c.reference || "-"}</TableCell>
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell><Badge variant="secondary">{c.role === 'customer' ? 'عميل' : c.role}</Badge></TableCell>
                <TableCell className="text-foreground">{c.phone}</TableCell>
                <TableCell className="text-foreground">{c.carType}</TableCell>
                <TableCell className="text-foreground">{c.carPlate}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                <TableCell className="text-foreground">{c.totalVisits}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={async () => { await deleteCustomer(c.id); toast.success("تم حذف العميل"); }} className="lavage-glow">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
