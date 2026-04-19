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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Search, Crown, Sparkles, Package, Droplets, Bike } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { getServiceName, getServiceDescription } from "@/lib/serviceI18n";

const catBadge: Record<ServiceCategory, string> = {
  standard: "bg-primary/10 text-primary border-primary/20",
  vip: "bg-warning/15 text-warning border-warning/30",
  extra: "bg-accent text-accent-foreground border-border",
  packs: "bg-success/10 text-success border-success/20",
  motor: "bg-success/10 text-success border-success/20",
};

export default function Services() {
  const { services, addService, updateService, deleteService } = useApp();
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    nameAr: "", nameFr: "", nameEn: "",
    price: "", duration: "",
    descriptionAr: "", descriptionFr: "", descriptionEn: "",
    category: "standard" as ServiceCategory, startingFrom: false,
  });
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");

  const CATEGORIES: { id: ServiceCategory | "all"; label: string; icon: any; cls: string }[] = [
    { id: "all", label: t("services.cats.all"), icon: Droplets, cls: "" },
    { id: "standard", label: t("services.cats.standard"), icon: Droplets, cls: "text-primary" },
    { id: "vip", label: t("services.cats.vip"), icon: Crown, cls: "text-warning" },
    { id: "extra", label: t("services.cats.extra"), icon: Sparkles, cls: "text-accent-foreground" },
    { id: "packs", label: t("services.cats.packs"), icon: Package, cls: "text-success" },
    { id: "motor", label: t("services.cats.motor"), icon: Bike, cls: "text-success" },
  ];

  const handleSubmit = async () => {
    if (!form.nameAr || !form.price) { toast.error(t("services.nameAndPriceRequired")); return; }
    const payload = {
      name: form.nameAr,
      nameAr: form.nameAr, nameFr: form.nameFr, nameEn: form.nameEn,
      price: Number(form.price), duration: Number(form.duration) || 0,
      description: form.descriptionAr,
      descriptionAr: form.descriptionAr, descriptionFr: form.descriptionFr, descriptionEn: form.descriptionEn,
      category: form.category, startingFrom: form.startingFrom,
    };
    if (editing) {
      await updateService(editing.id, payload);
      toast.success(t("services.serviceUpdated"));
    } else {
      await addService({ ...payload, isActive: true });
      toast.success(t("services.serviceAdded"));
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ nameAr: "", nameFr: "", nameEn: "", price: "", duration: "", descriptionAr: "", descriptionFr: "", descriptionEn: "", category: "standard", startingFrom: false });
    setEditing(null); setDialogOpen(false);
  };
  const startEdit = (s: Service) => {
    setForm({
      nameAr: s.nameAr || s.name, nameFr: s.nameFr || "", nameEn: s.nameEn || "",
      price: s.price.toString(), duration: s.duration.toString(),
      descriptionAr: s.descriptionAr || s.description || "", descriptionFr: s.descriptionFr || "", descriptionEn: s.descriptionEn || "",
      category: s.category, startingFrom: s.startingFrom,
    });
    setEditing(s); setDialogOpen(true);
  };

  const toggleActive = async (s: Service) => {
    await updateService(s.id, { isActive: !s.isActive });
    toast.success(s.isActive ? t("services.serviceDisabled") : t("services.serviceEnabled"));
  };

  const filtered = useMemo(() => services
    .filter(s => getServiceName(s, lang).toLowerCase().includes(search.toLowerCase()))
    .filter(s => tab === "all" || s.category === tab),
    [services, search, tab, lang]);

  const counts = useMemo(() => ({
    all: services.length,
    standard: services.filter(s => s.category === "standard").length,
    vip: services.filter(s => s.category === "vip").length,
    extra: services.filter(s => s.category === "extra").length,
    packs: services.filter(s => s.category === "packs").length,
    motor: services.filter(s => s.category === "motor").length,
  }), [services]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("services.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("services.subtitle")}</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl lavage-btn"><Plus className="w-4 h-4 mx-1" />{t("services.newService")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? t("services.editService") : t("services.addNew")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder={t("services.serviceName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder={t("services.priceMad")} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  <Input type="number" placeholder={t("services.durationMin")} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ServiceCategory })}>
                  <SelectTrigger><SelectValue placeholder={t("services.category")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t("services.catSelect.standard")}</SelectItem>
                    <SelectItem value="vip">{t("services.catSelect.vip")}</SelectItem>
                    <SelectItem value="extra">{t("services.catSelect.extra")}</SelectItem>
                    <SelectItem value="packs">{t("services.catSelect.packs")}</SelectItem>
                    <SelectItem value="motor">{t("services.catSelect.motor")}</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                  <span className="text-sm">{t("services.startingFromLabel")}</span>
                  <Switch checked={form.startingFrom} onCheckedChange={(v) => setForm({ ...form, startingFrom: v })} />
                </label>
                <Textarea placeholder={t("services.descOptional")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button className="w-full rounded-xl lavage-btn" onClick={handleSubmit}>
                  {editing ? t("common.saveChanges") : t("common.add")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pe-9" placeholder={t("services.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-6 w-full h-auto">
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
            <div className="lavage-card p-10 text-center text-muted-foreground">{t("services.noServices")}</div>
          ) : tab === "all" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(s => {
                const isVip = s.category === "vip";
                const isPack = s.category === "packs";
                return (
                  <div key={s.id} className={`lavage-card p-4 transition-all relative overflow-hidden ${
                      isVip ? "ring-1 ring-warning/40 bg-gradient-to-br from-warning/5 to-transparent" : ""
                    } ${isPack ? "ring-1 ring-success/40 bg-gradient-to-br from-success/5 to-transparent" : ""} ${
                      !s.isActive ? "opacity-50" : ""
                    }`}>
                    {isVip && <div className="absolute top-2 start-2"><Crown className="w-4 h-4 text-warning" /></div>}
                    {isPack && <div className="absolute top-2 start-2"><Package className="w-4 h-4 text-success" /></div>}
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
                        {s.startingFrom && <span className="text-[10px] text-muted-foreground block">{t("services.startingFrom")}</span>}
                        <span className="font-bold text-primary text-2xl">{s.price}</span>
                        <span className="text-xs text-muted-foreground mx-1">{t("common.currency")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                        ) : (
                          <Badge className={s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                            {s.isActive ? t("services.enabled") : t("services.disabled")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {s.duration > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">⏱ {s.duration} {t("common.minutes")}</div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(s)} className="flex-1">
                          <Edit className="w-3.5 h-3.5 mx-1" />{t("common.edit")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={async () => { await deleteService(s.id); toast.success(t("services.serviceDeleted")); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="lavage-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-secondary/50">
                    <TableHead className="text-muted-foreground">{t("common.reference")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("services.serviceName")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("common.price")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("common.duration")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("common.description")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("common.status")}</TableHead>
                    {isAdmin && <TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id} className={`lavage-table-row border-border ${!s.isActive ? "opacity-50" : ""}`}>
                      <TableCell className="font-mono text-xs text-primary">{s.reference || "—"}</TableCell>
                      <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                      <TableCell>
                        {s.startingFrom && <span className="text-[10px] text-muted-foreground block">{t("services.startingFrom")}</span>}
                        <span className="font-bold text-primary">{s.price}</span>
                        <span className="text-xs text-muted-foreground mx-1">{t("common.currency")}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.duration > 0 ? `${s.duration} ${t("common.minutes")}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{s.description || "—"}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                        ) : (
                          <Badge className={s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                            {s.isActive ? t("services.enabled") : t("services.disabled")}
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="lavage-glow">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={async () => { await deleteService(s.id); toast.success(t("services.serviceDeleted")); }} className="lavage-glow">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
