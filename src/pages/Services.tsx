import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type CarSize = "small" | "large" | "both";

// Detect car size from service name
const detectCarSize = (name: string): CarSize => {
  const n = name.toLowerCase();
  if (n.includes("4x4") || n.includes("grand véhicule") || n.includes("grand vehicule") || n.includes("كبير")) return "large";
  if (n.includes("standard") || n.includes("عادي") || n.includes("صغير")) return "small";
  return "both";
};

const sizeMap: Record<CarSize, { label: string; cls: string }> = {
  small: { label: "صغيرة", cls: "bg-primary/10 text-primary border-primary/20" },
  large: { label: "كبيرة", cls: "bg-warning/10 text-warning border-warning/30" },
  both: { label: "الجميع", cls: "bg-muted text-muted-foreground" },
};

export default function Services() {
  const { services, addService, updateService, deleteService } = useApp();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", description: "", carSize: "both" as CarSize });
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  const handleSubmit = async () => {
    if (!form.name || !form.price) { toast.error("الاسم والسعر مطلوبان"); return; }
    if (editing) {
      await updateService(editing.id, { name: form.name, price: Number(form.price), duration: Number(form.duration) || 0, description: form.description });
      toast.success("تم تعديل الخدمة");
    } else {
      await addService({ name: form.name, price: Number(form.price), duration: Number(form.duration) || 0, description: form.description, isActive: true });
      toast.success("تم إضافة الخدمة");
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", price: "", duration: "", description: "", carSize: "both" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (s: Service) => {
    setForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), description: s.description, carSize: detectCarSize(s.name) });
    setEditing(s); setDialogOpen(true);
  };

  const toggleActive = async (s: Service) => {
    await updateService(s.id, { isActive: !s.isActive });
    toast.success(s.isActive ? "تم تعطيل الخدمة" : "تم تفعيل الخدمة");
  };

  const filtered = services
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => sizeFilter === "all" || detectCarSize(s.name) === sizeFilter || (sizeFilter === "both" && detectCarSize(s.name) === "both"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
          <p className="text-sm text-muted-foreground">جدول شامل لجميع الخدمات والأثمنة</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl lavage-btn">
                <Plus className="w-4 h-4 ml-1" />خدمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="اسم الخدمة (مثال: غسيل عادي)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="السعر (DH)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  <Input type="number" placeholder="المدة (دقيقة)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <Textarea placeholder="الوصف (اختياري)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button className="w-full rounded-xl lavage-btn" onClick={handleSubmit}>
                  {editing ? "حفظ التعديلات" : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pr-9" placeholder="بحث عن خدمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="small">سيارة صغيرة</SelectItem>
            <SelectItem value="large">سيارة كبيرة (4x4)</SelectItem>
            <SelectItem value="both">للجميع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">المرجع</TableHead>
              <TableHead className="text-muted-foreground">الخدمة</TableHead>
              <TableHead className="text-muted-foreground">نوع السيارة</TableHead>
              <TableHead className="text-muted-foreground">الثمن</TableHead>
              <TableHead className="text-muted-foreground">المدة</TableHead>
              <TableHead className="text-muted-foreground">الحالة</TableHead>
              {isAdmin && <TableHead className="text-muted-foreground">إجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">لا توجد خدمات</TableCell></TableRow>
            ) : filtered.map((s, idx) => {
              const size = detectCarSize(s.name);
              return (
                <TableRow key={s.id} className={`lavage-table-row border-border ${!s.isActive ? "opacity-50" : ""}`}>
                  <TableCell className="text-xs font-mono text-primary font-semibold">{s.reference || "-"}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{s.name}</div>
                    {s.description && <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sizeMap[size].cls}>{sizeMap[size].label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary text-lg">{s.price}</span>
                    <span className="text-xs text-muted-foreground mr-1">DH</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.duration > 0 ? `${s.duration} د` : "-"}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                    ) : (
                      <Badge className={s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                        {s.isActive ? "مفعّلة" : "معطّلة"}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="lavage-glow">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success("تم الحذف"); }} className="lavage-glow">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
