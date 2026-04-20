import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Globe2, Phone, Mail, MessageCircle, Loader2, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import {
  whatsappLink, gmailComposeLink, mailbutlerComposeLink,
  buildInviteWhatsAppMessage, buildEngagementEmailSubject, buildEngagementEmailBody,
} from "@/lib/leadMessages";

const STATUSES = [
  { value: "new", label: "جديد", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "contacted", label: "تم التواصل", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "interested", label: "مهتم", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "not_interested", label: "غير مهتم", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  { value: "partner", label: "شريك", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
];

const CATEGORIES = [
  { value: "carwash", label: "كارواش" },
  { value: "restaurant", label: "مطاعم" },
  { value: "cafe", label: "مقاهي" },
  { value: "pharmacy", label: "صيدليات" },
  { value: "grocery", label: "محلات تجارية" },
  { value: "delivery", label: "خدمات توصيل" },
];

interface Lead {
  id: string;
  name: string;
  city: string;
  phone: string;
  email: string | null;
  whatsapp: string | null;
  website: string | null;
  prospecting_status: string;
  category: string | null;
  country: string | null;
}

export default function SupervisorProspecting() {
  const { currentShopId } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("carwash");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("b2b_partners")
      .select("id,name,city,phone,email,whatsapp,website,prospecting_status,category,country")
      .order("created_at", { ascending: false })
      .limit(500);
    setLeads((data || []) as Lead[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const by = (s: string) => leads.filter(l => l.prospecting_status === s).length;
    return {
      total: leads.length,
      withPhone: leads.filter(l => l.phone).length,
      withEmail: leads.filter(l => l.email).length,
      partners: by("partner"),
      contacted: by("contacted"),
      interested: by("interested"),
      new: by("new"),
      notInterested: by("not_interested"),
    };
  }, [leads]);

  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { if (l.category) counts[l.category] = (counts[l.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [leads]);

  const filtered = filterStatus === "all" ? leads : leads.filter(l => l.prospecting_status === filterStatus);

  const runProspecting = async () => {
    if (!city.trim()) {
      toast.error("أدخل اسم المدينة");
      return;
    }
    setSearching(true);
    try {
      const { error } = await supabase.functions.invoke("generate-leads", {
        body: { city: city.trim(), category, count: 20 },
      });
      if (error) throw error;
      toast.success("تم التنقيب بنجاح");
      await load();
    } catch (e: any) {
      toast.error(e.message || "فشل التنقيب");
    } finally {
      setSearching(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("b2b_partners").update({ prospecting_status: status }).eq("id", id);
    if (error) { toast.error("فشل التحديث"); return; }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, prospecting_status: status } : l));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Globe2 className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">🔍 التنقيب عن الشركاء</h1>
          <p className="text-sm text-muted-foreground">ابحث عن محلات ومطاعم في مدينتك وتواصل معهم تلقائياً</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="إجمالي المحفوظات" value={stats.total} grad="from-violet-500/20 to-violet-500/5" />
        <KPI label="لديهم هاتف" value={stats.withPhone} grad="from-blue-500/20 to-blue-500/5" />
        <KPI label="لديهم إيميل" value={stats.withEmail} grad="from-amber-500/20 to-amber-500/5" />
        <KPI label="تم التحويل لشريك" value={stats.partners} grad="from-emerald-500/20 to-emerald-500/5" />
      </div>

      {/* Status bar */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-3">توزيع الحالات</p>
        <div className="flex flex-wrap gap-2">
          <StatusChip label="الكل" count={stats.total} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
          {STATUSES.map(s => (
            <StatusChip key={s.value} label={s.label} count={leads.filter(l => l.prospecting_status === s.value).length}
              active={filterStatus === s.value} onClick={() => setFilterStatus(s.value)} className={s.color} />
          ))}
        </div>
        {topCategories.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mt-4 mb-2">أعلى الفئات</p>
            <div className="flex flex-wrap gap-2">
              {topCategories.map(([cat, n]) => (
                <Badge key={cat} variant="outline" className="bg-muted/30">
                  {CATEGORIES.find(c => c.value === cat)?.label || cat} · {n}
                </Badge>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Search */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">تشغيل التنقيب التلقائي</p>
        <div className="grid md:grid-cols-4 gap-2">
          <Input placeholder="المدينة (مثل: طنجة)" value={city} onChange={e => setCity(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="md:col-span-2">
            <Button onClick={runProspecting} disabled={searching} className="w-full gap-2">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "جاري البحث..." : "ابحث وأضف للقاعدة"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">النتائج ({filtered.length})</p>
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Globe2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            ابحث عن المحلات والمطاعم وخدمات التوصيل في مدينتك
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => {
              const statusObj = STATUSES.find(s => s.value === l.prospecting_status);
              const leadObj = { name: l.name, country: l.country };
              const waMsg = buildInviteWhatsAppMessage(leadObj);
              const emailSubject = buildEngagementEmailSubject(leadObj);
              const emailBody = buildEngagementEmailBody(leadObj);
              return (
                <div key={l.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.city} · {l.phone}</p>
                  </div>
                  <Select value={l.prospecting_status} onValueChange={v => updateStatus(l.id, v)}>
                    <SelectTrigger className={`w-32 h-8 text-xs ${statusObj?.color || ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {l.whatsapp && (
                      <Button asChild size="icon" variant="outline" className="h-8 w-8" title="واتساب">
                        <a href={whatsappLink(l.whatsapp, msg.body)} target="_blank" rel="noopener"><MessageCircle className="w-4 h-4 text-emerald-500" /></a>
                      </Button>
                    )}
                    {l.email && (
                      <>
                        <Button asChild size="icon" variant="outline" className="h-8 w-8" title="Gmail">
                          <a href={gmailComposeLink(l.email, msg.subject, msg.body)} target="_blank" rel="noopener"><Mail className="w-4 h-4 text-rose-500" /></a>
                        </Button>
                        <Button asChild size="icon" variant="outline" className="h-8 w-8 bg-gradient-to-r from-orange-500/20 to-amber-500/10" title="Mailbutler">
                          <a href={mailbutlerComposeLink(l.email, msg.subject, msg.body)} target="_blank" rel="noopener"><MailPlus className="w-4 h-4 text-amber-500" /></a>
                        </Button>
                      </>
                    )}
                    {l.phone && (
                      <Button asChild size="icon" variant="outline" className="h-8 w-8" title="اتصال">
                        <a href={`tel:${l.phone}`}><Phone className="w-4 h-4 text-blue-500" /></a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function KPI({ label, value, grad }: { label: string; value: number; grad: string }) {
  return (
    <Card className={`p-4 bg-gradient-to-br ${grad} border-border/50`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </Card>
  );
}

function StatusChip({ label, count, active, onClick, className = "" }: { label: string; count: number; active: boolean; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${active ? "ring-2 ring-primary " : ""}${className || "bg-muted/40 border-border"}`}>
      {label} · {count}
    </button>
  );
}
