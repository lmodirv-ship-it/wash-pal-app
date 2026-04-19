import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Employees() {
  const { employees, branches, currentBranch, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "", roleType: "employee", branchId: "" });

  const branchId = currentBranch?.id || "";
  const branchEmployees = employees.filter((e) => e.branchId === branchId);
  const branchById = new Map(branches.map((b) => [b.id, b.name]));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.role) { toast.error(t("common.fillRequired")); return; }
    const targetBranchId = form.branchId || branchId;
    if (!targetBranchId) { toast.error(t("common.fillRequired")); return; }
    if (editing) {
      await updateEmployee(editing.id, { ...form, branchId: targetBranchId });
      toast.success(t("employees.employeeUpdated"));
    } else {
      await addEmployee({ name: form.name, phone: form.phone, role: form.role, roleType: form.roleType, branchId: targetBranchId, isActive: true });
      toast.success(t("employees.employeeAdded"));
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", phone: "", role: "", roleType: "employee", branchId: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (e: Employee) => { setForm({ name: e.name, phone: e.phone, role: e.role, roleType: e.roleType, branchId: e.branchId }); setEditing(e); setDialogOpen(true); };
  const toggleActive = async (e: Employee) => { await updateEmployee(e.id, { isActive: !e.isActive }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t("employees.title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 mx-2" />{t("employees.newEmployee")}</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editing ? t("employees.editEmployee") : t("employees.addNew")}</DialogTitle></DialogHeader>
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

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">{t("common.reference")}</TableHead><TableHead className="text-muted-foreground">{t("common.name")}</TableHead><TableHead className="text-muted-foreground">{t("employees.role")}</TableHead><TableHead className="text-muted-foreground">الفرع</TableHead>
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
    </div>
  );
}
