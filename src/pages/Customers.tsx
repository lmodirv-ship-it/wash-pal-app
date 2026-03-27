import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Customer } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", carType: "", carPlate: "" });

  const filtered = customers.filter((c) => c.name.includes(search) || c.phone.includes(search) || c.carPlate.includes(search));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.carType || !form.carPlate) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    if (editing) {
      await updateCustomer(editing.id, form);
      toast.success("تم تعديل بيانات العميل");
    } else {
      await addCustomer(form);
      toast.success("تم إضافة العميل بنجاح");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", phone: "", email: "", carType: "", carPlate: "" }); setEditing(null); setDialogOpen(false); };

  const startEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email || "", carType: c.carType, carPlate: c.carPlate });
    setEditing(c); setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">إدارة العملاء</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />عميل جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="الاسم" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="البريد الإلكتروني (اختياري)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="نوع السيارة" value={form.carType} onChange={(e) => setForm((f) => ({ ...f, carType: e.target.value }))} />
                <Input placeholder="رقم اللوحة" value={form.carPlate} onChange={(e) => setForm((f) => ({ ...f, carPlate: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleSubmit}>{editing ? "حفظ التعديلات" : "إضافة العميل"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead><TableHead>الهاتف</TableHead><TableHead>السيارة</TableHead>
                <TableHead>اللوحة</TableHead><TableHead>الزيارات</TableHead><TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد عملاء</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.carType}</TableCell>
                  <TableCell>{c.carPlate}</TableCell>
                  <TableCell>{c.totalVisits}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await deleteCustomer(c.id); toast.success("تم حذف العميل"); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
