import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Shop } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Store, Search } from "lucide-react";
import { toast } from "sonner";

function getExpiryColor(expiryDate: string) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { bg: "bg-destructive text-destructive-foreground", label: "منتهي" };
  if (daysLeft <= 7) return { bg: "bg-destructive/80 text-destructive-foreground", label: `${daysLeft} يوم` };
  if (daysLeft <= 15) return { bg: "bg-warning text-warning-foreground", label: `${daysLeft} يوم` };
  return { bg: "bg-success text-success-foreground", label: `${daysLeft} يوم` };
}

const packages = [
  { name: "basic", label: "أساسي - 100 نقطة", points: 100 },
  { name: "standard", label: "متوسط - 200 نقطة", points: 200 },
  { name: "premium", label: "متقدم - 500 نقطة", points: 500 },
  { name: "enterprise", label: "مؤسسي - 1000 نقطة", points: 1000 },
];

export default function Shops() {
  const { shops, addShop, updateShop, deleteShop } = useApp();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);
  const [form, setForm] = useState({
    name: "", ownerName: "", address: "", city: "", phone: "", email: "",
    packageName: "basic", totalPoints: 100, usedPoints: 0, expiryDays: 30, notes: "",
  });

  const filtered = shops.filter((s) =>
    s.name.includes(search) || s.phone.includes(search) || s.reference?.includes(search) || s.ownerName.includes(search)
  );

  const handleSubmit = async () => {
    if (!form.name || !form.ownerName || !form.address || !form.phone) {
      toast.error("يرجى ملء جميع الحقول المطلوبة"); return;
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + form.expiryDays);

    if (editing) {
      await updateShop(editing.id, {
        name: form.name, ownerName: form.ownerName, address: form.address,
        city: form.city, phone: form.phone, email: form.email,
        packageName: form.packageName, totalPoints: form.totalPoints,
        usedPoints: form.usedPoints, expiryDate: expiryDate.toISOString(),
        notes: form.notes,
      });
      toast.success("تم تعديل بيانات المحل");
    } else {
      await addShop({
        name: form.name, ownerName: form.ownerName, address: form.address,
        city: form.city, phone: form.phone, email: form.email,
        registrationDate: new Date().toISOString(),
        packageName: form.packageName, totalPoints: form.totalPoints,
        usedPoints: 0, expiryDate: expiryDate.toISOString(),
        isActive: true, notes: form.notes,
      });
      toast.success("تم إضافة المحل بنجاح");
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", ownerName: "", address: "", city: "", phone: "", email: "", packageName: "basic", totalPoints: 100, usedPoints: 0, expiryDays: 30, notes: "" });
    setEditing(null); setDialogOpen(false);
  };

  const startEdit = (s: Shop) => {
    const daysLeft = Math.max(1, Math.ceil((new Date(s.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    setForm({
      name: s.name, ownerName: s.ownerName, address: s.address, city: s.city,
      phone: s.phone, email: s.email || "", packageName: s.packageName,
      totalPoints: s.totalPoints, usedPoints: s.usedPoints, expiryDays: daysLeft, notes: s.notes || "",
    });
    setEditing(s); setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المحلات</h1>
          <p className="text-sm text-muted-foreground">إدارة المحلات المشتركة في البرنامج</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />محل جديد</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "تعديل المحل" : "إضافة محل جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="اسم المحل" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <Input placeholder="اسم المالك" value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="العنوان" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                <Input placeholder="المدينة" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                <Input placeholder="البريد الإلكتروني (اختياري)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">الباقة</p>
                <div className="grid grid-cols-2 gap-2">
                  {packages.map((pkg) => (
                    <Button key={pkg.name} variant={form.packageName === pkg.name ? "default" : "outline"} size="sm"
                      onClick={() => setForm((f) => ({ ...f, packageName: pkg.name, totalPoints: pkg.points }))}>
                      {pkg.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">عدد النقاط</label>
                  <Input type="number" value={form.totalPoints} onChange={(e) => setForm((f) => ({ ...f, totalPoints: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">مدة الاشتراك (أيام)</label>
                  <Input type="number" value={form.expiryDays} onChange={(e) => setForm((f) => ({ ...f, expiryDays: Number(e.target.value) }))} />
                </div>
              </div>
              <Textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full" onClick={handleSubmit}>{editing ? "حفظ التعديلات" : "إضافة المحل"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{shops.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي المحلات</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-success">{shops.filter((s) => s.isActive).length}</p>
          <p className="text-xs text-muted-foreground">نشطة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-warning">{shops.filter((s) => { const d = Math.ceil((new Date(s.expiryDate).getTime() - Date.now()) / 86400000); return d > 0 && d <= 7; }).length}</p>
          <p className="text-xs text-muted-foreground">قريبة الانتهاء</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-destructive">{shops.filter((s) => new Date(s.expiryDate) < new Date()).length}</p>
          <p className="text-xs text-muted-foreground">منتهية</p>
        </CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="بحث بالاسم أو الهاتف أو المرجع..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المرجع</TableHead>
                <TableHead>المحل</TableHead>
                <TableHead>المالك</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الباقة</TableHead>
                <TableHead>النقاط</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>آخر أجل</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  لا توجد محلات مسجلة
                </TableCell></TableRow>
              ) : filtered.map((s) => {
                const expiry = getExpiryColor(s.expiryDate);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.reference || "-"}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.ownerName}</TableCell>
                    <TableCell><span className="text-xs">{s.address}{s.city ? ` - ${s.city}` : ""}</span></TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell><Badge variant="secondary">{packages.find((p) => p.name === s.packageName)?.label || s.packageName}</Badge></TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-bold">{s.remainingPoints}</span>
                        <span className="text-xs text-muted-foreground">/{s.totalPoints}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(s.registrationDate).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell>
                      <Badge className={expiry.bg}>{expiry.label}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(s.expiryDate).toLocaleDateString("ar-SA")}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={async () => { await deleteShop(s.id); toast.success("تم حذف المحل"); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
