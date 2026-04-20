import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, MessageCircle, Mail, Save, Download, Globe2, Users, CheckCircle2, Send } from "lucide-react";
import {
  buildEngagementEmailBody,
  buildEngagementEmailSubject,
  buildInviteEmailBody,
  buildInviteEmailSubject,
  buildInviteWhatsAppMessage,
  detectLang,
  gmailComposeLink,
  mailtoLink,
  whatsappLink,
} from "@/lib/leadMessages";

interface Lead {
  name: string;
  owner_name?: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  website?: string;
  notes?: string;
}

interface SavedLead extends Lead {
  id: string;
  reference: string | null;
  created_at: string;
}

const COUNTRIES = [
  { value: "all", label: "🌍 كل العالم" },
  { value: "Morocco", label: "🇲🇦 المغرب" },
  { value: "Algeria", label: "🇩🇿 الجزائر" },
  { value: "Tunisia", label: "🇹🇳 تونس" },
  { value: "Egypt", label: "🇪🇬 مصر" },
  { value: "Saudi Arabia", label: "🇸🇦 السعودية" },
  { value: "UAE", label: "🇦🇪 الإمارات" },
  { value: "France", label: "🇫🇷 فرنسا" },
  { value: "Spain", label: "🇪🇸 إسبانيا" },
  { value: "Italy", label: "🇮🇹 إيطاليا" },
  { value: "Germany", label: "🇩🇪 ألمانيا" },
  { value: "USA", label: "🇺🇸 الولايات المتحدة" },
  { value: "UK", label: "🇬🇧 بريطانيا" },
  { value: "Canada", label: "🇨🇦 كندا" },
  { value: "Turkey", label: "🇹🇷 تركيا" },
];

