import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { B2BPartner } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Store, Search } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const PACKAGES = [
  { name: "basic", points: 100 },
  { name: "standard", points: 200 },
  { name: "premium", points: 500 },
  { name: "enterprise", points: 1000 },
];

export default function Shops() {
  const { shops, addShop, updateShop, deleteShop } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-FR";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<B2BPartner | null>(null);
  const [form, setForm] = useState({
    name: "", ownerName: "", address: "", city: "", phone: "", email: "",
    packageName: "basic", totalPoints: 100, usedPoints: 0, expiryDays: 30, notes: "",
  });

  const pkgLabel = (name: string) => t(`shops.pkgs.${name}` as any) || name;

  const getExpiryColor = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { bg: "bg-destructive text-destructive-foreground", label: t("shops.expiredLabel") };
    if (daysLeft <= 7) return { bg: "bg-destructive/80 text-destructive-foreground", label: `${daysLeft} ${t("common.days")}` };
    if (daysLeft <= 15) return { bg: "bg-warning text-warning-foreground", label: `${daysLeft} ${t("common.days")}` };
    return { bg: "bg-success text-success-foreground", label: `${daysLeft} ${t("common.days")}` };
  };

  const filtered = shops.filter((s) =>
    s.name.includes(search) || s.phone.includes(search) || s.reference?.includes(search) || s.ownerName.includes(search)
  );

  const handleSubmit = async () => {
    if (!form.name || !form.ownerName || !form.address || !form.phone) {
      toast.error(t("common.fillRequired")); return;
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + form.expiryDays);

    if (editing) {
      await updateShop(editing.id, {
        name: form.name, ownerName: form.ownerName, address: form.address,
        city: form.city, phone: form.phone, email: form.email,
        packageName: form.packageName, totalPoints: form.totalPoints,
        usedPoints: form.usedPoints, expiryDate: expiryDate.toISOString(), notes: form.notes,
      });
      toast.success(t("shops.shopUpdated"));
    } else {
      await addShop({
        name: form.name, ownerName: form.ownerName, address: form.address,
        city: form.city, phone: form.phone, email: form.email,
        registrationDate: new Date().toISOString(),
        packageName: form.packageName, totalPoints: form.totalPoints,
        usedPoints: 0, expiryDate: expiryDate.toISOString(),
        isActive: true, notes: form.notes,
      });
      toast.success(t("shops.shopAdded"));
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
          <h1 className="text-2xl font-bold text-foreground">{t("shops.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("shops.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 mx-2" />{t("shops.newShop")}</Button></DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle>{editing ? t("shops.editShop") : t("shops.addNew")}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pe-2">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("shops.shopName")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <Input placeholder={t("shops.ownerName")} value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("common.address")} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                <Input placeholder={t("shops.city")} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                <Input placeholder={`${t("common.email")} (${t("common.optional")})`} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-foreground">{t("shops.package")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {PACKAGES.map((pkg) => (
                    <Button key={pkg.name} variant={form.packageName === pkg.name ? "default" : "outline"} size="sm"
                      onClick={() => setForm((f) => ({ ...f, packageName: pkg.name, totalPoints: pkg.points }))} className="lavage-glow">
                      {pkgLabel(pkg.name)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">{t("shops.pointsCount")}</label>
                  <Input type="number" value={form.totalPoints} onChange={(e) => setForm((f) => ({ ...f, totalPoints: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("shops.subscriptionDays")}</label>
                  <Input type="number" value={form.expiryDays} onChange={(e) => setForm((f) => ({ ...f, expiryDays: Number(e.target.value) }))} />
                </div>
              </div>
              <Textarea placeholder={`${t("common.notes")} (${t("common.optional")})`} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full lavage-btn" onClick={handleSubmit}>{editing ? t("common.saveChanges") : t("shops.addShop")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="lavage-card p-4 text-center"><p className="text-3xl font-bold text-primary">{shops.length}</p><p className="text-xs text-muted-foreground">{t("shops.total")}</p></div>
        <div className="lavage-card p-4 text-center"><p className="text-3xl font-bold text-success">{shops.filter((s) => s.isActive).length}</p><p className="text-xs text-muted-foreground">{t("shops.activeShops")}</p></div>
        <div className="lavage-card p-4 text-center"><p className="text-3xl font-bold text-warning">{shops.filter((s) => { const d = Math.ceil((new Date(s.expiryDate).getTime() - Date.now()) / 86400000); return d > 0 && d <= 7; }).length}</p><p className="text-xs text-muted-foreground">{t("shops.expiringSoon")}</p></div>
        <div className="lavage-card p-4 text-center"><p className="text-3xl font-bold text-destructive">{shops.filter((s) => new Date(s.expiryDate) < new Date()).length}</p><p className="text-xs text-muted-foreground">{t("shops.expired")}</p></div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pe-9" placeholder={t("shops.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="lavage-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">{t("common.reference")}</TableHead>
              <TableHead className="text-muted-foreground">{t("shops.shopName")}</TableHead>
              <TableHead className="text-muted-foreground">{t("shops.owner")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.address")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.phone")}</TableHead>
              <TableHead className="text-muted-foreground">{t("shops.package")}</TableHead>
              <TableHead className="text-muted-foreground">{t("shops.points")}</TableHead>
              <TableHead className="text-muted-foreground">{t("shops.regDate")}</TableHead>
              <TableHead className="text-muted-foreground">{t("shops.lastDate")}</TableHead>
              <TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border"><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
                {t("shops.noShops")}
              </TableCell></TableRow>
            ) : filtered.map((s) => {
              const expiry = getExpiryColor(s.expiryDate);
              return (
                <TableRow key={s.id} className="lavage-table-row border-border">
                  <TableCell className="font-mono text-xs text-foreground">{s.reference || "-"}</TableCell>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="text-foreground">{s.ownerName}</TableCell>
                  <TableCell><span className="text-xs text-foreground">{s.address}{s.city ? ` - ${s.city}` : ""}</span></TableCell>
                  <TableCell className="text-foreground">{s.phone}</TableCell>
                  <TableCell><Badge variant="secondary">{pkgLabel(s.packageName)}</Badge></TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span className="font-bold text-foreground">{s.remainingPoints}</span>
                      <span className="text-xs text-muted-foreground">/{s.totalPoints}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.registrationDate).toLocaleDateString(locale)}</TableCell>
                  <TableCell>
                    <Badge className={expiry.bg}>{expiry.label}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(s.expiryDate).toLocaleDateString(locale)}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await deleteShop(s.id); toast.success(t("shops.shopDeleted")); }} className="lavage-glow">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
