import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Settings as SettingsIcon, Droplets, Building2, Users, Shield, KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { Service, Branch } from "@/types";
import { useTranslation } from "react-i18next";
import { ReferralCard } from "@/components/ReferralCard";

export default function SettingsPage() {
  const {
    services, addService, updateService, deleteService,
    branches, addBranch, updateBranch, deleteBranch,
    customers, employees, orders, currentBranch,
  } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";

  const [svcDialog, setSvcDialog] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [svcForm, setSvcForm] = useState({ name: "", price: "", duration: "", description: "" });

  const handleSvcSubmit = async () => {
    if (!svcForm.name || !svcForm.price || !svcForm.duration) { toast.error(t("common.fillRequired")); return; }
    if (editingSvc) {
      await updateService(editingSvc.id, { name: svcForm.name, price: Number(svcForm.price), duration: Number(svcForm.duration), description: svcForm.description });
      toast.success(t("services.serviceUpdated"));
    } else {
      await addService({ name: svcForm.name, price: Number(svcForm.price), duration: Number(svcForm.duration), description: svcForm.description, isActive: true, category: 'standard', startingFrom: false });
      toast.success(t("services.serviceAdded"));
    }
    setSvcForm({ name: "", price: "", duration: "", description: "" }); setEditingSvc(null); setSvcDialog(false);
  };

  const [brDialog, setBrDialog] = useState(false);
  const [editingBr, setEditingBr] = useState<Branch | null>(null);
  const [brForm, setBrForm] = useState({ name: "", address: "", phone: "" });

  const handleBrSubmit = async () => {
    if (!brForm.name || !brForm.address || !brForm.phone) { toast.error(t("common.fillRequired")); return; }
    if (editingBr) {
      await updateBranch(editingBr.id, brForm);
      toast.success(t("branches.branchUpdated"));
    } else {
      await addBranch({ ...brForm, isActive: true });
      toast.success(t("branches.branchAdded"));
    }
    setBrForm({ name: "", address: "", phone: "" }); setEditingBr(null); setBrDialog(false);
  };

  const [users, setUsers] = useState<{ id: string; user_id: string; name: string; role: string; created_at: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Password change state
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwd.next || !pwd.confirm) { toast.error(t("common.fillRequired")); return; }
    if (pwd.next.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (pwd.next !== pwd.confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) toast.error(error.message);
    else { toast.success("تم تغيير كلمة المرور بنجاح"); setPwd({ current: "", next: "", confirm: "" }); }
    setPwdLoading(false);
  };

  const handleSendResetEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { toast.error("لا يوجد بريد إلكتروني"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(`تم إرسال رابط إعادة التعيين إلى ${user.email}`);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateUserRole = async (profileId: string, userId: string, newRole: string) => {
    const { error: pErr } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    if (pErr) { toast.error(t("settings.roleUpdateError")); return; }
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error: rErr } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
    if (rErr) { toast.error(t("settings.rolePartialError")); return; }
    toast.success(t("settings.roleUpdated"));
    fetchUsers();
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return t("common.admin");
      case 'manager': return t("common.manager");
      case 'supervisor': return t("common.supervisor");
      case 'employee': return t("common.employee");
      case 'customer': return t("common.customer");
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
  const C = t("common.currency");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="lavage-card p-4 text-center"><p className="text-2xl font-bold text-primary">{orders.length}</p><p className="text-xs text-muted-foreground">{t("settings.totalOrders")}</p></div>
        <div className="lavage-card p-4 text-center"><p className="text-2xl font-bold text-success">{totalRevenue} {C}</p><p className="text-xs text-muted-foreground">{t("settings.totalRevenue")}</p></div>
        <div className="lavage-card p-4 text-center"><p className="text-2xl font-bold text-warning">{customers.length}</p><p className="text-xs text-muted-foreground">{t("settings.customers")}</p></div>
        <div className="lavage-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{employees.length}</p><p className="text-xs text-muted-foreground">{t("settings.employees")}</p></div>
      </div>

      <Tabs defaultValue="account" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="account"><KeyRound className="w-4 h-4 mx-1" />الحساب</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="w-4 h-4 mx-1" />{t("settings.tabs.roles")}</TabsTrigger>
          <TabsTrigger value="services"><Droplets className="w-4 h-4 mx-1" />{t("settings.tabs.services")}</TabsTrigger>
          <TabsTrigger value="branches"><Building2 className="w-4 h-4 mx-1" />{t("settings.tabs.branches")}</TabsTrigger>
          <TabsTrigger value="overview"><Users className="w-4 h-4 mx-1" />{t("settings.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="about">{t("settings.tabs.about")}</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <div className="mb-4">
            <ReferralCard />
          </div>
          <div className="lavage-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">تغيير كلمة المرور</h3>
                <p className="text-xs text-muted-foreground">قم بتحديث كلمة مرور حسابك</p>
              </div>
            </div>
            <div className="p-6 space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                <Input
                  type="password"
                  placeholder="6 أحرف على الأقل"
                  value={pwd.next}
                  onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                <Input
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={pwd.confirm}
                  onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                  className="h-11"
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={pwdLoading} className="w-full h-11 lavage-btn">
                <KeyRound className="w-4 h-4 mx-2" />
                {pwdLoading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
              </Button>

              <div className="pt-4 border-t border-border space-y-2">
                <p className="text-xs text-muted-foreground">نسيت كلمة المرور الحالية؟ يمكنك إرسال رابط إعادة التعيين إلى بريدك:</p>
                <Button onClick={handleSendResetEmail} variant="outline" className="w-full">
                  إرسال رابط إعادة تعيين بالبريد
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <div className="lavage-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">{t("settings.rolesTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("settings.rolesSub")}</p>
              </div>
              <Button size="sm" className="lavage-btn" onClick={fetchUsers}>{t("common.refresh")}</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-secondary/50">
                  <TableHead className="text-muted-foreground">{t("common.name")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("settings.currentRole")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("customers.regDate")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("settings.changeRole")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("common.loading")}</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("settings.noUsers")}</TableCell></TableRow>
                ) : users.map((u) => (
                  <TableRow key={u.id} className="lavage-table-row border-border">
                    <TableCell className="font-medium text-foreground">{u.name || t("settings.noName")}</TableCell>
                    <TableCell><Badge className={roleBadgeClass(u.role)}>{roleLabel(u.role)}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString(locale)}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(val) => updateUserRole(u.id, u.user_id, val)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t("common.admin")}</SelectItem>
                          <SelectItem value="manager">{t("common.manager")}</SelectItem>
                          <SelectItem value="supervisor">{t("common.supervisor")}</SelectItem>
                          <SelectItem value="employee">{t("common.employee")}</SelectItem>
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
              <h3 className="text-lg font-bold text-foreground">{t("services.title")}</h3>
              <Dialog open={svcDialog} onOpenChange={(v) => { if (!v) { setSvcForm({ name: "", price: "", duration: "", description: "" }); setEditingSvc(null); } setSvcDialog(v); }}>
                <DialogTrigger asChild><Button size="sm" className="lavage-btn"><Plus className="w-4 h-4 mx-1" />{t("services.newService")}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>{editingSvc ? t("services.editService") : t("services.addNew")}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder={t("services.serviceName")} value={svcForm.name} onChange={(e) => setSvcForm((f) => ({ ...f, name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" placeholder={t("services.priceMad")} value={svcForm.price} onChange={(e) => setSvcForm((f) => ({ ...f, price: e.target.value }))} />
                      <Input type="number" placeholder={t("services.durationMin")} value={svcForm.duration} onChange={(e) => setSvcForm((f) => ({ ...f, duration: e.target.value }))} />
                    </div>
                    <Textarea placeholder={t("common.description")} value={svcForm.description} onChange={(e) => setSvcForm((f) => ({ ...f, description: e.target.value }))} />
                    <Button className="w-full lavage-btn" onClick={handleSvcSubmit}>{editingSvc ? t("common.save") : t("common.add")}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">{t("services.serviceName")}</TableHead><TableHead className="text-muted-foreground">{t("common.price")}</TableHead><TableHead className="text-muted-foreground">{t("common.duration")}</TableHead><TableHead className="text-muted-foreground">{t("common.description")}</TableHead><TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className="lavage-table-row border-border">
                    <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                    <TableCell className="text-primary font-semibold">{s.price} {C}</TableCell>
                    <TableCell className="text-foreground">{s.duration} {t("common.minutes")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSvcForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), description: s.description }); setEditingSvc(s); setSvcDialog(true); }} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success(t("services.serviceDisabled")); }} className="lavage-glow" title={t("services.serviceDisabled")}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
              <h3 className="text-lg font-bold text-foreground">{t("branches.title")}</h3>
              <Dialog open={brDialog} onOpenChange={(v) => { if (!v) { setBrForm({ name: "", address: "", phone: "" }); setEditingBr(null); } setBrDialog(v); }}>
                <DialogTrigger asChild><Button size="sm" className="lavage-btn"><Plus className="w-4 h-4 mx-1" />{t("branches.newBranch")}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>{editingBr ? t("branches.editBranch") : t("branches.addNew")}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder={t("branches.branchName")} value={brForm.name} onChange={(e) => setBrForm((f) => ({ ...f, name: e.target.value }))} />
                    <Input placeholder={t("common.address")} value={brForm.address} onChange={(e) => setBrForm((f) => ({ ...f, address: e.target.value }))} />
                    <Input placeholder={t("common.phone")} value={brForm.phone} onChange={(e) => setBrForm((f) => ({ ...f, phone: e.target.value }))} />
                    <Button className="w-full lavage-btn" onClick={handleBrSubmit}>{editingBr ? t("common.save") : t("common.add")}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">{t("branches.branchName")}</TableHead><TableHead className="text-muted-foreground">{t("common.address")}</TableHead><TableHead className="text-muted-foreground">{t("common.phone")}</TableHead><TableHead className="text-muted-foreground">{t("common.status")}</TableHead><TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id} className="lavage-table-row border-border">
                    <TableCell className="font-medium text-foreground">{b.name} {b.id === currentBranch?.id && <Badge className="bg-primary text-primary-foreground text-[10px] mx-1">{t("settings.currentTag")}</Badge>}</TableCell>
                    <TableCell className="text-foreground">{b.address}</TableCell>
                    <TableCell className="text-foreground">{b.phone}</TableCell>
                    <TableCell><Badge className={b.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>{b.isActive ? t("common.active") : t("common.inactive")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setBrForm({ name: b.name, address: b.address, phone: b.phone }); setEditingBr(b); setBrDialog(true); }} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                        {branches.length > 1 && <Button variant="ghost" size="icon" onClick={async () => { await deleteBranch(b.id); toast.success(t("branches.branchDeleted")); }} className="lavage-glow"><Trash2 className="w-4 h-4 text-destructive" /></Button>}
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
            <div className="p-4 border-b border-border"><h3 className="text-lg font-bold text-foreground">{t("settings.employeesSummary")}</h3></div>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">{t("common.reference")}</TableHead><TableHead className="text-muted-foreground">{t("common.name")}</TableHead><TableHead className="text-muted-foreground">{t("employees.role")}</TableHead><TableHead className="text-muted-foreground">{t("employees.job")}</TableHead><TableHead className="text-muted-foreground">{t("common.phone")}</TableHead><TableHead className="text-muted-foreground">{t("employees.startDate")}</TableHead><TableHead className="text-muted-foreground">{t("common.status")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id} className="lavage-table-row border-border">
                    <TableCell className="font-mono text-xs text-foreground">{e.reference || "-"}</TableCell>
                    <TableCell className="font-medium text-foreground">{e.name}</TableCell>
                    <TableCell><Badge variant="secondary">{e.roleType === 'admin' ? t("common.admin") : t("common.employee")}</Badge></TableCell>
                    <TableCell className="text-foreground">{e.role}</TableCell>
                    <TableCell className="text-foreground">{e.phone}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.hireDate).toLocaleDateString(locale)}</TableCell>
                    <TableCell><Badge className={e.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>{e.isActive ? t("common.active") : t("common.inactive")}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <div className="lavage-card p-6 text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">H&Lavage</h2>
            <p className="text-sm text-muted-foreground">v1.0</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