export default function AdminLeads() {
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("");
  const [count, setCount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<SavedLead[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const loadSaved = async () => {
    setSavedLoading(true);
    const { data, error } = await supabase
      .from("b2b_partners")
      .select("id, name, owner_name, email, whatsapp, phone, city, country, address, website, reference, created_at")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast({ title: "خطأ في تحميل المحفوظات", description: error.message, variant: "destructive" });
    else setSaved((data as any) || []);
    setSavedLoading(false);
  };

  useEffect(() => { loadSaved(); }, []);

  const generate = async () => {
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("generate-leads", {
        body: {
          country: country === "all" ? undefined : country,
          city: city.trim() || undefined,
          count: parseInt(count),
        },
      });
      if (error) throw error;
      const leads: Lead[] = data?.leads || [];
      if (leads.length === 0) toast({ title: "لم يتم العثور على نتائج", description: "جرب بلد أو مدينة أخرى" });
      else toast({ title: `✨ تم توليد ${leads.length} محل`, description: "راجع النتائج وأرسل الدعوات" });
      setResults(leads);
      // pre-select all
      setSelected(new Set(leads.map((_, i) => i)));
    } catch (e: any) {
      toast({ title: "فشل التوليد", description: e?.message || "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  const saveSelected = async () => {
    const toSave = results.filter((_, i) => selected.has(i));
    if (toSave.length === 0) return toast({ title: "لم تختر شيئاً" });

    // Filter duplicates by email
    const emails = toSave.map((l) => l.email).filter(Boolean);
    let existing: string[] = [];
    if (emails.length) {
      const { data } = await supabase.from("b2b_partners").select("email").in("email", emails as string[]);
      existing = (data || []).map((d: any) => (d.email || "").toLowerCase());
    }

    const rows = toSave
      .filter((l) => !l.email || !existing.includes(l.email.toLowerCase()))
      .map((l) => ({
        name: l.name,
        owner_name: l.owner_name || l.name,
        email: l.email || null,
        whatsapp: l.whatsapp || null,
        phone: l.phone || l.whatsapp || "",
        city: l.city || "",
        country: l.country || null,
        address: l.address || l.city || "",
        website: l.website || null,
        notes: l.notes || null,
        source: "ai_generated",
        package_name: "basic",
        total_points: 100,
      }));

    if (rows.length === 0) return toast({ title: "كل المحلات المختارة محفوظة مسبقاً" });

    const { error } = await supabase.from("b2b_partners").insert(rows);
    if (error) toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
    else {
      toast({ title: `✅ تم حفظ ${rows.length} محل في قاعدة البيانات` });
      loadSaved();
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ["Name", "Owner", "Country", "City", "Email", "WhatsApp", "Phone", "Website", "Address"];
    const rows = results.map((l) =>
      [l.name, l.owner_name, l.country, l.city, l.email, l.whatsapp, l.phone, l.website, l.address]
        .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendWhatsApp = (lead: Lead) => {
    const phone = lead.whatsapp || lead.phone;
    if (!phone) return toast({ title: "لا يوجد رقم واتساب", variant: "destructive" });
    const lang = detectLang(lead.country);
    const msg = buildInviteWhatsAppMessage(lead, lang);
    window.open(whatsappLink(phone, msg), "_blank");
  };

  const sendEmail = (lead: Lead) => {
    if (!lead.email) return toast({ title: "لا يوجد إيميل", variant: "destructive" });
    const lang = detectLang(lead.country);
    window.location.href = mailtoLink(lead.email, buildInviteEmailSubject(lead, lang), buildInviteEmailBody(lead, lang));
  };

  // Opens Gmail compose (Mailbutler workflow) with persuasive engagement message
  const sendEngagement = (lead: Lead) => {
    if (!lead.email) return toast({ title: "لا يوجد إيميل", variant: "destructive" });
    const lang = detectLang(lead.country);
    const subject = buildEngagementEmailSubject(lead, lang);
    const body = buildEngagementEmailBody(lead, lang);
    window.open(gmailComposeLink(lead.email, subject, body), "_blank");
    toast({ title: "✉️ تم فتح Gmail / Mailbutler", description: `رسالة تشجيعية جاهزة لـ ${lead.name}` });
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background via-background to-muted/30" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary-glow flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.5)] ring-2 ring-primary/30">
            <Globe2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary-glow to-accent bg-clip-text text-transparent">
              توليد عملاء ذكي
            </h1>
            <p className="text-sm text-muted-foreground mt-1">اكتشف محلات غسيل السيارات حول العالم وادعهم للمنصة 🌍</p>
          </div>
        </div>
        <Badge className="bg-success/15 text-success border-success/30 px-4 py-2 text-sm font-semibold shadow-[0_0_20px_hsl(var(--success)/0.3)]">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-2" /> AI نشط
        </Badge>
      </div>

      {/* Stats — Premium gradient KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-info/20 bg-gradient-to-br from-info/10 via-card to-card hover:shadow-[0_0_30px_hsl(var(--info)/0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-info/10 rounded-full blur-3xl group-hover:bg-info/20 transition-all" />
          <CardContent className="p-5 flex items-center justify-between relative">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">محلات محفوظة</p>
              <p className="text-4xl font-bold mt-2 bg-gradient-to-br from-info to-info/70 bg-clip-text text-transparent">{saved.length}</p>
              <p className="text-xs text-muted-foreground mt-1">في قاعدة البيانات</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-info/20 to-info/5 ring-1 ring-info/30 shadow-[0_0_20px_hsl(var(--info)/0.3)]">
              <Users className="w-7 h-7 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/10 via-card to-card hover:shadow-[0_0_30px_hsl(var(--success)/0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl group-hover:bg-success/20 transition-all" />
          <CardContent className="p-5 flex items-center justify-between relative">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">نتائج هذه الجلسة</p>
              <p className="text-4xl font-bold mt-2 bg-gradient-to-br from-success to-success/70 bg-clip-text text-transparent">{results.length}</p>
              <p className="text-xs text-muted-foreground mt-1">جاهزة للمراجعة</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 ring-1 ring-success/30 shadow-[0_0_20px_hsl(var(--success)/0.3)]">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-warning/20 bg-gradient-to-br from-warning/10 via-card to-card hover:shadow-[0_0_30px_hsl(var(--warning)/0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl group-hover:bg-warning/20 transition-all" />
          <CardContent className="p-5 flex items-center justify-between relative">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">المحدد للحفظ</p>
              <p className="text-4xl font-bold mt-2 bg-gradient-to-br from-warning to-warning/70 bg-clip-text text-transparent">{selected.size}</p>
              <p className="text-xs text-muted-foreground mt-1">من أصل {results.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 ring-1 ring-warning/30 shadow-[0_0_20px_hsl(var(--warning)/0.3)]">
              <Sparkles className="w-7 h-7 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation form */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
            🌍 توليد جديد بالذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">البلد</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-background/50 border-border/60 hover:border-primary/40 transition-colors h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">المدينة (اختياري)</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca, Paris..." className="h-11 bg-background/50 border-border/60 hover:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">عدد المحلات</label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger className="bg-background/50 border-border/60 hover:border-primary/40 transition-colors h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={generate}
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary via-accent to-primary-glow hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] text-primary-foreground font-bold transition-all duration-300 hover:scale-[1.02]"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري البحث...</> : <><Sparkles className="w-4 h-4 ml-2" /> توليد ذكي</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="border-success/20 bg-gradient-to-br from-card via-card to-success/5 shadow-[0_0_40px_hsl(var(--success)/0.1)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="w-1 h-6 bg-gradient-to-b from-success to-accent rounded-full" />
              ✨ النتائج
              <Badge className="bg-success/15 text-success border-success/30 mr-2">{results.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={saveSelected} size="sm" className="bg-gradient-to-r from-success to-success/80 hover:shadow-[0_0_20px_hsl(var(--success)/0.4)] text-success-foreground font-semibold">
                <Save className="w-4 h-4 ml-1" /> حفظ المحدد ({selected.size})
              </Button>
              <Button onClick={exportCSV} variant="outline" size="sm" className="border-info/40 text-info hover:bg-info/10 hover:border-info">
                <Download className="w-4 h-4 ml-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent bg-muted/20">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-bold text-foreground">الاسم</TableHead>
                  <TableHead className="font-bold text-foreground">المالك</TableHead>
                  <TableHead className="font-bold text-foreground">البلد / المدينة</TableHead>
                  <TableHead className="font-bold text-foreground">الإيميل</TableHead>
                  <TableHead className="font-bold text-foreground">واتساب / هاتف</TableHead>
                  <TableHead className="font-bold text-foreground">موقع</TableHead>
                  <TableHead className="font-bold text-foreground text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((l, i) => (
                  <TableRow key={i} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                    <TableCell><Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} /></TableCell>
                    <TableCell className="font-semibold text-foreground">{l.name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.owner_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-info/10 text-info border-info/30 text-xs">
                        {l.country} {l.city ? `• ${l.city}` : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">{l.email || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">{l.whatsapp || l.phone || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {l.website ? <a href={l.website} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-glow underline underline-offset-2">رابط ↗</a> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 justify-center">
                        <Button size="icon" variant="outline" onClick={() => sendWhatsApp(l)} title="واتساب" className="h-8 w-8 border-success/40 hover:bg-success/15 hover:border-success hover:shadow-[0_0_12px_hsl(var(--success)/0.4)] transition-all">
                          <MessageCircle className="w-4 h-4 text-success" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => sendEmail(l)} title="إيميل دعوة" className="h-8 w-8 border-info/40 hover:bg-info/15 hover:border-info hover:shadow-[0_0_12px_hsl(var(--info)/0.4)] transition-all">
                          <Mail className="w-4 h-4 text-info" />
                        </Button>
                        <Button size="icon" onClick={() => sendEngagement(l)} title="رسالة تشجيعية عبر Mailbutler / Gmail" className="h-8 w-8 bg-gradient-to-br from-primary to-accent hover:shadow-[0_0_12px_hsl(var(--primary)/0.6)] transition-all">
                          <Send className="w-4 h-4 text-primary-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Saved leads */}
      <Card className="border-info/20 bg-gradient-to-br from-card via-card to-info/5 shadow-[0_0_40px_hsl(var(--info)/0.1)]">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="w-1 h-6 bg-gradient-to-b from-info to-primary rounded-full" />
            📚 المحلات المحفوظة (AI)
            <Badge className="bg-info/15 text-info border-info/30 mr-2">{saved.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {savedLoading ? (
            <div className="py-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : saved.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">لا توجد محلات محفوظة بعد</p>
              <p className="text-xs text-muted-foreground/70 mt-1">ابدأ بتوليد عملاء جدد من الأعلى</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent bg-muted/20">
                  <TableHead className="font-bold text-foreground">المرجع</TableHead>
                  <TableHead className="font-bold text-foreground">الاسم</TableHead>
                  <TableHead className="font-bold text-foreground">البلد</TableHead>
                  <TableHead className="font-bold text-foreground">المدينة</TableHead>
                  <TableHead className="font-bold text-foreground">الإيميل</TableHead>
                  <TableHead className="font-bold text-foreground">واتساب</TableHead>
                  <TableHead className="font-bold text-foreground text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saved.map((l) => (
                  <TableRow key={l.id} className="border-b border-border/30 hover:bg-info/5 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">{l.reference || "—"}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{l.name}</TableCell>
                    <TableCell>
                      {l.country ? <Badge variant="outline" className="bg-info/10 text-info border-info/30 text-xs">{l.country}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.city || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">{l.email || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">{l.whatsapp || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 justify-center">
                        <Button size="icon" variant="outline" onClick={() => sendWhatsApp(l)} title="واتساب" className="h-8 w-8 border-success/40 hover:bg-success/15 hover:border-success hover:shadow-[0_0_12px_hsl(var(--success)/0.4)] transition-all">
                          <MessageCircle className="w-4 h-4 text-success" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => sendEmail(l)} title="إيميل دعوة" className="h-8 w-8 border-info/40 hover:bg-info/15 hover:border-info hover:shadow-[0_0_12px_hsl(var(--info)/0.4)] transition-all">
                          <Mail className="w-4 h-4 text-info" />
                        </Button>
                        <Button size="icon" onClick={() => sendEngagement(l)} title="رسالة تشجيعية عبر Mailbutler / Gmail" className="h-8 w-8 bg-gradient-to-br from-primary to-accent hover:shadow-[0_0_12px_hsl(var(--primary)/0.6)] transition-all">
                          <Send className="w-4 h-4 text-primary-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
