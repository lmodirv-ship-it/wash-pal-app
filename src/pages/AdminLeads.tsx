import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe2 className="w-8 h-8 text-primary" />
            توليد عملاء ذكي
          </h1>
          <p className="text-muted-foreground mt-1">اكتشف محلات غسيل السيارات حول العالم وادعهم للمنصة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10"><Users className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">محلات محفوظة</p>
              <p className="text-2xl font-bold">{saved.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">نتائج هذه الجلسة</p>
              <p className="text-2xl font-bold">{results.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/10"><Sparkles className="w-6 h-6 text-yellow-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">المحدد للحفظ</p>
              <p className="text-2xl font-bold">{selected.size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation form */}
      <Card>
        <CardHeader><CardTitle>🌍 توليد جديد</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">البلد</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">المدينة (اختياري)</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca, Paris..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">عدد المحلات</label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري البحث...</> : <><Sparkles className="w-4 h-4" /> توليد ذكي</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>النتائج ({results.length})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={saveSelected} variant="default" size="sm"><Save className="w-4 h-4" /> حفظ المحدد</Button>
              <Button onClick={exportCSV} variant="outline" size="sm"><Download className="w-4 h-4" /> CSV</Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>البلد / المدينة</TableHead>
                  <TableHead>إيميل</TableHead>
                  <TableHead>واتساب / هاتف</TableHead>
                  <TableHead>موقع</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell><Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} /></TableCell>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.owner_name || "—"}</TableCell>
                    <TableCell className="text-xs">{l.country} {l.city ? `• ${l.city}` : ""}</TableCell>
                    <TableCell className="text-xs">{l.email || "—"}</TableCell>
                    <TableCell className="text-xs ltr:text-left" dir="ltr">{l.whatsapp || l.phone || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {l.website ? <a href={l.website} target="_blank" rel="noreferrer" className="text-primary underline">رابط</a> : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" onClick={() => sendWhatsApp(l)} title="واتساب">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => sendEmail(l)} title="إيميل دعوة">
                          <Mail className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button size="icon" variant="default" onClick={() => sendEngagement(l)} title="رسالة تشجيعية عبر Mailbutler / Gmail">
                          <Send className="w-4 h-4" />
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
      <Card>
        <CardHeader><CardTitle>📚 المحلات المحفوظة (AI)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {savedLoading ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : saved.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">لا توجد محلات محفوظة بعد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المرجع</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البلد</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>إيميل</TableHead>
                  <TableHead>واتساب</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saved.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.reference || "—"}</TableCell>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-xs">{l.country || "—"}</TableCell>
                    <TableCell className="text-xs">{l.city || "—"}</TableCell>
                    <TableCell className="text-xs">{l.email || "—"}</TableCell>
                    <TableCell className="text-xs" dir="ltr">{l.whatsapp || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" onClick={() => sendWhatsApp(l)} title="واتساب">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => sendEmail(l)} title="إيميل دعوة">
                          <Mail className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button size="icon" variant="default" onClick={() => sendEngagement(l)} title="رسالة تشجيعية عبر Mailbutler / Gmail">
                          <Send className="w-4 h-4" />
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
