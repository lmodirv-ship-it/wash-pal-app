import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Branch } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Building2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Branches() {
  const { branches, currentBranch, setCurrentBranch, addBranch, updateBranch, deleteBranch } = useApp();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.phone) { toast.error(t("common.fillRequired")); return; }
    if (editing) {
      await updateBranch(editing.id, form);
      if (currentBranch?.id === editing.id) setCurrentBranch({ ...currentBranch, ...form });
      toast.success(t("branches.branchUpdated"));
    } else {
      await addBranch({ ...form, isActive: true });
      toast.success(t("branches.branchAdded"));
    }
    resetForm();
  };

  const resetForm = () => { setForm({ name: "", address: "", phone: "" }); setEditing(null); setDialogOpen(false); };
  const startEdit = (b: Branch) => { setForm({ name: b.name, address: b.address, phone: b.phone }); setEditing(b); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t("branches.title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild><Button className="lavage-btn"><Plus className="w-4 h-4 mx-2" />{t("branches.newBranch")}</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editing ? t("branches.editBranch") : t("branches.addNew")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("branches.branchName")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder={t("common.address")} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              <Input placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Button className="w-full lavage-btn" onClick={handleSubmit}>{editing ? t("common.save") : t("common.add")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b.id} className={`lavage-card p-5 ${b.id === currentBranch?.id ? "ring-2 ring-primary shadow-[0_0_25px_hsl(var(--primary)/0.2)]" : ""}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{b.name}</h3>
                {b.id === currentBranch?.id && <Badge className="bg-primary text-primary-foreground text-xs">{t("common.currentBranch")}</Badge>}
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{b.address}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{b.phone}</div>
            </div>
            <div className="flex gap-2 mt-4">
              {b.id !== currentBranch?.id && (
                <Button variant="outline" size="sm" onClick={() => { setCurrentBranch(b); toast.success(`${t("branches.switchedTo")} ${b.name}`); }} className="lavage-glow">{t("branches.switch")}</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => startEdit(b)} className="lavage-glow"><Edit className="w-4 h-4" /></Button>
              {branches.length > 1 && b.id !== currentBranch?.id && (
                <Button variant="ghost" size="icon" onClick={async () => { await deleteBranch(b.id); toast.success(t("branches.branchDeleted")); }} className="lavage-glow">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
