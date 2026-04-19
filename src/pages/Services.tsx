import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Service, ServiceCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Search, Crown, Sparkles, Package, Droplets } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES: { id: ServiceCategory | "all"; label: string; icon: any; cls: string }[] = [
  { id: "all", label: "الكل", icon: Droplets, cls: "" },
  { id: "standard", label: "Standard", icon: Droplets, cls: "text-primary" },
  { id: "vip", label: "VIP", icon: Crown, cls: "text-warning" },
  { id: "extra", label: "Extra", icon: Sparkles, cls: "text-accent-foreground" },
  { id: "packs", label: "Packs", icon: Package, cls: "text-success" },
];

const catBadge: Record<ServiceCategory, string> = {
  standard: "bg-primary/10 text-primary border-primary/20",
  vip: "bg-warning/15 text-warning border-warning/30",
  extra: "bg-accent text-accent-foreground border-border",
  packs: "bg-success/10 text-success border-success/20",
};

export default function Services() {
  const { services, addService, updateService, deleteService } = useApp();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: "", price: "", duration: "", description: "",
    category: "standard" as ServiceCategory, startingFrom: false,
  });
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");

  const handleSubmit = async () => {
    if (!form.name || !form.price) { toast.error("الاسم والسعر مطلوبان"); return; }
    const payload = {
      name: form.name,
      price: Number(form.price),
      duration: Number(form.duration) || 0,
      description: form.description,
      category: form.category,
      startingFrom: form.startingFrom,
    };
    if (editing) {
      await updateService(editing.id, payload);
      toast.success("تم تعديل الخدمة");
    } else {
      await addService({ ...payload, isActive: true });
      toast.success("تم إضافة الخدمة");
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", price: "", duration: "", description: "", category: "standard", startingFrom: false });
    setEditing(null); setDialogOpen(false);
  };
  const startEdit = (s: Service) => {
    setForm({
      name: s.name, price: s.price.toString(), duration: s.duration.toString(),
      description: s.description, category: s.category, startingFrom: s.startingFrom,
    });
    setEditing(s); setDialogOpen(true);
  };

  const toggleActive = async (s: Service) => {
    await updateService(s.id, { isActive: !s.isActive });
    toast.success(s.isActive ? "تم تعطيل الخدمة" : "تم تفعيل الخدمة");
  };

  const filtered = useMemo(() => services
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => tab === "all" || s.category === tab),
    [services, search, tab]);

  const counts = useMemo(() => ({
    all: services.length,
    standard: services.filter(s => s.category === "standard").length,
    vip: services.filter(s => s.category === "vip").length,
    extra: services.filter(s => s.category === "extra").length,
    packs: services.filter(s => s.category === "packs").length,
  }), [services]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
          <p className="text-sm text-muted-foreground">قائمة الخدمات مصنّفة حسب الفئة</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl lavage-btn"><Plus className="w-4 h-4 ml-1" />خدمة جديدة</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="اسم الخدمة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="السعر (DH)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  <Input type="number" placeholder="المدة (دقيقة)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ServiceCategory })}>
                  <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard - عادية</SelectItem>
                    <SelectItem value="vip">VIP - مميزة</SelectItem>
                    <SelectItem value="extra">Extra - إضافية</SelectItem>
                    <SelectItem value="packs">Packs - باكات</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                  <span className="text-sm">سعر "ابتداءً من" (Dès)</span>
                  <Switch checked={form.startingFrom} onCheckedChange={(v) => setForm({ ...form, startingFrom: v })} />
                </label>
                <Textarea placeholder="الوصف (اختياري)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button className="w-full rounded-xl lavage-btn" onClick={handleSubmit}>
                  {editing ? "حفظ التعديلات" : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="بحث عن خدمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full h-auto">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const count = counts[c.id as keyof typeof counts];
            return (
              <TabsTrigger key={c.id} value={c.id} className="flex flex-col gap-1 py-2 data-[state=active]:shadow-glow">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${c.cls}`} />
                  <span className="font-bold">{c.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{count}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="lavage-card p-10 text-center text-muted-foreground">لا توجد خدمات في هذه الفئة</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(s => {
                const isVip = s.category === "vip";
                const isPack = s.category === "packs";
                return (
                  <div
                    key={s.id}
                    className={`lavage-card p-4 transition-all relative overflow-hidden ${
                      isVip ? "ring-1 ring-warning/40 bg-gradient-to-br from-warning/5 to-transparent" : ""
                    } ${isPack ? "ring-1 ring-success/40 bg-gradient-to-br from-success/5 to-transparent" : ""} ${
                      !s.isActive ? "opacity-50" : ""
                    }`}
                  >
                    {isVip && (
                      <div className="absolute top-2 left-2">
                        <Crown className="w-4 h-4 text-warning" />
                      </div>
                    )}
                    {isPack && (
                      <div className="absolute top-2 left-2">
                        <Package className="w-4 h-4 text-success" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-primary mb-1">{s.reference || "—"}</div>
                        <div className="font-bold text-foreground line-clamp-2">{s.name}</div>
                      </div>
                      <Badge variant="outline" className={`${catBadge[s.category]} text-[10px] shrink-0`}>
                        {s.category.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        {s.startingFrom && <span className="text-[10px] text-muted-foreground block">ابتداءً من</span>}
                        <span className="font-bold text-primary text-2xl">{s.price}</span>
                        <span className="text-xs text-muted-foreground mr-1">DH</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                        ) : (
                          <Badge className={s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                            {s.isActive ? "مفعّلة" : "معطّلة"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {s.duration > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">⏱ {s.duration} دقيقة</div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(s)} className="flex-1">
                          <Edit className="w-3.5 h-3.5 ml-1" />تعديل
                        </Button>
                        <Button variant="ghost" size="sm" onClick={async () => { await deleteService(s.id); toast.success("تم الحذف"); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
