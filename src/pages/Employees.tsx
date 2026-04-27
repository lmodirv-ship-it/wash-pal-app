import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Sliders, Download, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { EmployeeServiceOverridesDialog } from "@/components/EmployeeServiceOverridesDialog";
import { exportFromView } from "@/lib/exportCsv";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

export default function Employees() {
  const { employees, branches, currentBranch, currentShopId, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "", roleType: "employee", branchId: "" });
  const [overridesFor, setOverridesFor] = useState<Employee | null>(null);
  const [pwdFor, setPwdFor] = useState<Employee | null>(null);
  const [pwdValue, setPwdValue] = useState("");
  const [pwdEmail, setPwdEmail] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const branchId = currentBranch?.id || "";
  const branchEmployees = employees.filter((e) => e.branchId === branchId);
  const branchById = new Map(branches.map((b) => [b.id, b.name]));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.role) { toast.error(t("common.fillRequired")); return; }
    const targetBranchId = form.branchId || branchId;
    if (!targetBranchId) { toast.error(t("common.fillRequired")); return; }
    try {
      if (editing) {
        await updateEmployee(editing.id, { ...form, branchId: targetBranchId });
        toast.success(t("employees.employeeUpdated"));
      } else {
        await addEmployee({ name: form.name, phone: form.phone, role: form.role, roleType: form.roleType, branchId: targetBranchId, isActive: true });
        toast.success(t("employees.employeeAdded"));
      }
      resetForm();
    } catch (err: any) {
      console.error("Employee save error:", err);
      toast.error(err?.message || "فشل حفظ الموظف");
    }
  };

  const resetForm = () => { setForm({ name: "", phone: "", role: "", roleType: "employee", branchId: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (e: Employee) => { setForm({ name: e.name, phone: e.phone, role: e.role, roleType: e.roleType, branchId: e.branchId }); setEditing(e); setDialogOpen(true); };
  const toggleActive = async (e: Employee) => { await updateEmployee(e.id, { isActive: !e.isActive }); };

  const openPwdDialog = (e: Employee) => {
    setPwdFor(e);
    setPwdValue("");
    setPwdEmail("");
  };

  const submitPassword = async () => {
    if (!pwdFor) return;
    if (pwdValue.length < 6) { toast.error("كلمة السر يجب 6 أحرف على الأقل"); return; }
    setPwdLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-employee-password", {
        body: {
          employee_id: pwdFor.id,
          new_password: pwdValue,
          email: pwdEmail.trim() || undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("تم تحديث كلمة سر الموظف");
      setPwdFor(null);
      setPwdValue("");
      setPwdEmail("");
    } catch (err: any) {
      console.error("Set employee password error:", err);
      toast.error(err?.message || "فشل تحديث كلمة السر");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t("employees.title")}</h1>
        <div className="flex items-center gap-2">
        {isAdmin && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              try {
                const { count } = await exportFromView({
                  view: "v_employees_export",
                  type: "employees",
                  shopId: currentShopId,
                  filenamePrefix: "employees",
                });
                toast.success(`تم تصدير ${count} موظف`);
              } catch (e: any) {
                toast.error(e?.message ?? "فشل التصدير");
              }
            }}
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
        )}
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 mx-2" />{t("employees.newEmployee")}</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editing ? t("employees.editEmployee") : t("employees.addNew")}</DialogTitle></DialogHeader>
            <DialogDescription className="sr-only">
              {editing ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
            </DialogDescription>
            <div className="space-y-4">
              <Input placeholder={t("common.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input placeholder={t("employees.jobPlaceholder")} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              <Select value={form.roleType} onValueChange={(v) => setForm((f) => ({ ...f, roleType: v }))}>
                <SelectTrigger><SelectValue placeholder={t("employees.roleSelect")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("common.admin")}</SelectItem>
                  <SelectItem value="employee">{t("common.employee")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.branchId || branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v }))}>
                <SelectTrigger><SelectValue placeholder="الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full lavage-btn" onClick={handleSubmit}>{editing ? t("common.save") : t("common.add")}</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">{t("common.reference")}</TableHead><TableHead className="text-muted-foreground">{t("common.name")}</TableHead><TableHead className="text-muted-foreground">{t("employees.role")}</TableHead><TableHead className="text-muted-foreground">{t("employees.branch")}</TableHead>
              <TableHead className="text-muted-foreground">{t("employees.job")}</TableHead><TableHead className="text-muted-foreground">{t("common.phone")}</TableHead><TableHead className="text-muted-foreground">{t("employees.startDate")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.status")}</TableHead><TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchEmployees.length === 0 ? (
              <TableRow className="border-border"><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("employees.noEmployees")}</TableCell></TableRow>
            ) : branchEmployees.map((e) => (
              <TableRow key={e.id} className="lavage-table-row border-border">
                <TableCell className="font-mono text-xs text-foreground">{e.reference || "-"}</TableCell>
                <TableCell className="font-medium text-foreground">{e.name}</TableCell>
                <TableCell><Badge variant="secondary">{e.roleType === 'admin' ? t("common.admin") : t("common.employee")}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{branchById.get(e.branchId) || "—"}</TableCell>
                <TableCell className="text-foreground">{e.role}</TableCell>
                <TableCell className="text-foreground">{e.phone}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(e.hireDate).toLocaleDateString(locale)}</TableCell>
                <TableCell>
                  <Badge className={e.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"} onClick={() => toggleActive(e)} style={{ cursor: "pointer" }}>
                    {e.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setOverridesFor(e)} className="lavage-glow" title={t("employees.servicesTitle")}>
                      <Sliders className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openPwdDialog(e)} className="lavage-glow" title={t("password.change")}>
                      <KeyRound className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(e)} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={async () => { await deleteEmployee(e.id); toast.success(t("employees.employeeDeleted")); }} className="lavage-glow">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmployeeServiceOverridesDialog
        open={!!overridesFor}
        onOpenChange={(v) => { if (!v) setOverridesFor(null); }}
        employee={overridesFor}
      />

      {/* Password Dialog */}
      <Dialog open={!!pwdFor} onOpenChange={(v) => { if (!v) { setPwdFor(null); setPwdValue(""); setPwdEmail(""); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {t("password.set")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground">
            {pwdFor?.name} — {t("password.employeeDesc")}
          </DialogDescription>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-email">{t("password.emailLabel")}</Label>
              <Input
                id="emp-email"
                type="email"
                value={pwdEmail}
                onChange={(e) => setPwdEmail(e.target.value)}
                placeholder={`employee@example.com (${t("common.optional")})`}
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("password.emailHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-pwd">{t("password.new")}</Label>
              <Input
                id="emp-pwd"
                type="text"
                value={pwdValue}
                onChange={(e) => setPwdValue(e.target.value)}
                placeholder={t("password.placeholderMin")}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPwdFor(null)} disabled={pwdLoading}>
                {t("common.cancel")}
              </Button>
              <Button className="flex-1 lavage-btn" onClick={submitPassword} disabled={pwdLoading}>
                {pwdLoading && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
