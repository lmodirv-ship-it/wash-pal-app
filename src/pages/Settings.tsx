import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Settings as SettingsIcon, Droplets, Building2, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { Service, Branch } from "@/types";

export default function SettingsPage() {
  const {
    services, addService, updateService, deleteService,
    branches, addBranch, updateBranch, deleteBranch,
    customers, employees, orders, invoices, currentBranch,
  } = useApp();

  const [svcDialog, setSvcDialog] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [svcForm, setSvcForm] = useState({ name: "", price: "", duration: "", description: "" });

  const handleSvcSubmit = async () => {
    if (!svcForm.name || !svcForm.price || !svcForm.duration) { toast.error("يرجى ملء الحقول"); return; }
    if (editingSvc) {
      await updateService(editingSvc.id, { name: svcForm.name, price: Number(svcForm.price), duration: Number(svcForm.duration), description: svcForm.description });
      toast.success("تم تعديل الخدمة");
    } else {
      await addService({ name: svcForm.name, price: Number(svcForm.price), duration: Number(svcForm.duration), description: svcForm.description, isActive: true, category: 'standard', startingFrom: false });
      toast.success("تم إضافة الخدمة");
    }
    setSvcForm({ name: "", price: "", duration: "", description: "" }); setEditingSvc(null); setSvcDialog(false);
  };

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

  // User roles management
  const [users, setUsers] = useState<{ id: string; user_id: string; name: string; role: string; created_at: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateUserRole = async (profileId: string, userId: string, newRole: string) => {
    const { error: pErr } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    if (pErr) { toast.error("خطأ في تحديث الدور"); return; }
    // Sync user_roles (source of truth for permissions)
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error: rErr } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
    if (rErr) { toast.error("تم تحديث الملف لكن فشل تحديث الصلاحية"); return; }
    toast.success("تم تحديث دور المستخدم");
    fetchUsers();
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'manager': return 'مسير';
      case 'supervisor': return 'مشرف';
      case 'employee': return 'موظف';
      case 'customer': return 'عميل';
      default: return role;
    }
  };

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'manager': return 'bg-accent text-accent-foreground';
      case 'supervisor': return 'bg-warning text-warning-foreground';
      case 'employee': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">إعدادات H&Lavage</h1>
          <p className="text-sm text-muted-foreground">إدارة جميع إعدادات البرنامج</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="lavage-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{orders.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
        </div>
        <div className="lavage-card p-4 text-center">
          <p className="text-2xl font-bold text-success">{totalRevenue} ر.س</p>
          <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
        </div>
        <div className="lavage-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">{customers.length}</p>
          <p className="text-xs text-muted-foreground">العملاء</p>
        </div>
        <div className="lavage-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{employees.length}</p>
          <p className="text-xs text-muted-foreground">الموظفين</p>
        </div>
      </div>

      <Tabs defaultValue="roles" dir="rtl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="roles"><Shield className="w-4 h-4 ml-1" />الصلاحيات</TabsTrigger>
          <TabsTrigger value="services"><Droplets className="w-4 h-4 ml-1" />الخدمات</TabsTrigger>
          <TabsTrigger value="branches"><Building2 className="w-4 h-4 ml-1" />الفروع</TabsTrigger>
          <TabsTrigger value="overview"><Users className="w-4 h-4 ml-1" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="about">حول</TabsTrigger>
        </TabsList>

        {/* Roles Management Tab */}
        <TabsContent value="roles" className="mt-4">
          <div className="lavage-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">إدارة الصلاحيات والأدوار</h3>
                <p className="text-xs text-muted-foreground">المدير يحدد دور كل مستخدم في النظام</p>
              </div>
              <Button size="sm" className="lavage-btn" onClick={fetchUsers}>تحديث</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-secondary/50">
                  <TableHead className="text-muted-foreground">الاسم</TableHead>
                  <TableHead className="text-muted-foreground">الدور الحالي</TableHead>
                  <TableHead className="text-muted-foreground">تاريخ التسجيل</TableHead>
                  <TableHead className="text-muted-foreground">تغيير الدور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">جاري التحميل...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">لا يوجد مستخدمين</TableCell></TableRow>
                ) : users.map((u) => (
                  <TableRow key={u.id} className="lavage-table-row border-border">
                    <TableCell className="font-medium text-foreground">{u.name || 'بدون اسم'}</TableCell>
                    <TableCell>
                      <Badge className={roleBadgeClass(u.role)}>{roleLabel(u.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(val) => updateUserRole(u.id, u.user_id, val)}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير</SelectItem>
                          <SelectItem value="manager">مسير</SelectItem>
                          <SelectItem value="supervisor">مشرف</SelectItem>
                          <SelectItem value="employee">موظف</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="lavage-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">إدارة الخدمات</h3>
              <Dialog open={svcDialog} onOpenChange={(v) => { if (!v) { setSvcForm({ name: "", price: "", duration: "", description: "" }); setEditingSvc(null); } setSvcDialog(v); }}>
                <DialogTrigger asChild><Button size="sm" className="lavage-btn"><Plus className="w-4 h-4 ml-1" />خدمة جديدة</Button></DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>{editingSvc ? "تعديل الخدمة" : "إضافة خدمة"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="اسم الخدمة" value={svcForm.name} onChange={(e) => setSvcForm((f) => ({ ...f, name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" placeholder="السعر (ر.س)" value={svcForm.price} onChange={(e) => setSvcForm((f) => ({ ...f, price: e.target.value }))} />
                      <Input type="number" placeholder="المدة (دقيقة)" value={svcForm.duration} onChange={(e) => setSvcForm((f) => ({ ...f, duration: e.target.value }))} />
                    </div>
                    <Textarea placeholder="الوصف" value={svcForm.description} onChange={(e) => setSvcForm((f) => ({ ...f, description: e.target.value }))} />
                    <Button className="w-full lavage-btn" onClick={handleSvcSubmit}>{editingSvc ? "حفظ" : "إضافة"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">الخدمة</TableHead><TableHead className="text-muted-foreground">السعر</TableHead><TableHead className="text-muted-foreground">المدة</TableHead><TableHead className="text-muted-foreground">الوصف</TableHead><TableHead className="text-muted-foreground">إجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className="lavage-table-row border-border">
                    <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                    <TableCell className="text-primary font-semibold">{s.price} ر.س</TableCell>
                    <TableCell className="text-foreground">{s.duration} دقيقة</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSvcForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), description: s.description }); setEditingSvc(s); setSvcDialog(true); }} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success("تم حذف الخدمة"); }} className="lavage-glow"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          <div className="lavage-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">إدارة الفروع</h3>
              <Dialog open={brDialog} onOpenChange={(v) => { if (!v) { setBrForm({ name: "", address: "", phone: "" }); setEditingBr(null); } setBrDialog(v); }}>
                <DialogTrigger asChild><Button size="sm" className="lavage-btn"><Plus className="w-4 h-4 ml-1" />فرع جديد</Button></DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>{editingBr ? "تعديل الفرع" : "إضافة فرع"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="اسم الفرع" value={brForm.name} onChange={(e) => setBrForm((f) => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="العنوان" value={brForm.address} onChange={(e) => setBrForm((f) => ({ ...f, address: e.target.value }))} />
                    <Input placeholder="رقم الهاتف" value={brForm.phone} onChange={(e) => setBrForm((f) => ({ ...f, phone: e.target.value }))} />
                    <Button className="w-full lavage-btn" onClick={handleBrSubmit}>{editingBr ? "حفظ" : "إضافة"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">الفرع</TableHead><TableHead className="text-muted-foreground">العنوان</TableHead><TableHead className="text-muted-foreground">الهاتف</TableHead><TableHead className="text-muted-foreground">الحالة</TableHead><TableHead className="text-muted-foreground">إجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id} className="lavage-table-row border-border">
                    <TableCell className="font-medium text-foreground">{b.name} {b.id === currentBranch?.id && <Badge className="bg-primary text-primary-foreground text-[10px] mr-1">حالي</Badge>}</TableCell>
                    <TableCell className="text-foreground">{b.address}</TableCell>
                    <TableCell className="text-foreground">{b.phone}</TableCell>
                    <TableCell><Badge className={b.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>{b.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setBrForm({ name: b.name, address: b.address, phone: b.phone }); setEditingBr(b); setBrDialog(true); }} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                        {branches.length > 1 && <Button variant="ghost" size="icon" onClick={async () => { await deleteBranch(b.id); toast.success("تم حذف الفرع"); }} className="lavage-glow"><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="lavage-card overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="text-lg font-bold text-foreground">ملخص الموظفين</h3></div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">المرجع</TableHead><TableHead className="text-muted-foreground">الاسم</TableHead><TableHead className="text-muted-foreground">الصلاحية</TableHead><TableHead className="text-muted-foreground">الوظيفة</TableHead><TableHead className="text-muted-foreground">الهاتف</TableHead><TableHead className="text-muted-foreground">تاريخ البداية</TableHead><TableHead className="text-muted-foreground">الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id} className="lavage-table-row border-border">
                    <TableCell className="font-mono text-xs text-foreground">{e.reference || "-"}</TableCell>
                    <TableCell className="font-medium text-foreground">{e.name}</TableCell>
                    <TableCell><Badge variant="secondary">{e.roleType === 'admin' ? 'مدير' : 'موظف'}</Badge></TableCell>
                    <TableCell className="text-foreground">{e.role}</TableCell>
                    <TableCell className="text-foreground">{e.phone}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.hireDate).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell><Badge className={e.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>{e.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="lavage-card overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="text-lg font-bold text-foreground">ملخص العملاء</h3></div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">المرجع</TableHead><TableHead className="text-muted-foreground">الاسم</TableHead><TableHead className="text-muted-foreground">الصلاحية</TableHead><TableHead className="text-muted-foreground">الهاتف</TableHead><TableHead className="text-muted-foreground">السيارة</TableHead><TableHead className="text-muted-foreground">اللوحة</TableHead><TableHead className="text-muted-foreground">الزيارات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="lavage-table-row border-border">
                    <TableCell className="font-mono text-xs text-foreground">{c.reference || "-"}</TableCell>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell><Badge variant="secondary">{c.role === 'customer' ? 'عميل' : c.role}</Badge></TableCell>
                    <TableCell className="text-foreground">{c.phone}</TableCell>
                    <TableCell className="text-foreground">{c.carType}</TableCell>
                    <TableCell className="text-foreground">{c.carPlate}</TableCell>
                    <TableCell className="text-foreground">{c.totalVisits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <div className="lavage-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <span className="text-2xl font-black text-primary-foreground">H&L</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">H&Lavage</h2>
                <p className="text-muted-foreground">نظام إدارة محلات غسل السيارات</p>
                <p className="text-sm text-muted-foreground">الإصدار 1.0.0</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              برنامج H&Lavage هو نظام متكامل لإدارة محلات غسل السيارات. يتيح لك إدارة الطلبات، العملاء، الموظفين، الخدمات، الفواتير، والتقارير المالية مع دعم لأكثر من فرع. المدير يتحكم بجميع الإعدادات من هذه الصفحة وكل ما يتم تعديله ينعكس على جميع المستخدمين.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
