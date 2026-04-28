import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getServiceName } from "@/lib/serviceI18n";

type Appt = {
  id: string;
  reference: string | null;
  customer_name: string;
  customer_phone: string | null;
  car_type: string | null;
  car_plate: string | null;
  services: string[];
  total_price: number;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map((m) => `${String(h).padStart(2, "0")}:${m}`)
).flat();

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const { services, currentBranch, currentShopId } = useApp();
  const dateLocale = i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : undefined;
  const [list, setList] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carType, setCarType] = useState("");
  const [carPlate, setCarPlate] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services]);
  const total = useMemo(
    () => activeServices.filter((s) => picked.includes(s.id)).reduce((sum, s) => sum + Number(s.price), 0),
    [activeServices, picked]
  );
  const duration = useMemo(
    () => activeServices.filter((s) => picked.includes(s.id)).reduce((sum, s) => sum + Number(s.duration || 30), 0) || 30,
    [activeServices, picked]
  );

  const load = async () => {
    if (!currentShopId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("shop_id", currentShopId)
      .order("scheduled_at", { ascending: true });
    if (error) toast.error(error.message);
    setList((data as Appt[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentShopId]);

  useEffect(() => {
    if (!currentShopId) return;
    const ch = supabase.channel(`appts-${currentShopId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `shop_id=eq.${currentShopId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentShopId]);

  const reset = () => {
    setName(""); setPhone(""); setCarType(""); setCarPlate("");
    setPicked([]); setDate(new Date()); setTime("10:00"); setNotes("");
  };

  const submit = async () => {
    if (!currentShopId || !currentBranch) { toast.error(t("common.error")); return; }
    if (!name.trim()) { toast.error("اسم الزبون مطلوب"); return; }
    if (!date) { toast.error("اختر التاريخ"); return; }
    if (picked.length === 0) { toast.error("اختر خدمة واحدة على الأقل"); return; }

    const [h, m] = time.split(":").map(Number);
    const scheduled = new Date(date);
    scheduled.setHours(h, m, 0, 0);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("appointments").insert({
      shop_id: currentShopId,
      branch_id: currentBranch.id,
      customer_name: name.trim(),
      customer_phone: phone.trim() || null,
      car_type: carType.trim() || null,
      car_plate: carPlate.trim() || null,
      services: picked,
      total_price: total,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: duration,
      status: "scheduled",
      notes: notes.trim() || null,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم حجز الموعد ✓");
    reset(); setOpen(false); load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم التحديث");
  };

  const remove = async (id: string) => {
    if (!confirm("هل تريد حذف الموعد؟")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم الحذف");
  };

  const filtered = useMemo(() => {
    if (!filterDate) return list;
    const d = format(filterDate, "yyyy-MM-dd");
    return list.filter((a) => format(new Date(a.scheduled_at), "yyyy-MM-dd") === d);
  }, [list, filterDate]);

  const statusBadge = (s: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      scheduled: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "مجدول" },
      confirmed: { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "مؤكد" },
      completed: { cls: "bg-green-500/15 text-green-400 border-green-500/30", label: "منجز" },
      cancelled: { cls: "bg-red-500/15 text-red-400 border-red-500/30", label: "ملغى" },
    };
    const v = map[s] || map.scheduled;
    return <Badge variant="outline" className={v.cls}>{v.label}</Badge>;
  };

  const serviceNames = (ids: string[]) =>
    ids.map((id) => {
      const s = services.find((x) => x.id === id);
      return s ? getServiceName(s, i18n.language) : id.slice(0, 6);
    }).join("، ");

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">📅 حجز المواعيد</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة مواعيد غسيل السيارات بالتاريخ والوقت</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("gap-2", !filterDate && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4" />
                {filterDate ? format(filterDate, "PPP", { locale: dateLocale }) : "كل التواريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} className={cn("p-3 pointer-events-auto")} />
              <div className="p-2 border-t flex justify-between">
                <Button size="sm" variant="ghost" onClick={() => setFilterDate(undefined)}>مسح</Button>
                <Button size="sm" variant="ghost" onClick={() => setFilterDate(new Date())}>اليوم</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> حجز جديد
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">جاري التحميل...</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">لا توجد مواعيد {filterDate ? "في هذا اليوم" : ""}</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => {
            const dt = new Date(a.scheduled_at);
            return (
              <Card key={a.id} className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-xl p-3 min-w-[88px] border border-primary/30">
                  <div className="text-xs">{format(dt, "EEE d MMM", { locale: dateLocale })}</div>
                  <div className="text-lg font-bold tabular-nums flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {format(dt, "HH:mm")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{a.duration_minutes} د</div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{a.customer_name}</span>
                    {a.reference && <span className="text-xs text-muted-foreground">#{a.reference}</span>}
                    {statusBadge(a.status)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {a.car_plate && <>🚗 {a.car_plate} {a.car_type && `· ${a.car_type}`} · </>}
                    {a.customer_phone && <>📞 {a.customer_phone}</>}
                  </div>
                  <div className="text-sm mt-1">{serviceNames(a.services)}</div>
                  {a.notes && <div className="text-xs text-muted-foreground mt-1 italic">📝 {a.notes}</div>}
                </div>
                <div className="text-end">
                  <div className="text-lg font-bold text-primary">{a.total_price} {t("common.currency", { defaultValue: "MAD" })}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">مجدول</SelectItem>
                      <SelectItem value="confirmed">مؤكد</SelectItem>
                      <SelectItem value="completed">منجز</SelectItem>
                      <SelectItem value="cancelled">ملغى</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {a.status !== "completed" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(a.id, "completed")}>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    {a.status !== "cancelled" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(a.id, "cancelled")}>
                        <XCircle className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(a.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>📅 حجز موعد جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>اسم الزبون *</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
              <div><Label>الهاتف</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
              <div><Label>نوع السيارة</Label><Input value={carType} onChange={(e) => setCarType(e.target.value)} maxLength={50} /></div>
              <div><Label>اللوحة</Label><Input value={carPlate} onChange={(e) => setCarPlate(e.target.value)} maxLength={20} /></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>التاريخ *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start gap-2", !date && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4" />
                      {date ? format(date, "PPP", { locale: dateLocale }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} className={cn("p-3 pointer-events-auto")} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>الوقت *</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>الخدمات *</Label>
              <div className="grid grid-cols-2 gap-2 mt-1 max-h-48 overflow-y-auto">
                {activeServices.map((s) => {
                  const sel = picked.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPicked((p) => sel ? p.filter((x) => x !== s.id) : [...p, s.id])}
                      className={cn("p-2 rounded-lg border-2 text-start text-xs transition-all",
                        sel ? "border-primary bg-primary/10" : "border-border hover:border-primary/40")}
                    >
                      <div className="font-bold truncate">{getServiceName(s, i18n.language)}</div>
                      <div className="text-muted-foreground">{s.price} · {s.duration}د</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">المدة: {duration} د</span>
              <span className="text-2xl font-bold text-primary">{total} {t("common.currency", { defaultValue: "MAD" })}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>إلغاء</Button>
            <Button onClick={submit}>تأكيد الحجز</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
