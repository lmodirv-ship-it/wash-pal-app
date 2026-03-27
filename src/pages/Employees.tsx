import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Employee } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function Employees() {
  const { employees, currentBranch, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "", roleType: "employee" });

  const branchId = currentBranch?.id || "";
  const branchEmployees = employees.filter((e) => e.branchId === branchId);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.role) { toast.error("يرجى ملء جميع الحقول"); return; }
    if (editing) {
      await updateEmployee(editing.id, form);
      toast.success("تم تعديل بيانات الموظف");
    } else {
      await addEmployee({ ...form, branchId, isActive: true, roleType: form.roleType });
      toast.success("تم إضافة الموظف");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", phone: "", role: "", roleType: "employee" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (e: Employee) => { setForm({ name: e.name, phone: e.phone, role: e.role, roleType: e.roleType }); setEditing(e); setDialogOpen(true); };

  const toggleActive = async (e: Employee) => { await updateEmployee(e.id, { isActive: !e.isActive }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />موظف جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "تعديل الموظف" : "إضافة موظف جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="الاسم" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="الوظيفة (مثل: غاسل، مشرف)" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              <Select value={form.roleType} onValueChange={(v) => setForm((f) => ({ ...f, roleType: v }))}>
                <SelectTrigger><SelectValue placeholder="الصلاحية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="employee">موظف</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleSubmit}>{editing ? "حفظ" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المرجع</TableHead><TableHead>الاسم</TableHead><TableHead>الصلاحية</TableHead>
                <TableHead>الوظيفة</TableHead><TableHead>الهاتف</TableHead><TableHead>تاريخ البداية</TableHead>
                <TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchEmployees.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا يوجد موظفين</TableCell></TableRow>
              ) : branchEmployees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.reference || "-"}</TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell><Badge variant="secondary">{e.roleType === 'admin' ? 'مدير' : 'موظف'}</Badge></TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell>{e.phone}</TableCell>
                  <TableCell className="text-xs">{new Date(e.hireDate).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <Badge className={e.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"} onClick={() => toggleActive(e)} style={{ cursor: "pointer" }}>
                      {e.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(e)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await deleteEmployee(e.id); toast.success("تم حذف الموظف"); }}>
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
