import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Car, Plus, Trash2, Edit, Settings as SettingsIcon, Droplets, Building2, Users, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Service, Branch } from "@/types";

export default function SettingsPage() {
  const {
    services, addService, updateService, deleteService,
    branches, addBranch, updateBranch, deleteBranch,
    customers, employees, orders, invoices, currentBranch,
  } = useApp();

  // Service form
  const [svcDialog, setSvcDialog] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [svcForm, setSvcForm] = useState({ name: "", price: "", duration: "", description: "" });

  const handleSvcSubmit = async () => {
    if (!svcForm.name || !svcForm.price || !svcForm.duration) { toast.error("يرجى ملء الحقول"); return; }
    if (editingSvc) {
      await updateService(editingSvc.id, { name: svcForm.name, price: Number(svcForm.price), duration: Number(svcForm.duration), description: svcForm.description });
      toast.success("تم تعديل الخدمة");
    } else {
      await addService({ name: svcForm.name, price: Number(svcForm.price), duration: Number(svcForm.duration), description: svcForm.description });
      toast.success("تم إضافة الخدمة");
    }
    setSvcForm({ name: "", price: "", duration: "", description: "" }); setEditingSvc(null); setSvcDialog(false);
  };

  // Branch form
  const [brDialog, setBrDialog] = useState(false);
  const [editingBr, setEditingBr] = useState<Branch | null>(null);
  const [brForm, setBrForm] = useState({ name: "", address: "", phone: "" });

  const handleBrSubmit = async () => {
    if (!brForm.name || !brForm.address || !brForm.phone) { toast.error("يرجى ملء الحقول"); return; }
    if (editingBr) {
      await updateBranch(editingBr.id, brForm);
      toast.success("تم تعديل الفرع");
    } else {
      await addBranch({ ...brForm, isActive: true });
      toast.success("تم إضافة الفرع");
    }
    setBrForm({ name: "", address: "", phone: "" }); setEditingBr(null); setBrDialog(false);
  };

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
          <p className="text-sm text-muted-foreground">إدارة جميع إعدادات البرنامج</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-primary/5"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{orders.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
        </CardContent></Card>
        <Card className="bg-success/5"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{totalRevenue} ر.س</p>
          <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
        </CardContent></Card>
        <Card className="bg-warning/5"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-warning">{customers.length}</p>
          <p className="text-xs text-muted-foreground">العملاء</p>
        </CardContent></Card>
        <Card className="bg-muted"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{employees.length}</p>
          <p className="text-xs text-muted-foreground">الموظفين</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="services" dir="rtl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services"><Droplets className="w-4 h-4 ml-1" />الخدمات</TabsTrigger>
          <TabsTrigger value="branches"><Building2 className="w-4 h-4 ml-1" />الفروع</TabsTrigger>
          <TabsTrigger value="overview"><Users className="w-4 h-4 ml-1" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="about"><Car className="w-4 h-4 ml-1" />حول</TabsTrigger>
        </TabsList>

        {/* Services Management */}
        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">إدارة الخدمات</CardTitle>
              <Dialog open={svcDialog} onOpenChange={(v) => { if (!v) { setSvcForm({ name: "", price: "", duration: "", description: "" }); setEditingSvc(null); } setSvcDialog(v); }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-1" />خدمة جديدة</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingSvc ? "تعديل الخدمة" : "إضافة خدمة"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="اسم الخدمة" value={svcForm.name} onChange={(e) => setSvcForm((f) => ({ ...f, name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" placeholder="السعر (ر.س)" value={svcForm.price} onChange={(e) => setSvcForm((f) => ({ ...f, price: e.target.value }))} />
                      <Input type="number" placeholder="المدة (دقيقة)" value={svcForm.duration} onChange={(e) => setSvcForm((f) => ({ ...f, duration: e.target.value }))} />
                    </div>
                    <Textarea placeholder="الوصف" value={svcForm.description} onChange={(e) => setSvcForm((f) => ({ ...f, description: e.target.value }))} />
                    <Button className="w-full" onClick={handleSvcSubmit}>{editingSvc ? "حفظ" : "إضافة"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>الخدمة</TableHead><TableHead>السعر</TableHead><TableHead>المدة</TableHead><TableHead>الوصف</TableHead><TableHead>إجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.price} ر.س</TableCell>
                      <TableCell>{s.duration} دقيقة</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSvcForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), description: s.description }); setEditingSvc(s); setSvcDialog(true); }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success("تم حذف الخدمة"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Management */}
        <TabsContent value="branches" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">إدارة الفروع</CardTitle>
              <Dialog open={brDialog} onOpenChange={(v) => { if (!v) { setBrForm({ name: "", address: "", phone: "" }); setEditingBr(null); } setBrDialog(v); }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-1" />فرع جديد</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingBr ? "تعديل الفرع" : "إضافة فرع"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="اسم الفرع" value={brForm.name} onChange={(e) => setBrForm((f) => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="العنوان" value={brForm.address} onChange={(e) => setBrForm((f) => ({ ...f, address: e.target.value }))} />
                    <Input placeholder="رقم الهاتف" value={brForm.phone} onChange={(e) => setBrForm((f) => ({ ...f, phone: e.target.value }))} />
                    <Button className="w-full" onClick={handleBrSubmit}>{editingBr ? "حفظ" : "إضافة"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>الفرع</TableHead><TableHead>العنوان</TableHead><TableHead>الهاتف</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {branches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name} {b.id === currentBranch?.id && <Badge className="bg-primary text-primary-foreground text-[10px] mr-1">حالي</Badge>}</TableCell>
                      <TableCell>{b.address}</TableCell>
                      <TableCell>{b.phone}</TableCell>
                      <TableCell><Badge className={b.isActive ? "bg-success text-success-foreground" : "bg-muted"}>{b.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setBrForm({ name: b.name, address: b.address, phone: b.phone }); setEditingBr(b); setBrDialog(true); }}><Edit className="w-4 h-4" /></Button>
                          {branches.length > 1 && <Button variant="ghost" size="icon" onClick={async () => { await deleteBranch(b.id); toast.success("تم حذف الفرع"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">ملخص الموظفين</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>المرجع</TableHead><TableHead>الاسم</TableHead><TableHead>الصلاحية</TableHead><TableHead>الوظيفة</TableHead><TableHead>الهاتف</TableHead><TableHead>تاريخ البداية</TableHead><TableHead>الحالة</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.reference || "-"}</TableCell>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell><Badge variant="secondary">{e.roleType === 'admin' ? 'مدير' : e.roleType === 'employee' ? 'موظف' : e.roleType}</Badge></TableCell>
                      <TableCell>{e.role}</TableCell>
                      <TableCell>{e.phone}</TableCell>
                      <TableCell className="text-xs">{new Date(e.hireDate).toLocaleDateString("ar-SA")}</TableCell>
                      <TableCell><Badge className={e.isActive ? "bg-success text-success-foreground" : "bg-muted"}>{e.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">ملخص العملاء</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>المرجع</TableHead><TableHead>الاسم</TableHead><TableHead>الصلاحية</TableHead><TableHead>الهاتف</TableHead><TableHead>السيارة</TableHead><TableHead>اللوحة</TableHead><TableHead>الزيارات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.reference || "-"}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="secondary">{c.role === 'customer' ? 'عميل' : c.role}</Badge></TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.carType}</TableCell>
                      <TableCell>{c.carPlate}</TableCell>
                      <TableCell>{c.totalVisits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About */}
        <TabsContent value="about" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                  <Car className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">لافاج</h2>
                  <p className="text-muted-foreground">نظام إدارة محلات غسل السيارات</p>
                  <p className="text-sm text-muted-foreground">الإصدار 1.0.0</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                برنامج لافاج هو نظام متكامل لإدارة محلات غسل السيارات. يتيح لك إدارة الطلبات، العملاء، الموظفين، الخدمات، الفواتير، والتقارير المالية مع دعم لأكثر من فرع. المدير يتحكم بجميع الإعدادات من هذه الصفحة وكل ما يتم تعديله ينعكس على جميع المستخدمين.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
