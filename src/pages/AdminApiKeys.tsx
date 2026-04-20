import { useState } from "react";
import { Key, Camera, Sparkles, Database, ShieldCheck, Plus, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface ApiKeyEntry {
  name: string;
  description: string;
  category: "camera" | "ai" | "backend" | "messaging" | "custom";
  configured: boolean;
  docsUrl?: string;
}

// Known secrets in this project (from Lovable Cloud)
const KNOWN_KEYS: ApiKeyEntry[] = [
  { name: "IMOU_APP_ID", description: "معرّف تطبيق كاميرات IMOU", category: "camera", configured: true, docsUrl: "https://open.imoulife.com/" },
  { name: "IMOU_APP_SECRET", description: "المفتاح السري لكاميرات IMOU", category: "camera", configured: true, docsUrl: "https://open.imoulife.com/" },
  { name: "LOVABLE_API_KEY", description: "مفتاح Lovable AI Gateway (تلقائي)", category: "ai", configured: true },
  { name: "SUPABASE_URL", description: "رابط قاعدة البيانات", category: "backend", configured: true },
  { name: "SUPABASE_ANON_KEY", description: "المفتاح العام للواجهة", category: "backend", configured: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", description: "مفتاح الخدمة (سري جداً)", category: "backend", configured: true },
];

const CATEGORY_META = {
  camera:    { label: "كاميرات", icon: Camera,      tone: "hsl(28 90% 55%)" },
  ai:        { label: "ذكاء اصطناعي", icon: Sparkles, tone: "hsl(280 80% 65%)" },
  backend:   { label: "قاعدة البيانات", icon: Database, tone: "hsl(210 95% 55%)" },
  messaging: { label: "رسائل", icon: Key,           tone: "hsl(152 70% 48%)" },
  custom:    { label: "مخصّص", icon: Key,           tone: "hsl(220 20% 60%)" },
} as const;

export default function AdminApiKeys() {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success(`تم نسخ ${name}`);
  };

  const handleRequestNew = () => {
    if (!newName.trim()) {
      toast.error("أدخل اسم المفتاح");
      return;
    }
    toast.info("سيتم فتح نموذج آمن لإدخال القيمة من قِبَل المسؤول التقني", { duration: 4000 });
    setNewName("");
    setNewDesc("");
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(220_30%_5%)] text-foreground" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[hsl(28_90%_55%)] to-[hsl(15_90%_50%)] shadow-[0_0_24px_-4px_hsl(28_90%_55%/0.7)]">
              <Key className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">إدارة مفاتيح API</h1>
              <p className="text-sm text-muted-foreground mt-1">
                المفاتيح السرية تُخزّن بأمان في Lovable Cloud ولا تظهر قيمها في الواجهة
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAdd((v) => !v)}
            className="bg-[hsl(28_90%_55%)] hover:bg-[hsl(28_90%_50%)] text-white shadow-[0_0_18px_-4px_hsl(28_90%_55%/0.8)] gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة مفتاح جديد
          </Button>
        </div>

        {/* Security notice */}
        <Card className="bg-[hsl(220_25%_10%)] border-[hsl(28_90%_55%/0.25)] p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[hsl(28_95%_65%)] flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">أمان المفاتيح</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              جميع القيم محمية ولا تُعرض هنا. للتعديل أو الإضافة، تُفتح نافذة آمنة من Lovable Cloud لإدخال القيمة مباشرة.
            </p>
          </div>
        </Card>

        {/* Add form */}
        {showAdd && (
          <Card className="bg-[hsl(220_25%_10%)] border-[hsl(220_20%_18%)] p-5 space-y-4">
            <h3 className="font-bold text-lg">طلب مفتاح API جديد</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">اسم المفتاح (UPPER_SNAKE)</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                  placeholder="مثال: STRIPE_SECRET_KEY"
                  className="bg-[hsl(220_30%_7%)] border-[hsl(220_20%_18%)] mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">الوصف</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="ما هو استخدام هذا المفتاح؟"
                  className="bg-[hsl(220_30%_7%)] border-[hsl(220_20%_18%)] mt-1.5"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRequestNew} className="bg-[hsl(28_90%_55%)] hover:bg-[hsl(28_90%_50%)] text-white">
                طلب الإضافة
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="border-[hsl(220_20%_18%)]">
                إلغاء
              </Button>
            </div>
          </Card>
        )}

        {/* Keys grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {KNOWN_KEYS.map((k) => {
            const meta = CATEGORY_META[k.category];
            const Icon = meta.icon;
            return (
              <Card
                key={k.name}
                className="bg-[hsl(220_25%_10%)] border-[hsl(220_20%_18%)] p-4 hover:border-[hsl(220_20%_28%)] transition group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.tone}20`, color: meta.tone }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono font-bold text-foreground truncate">{k.name}</code>
                      {k.configured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[hsl(152_70%_48%/0.15)] text-[hsl(152_70%_55%)] border border-[hsl(152_70%_48%/0.3)]">
                          <CheckCircle2 className="w-3 h-3" /> مُهيّأ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{k.description}</p>
                    <span
                      className="inline-block text-[10px] mt-2 px-1.5 py-0.5 rounded-md border"
                      style={{ color: meta.tone, borderColor: `${meta.tone}50`, backgroundColor: `${meta.tone}10` }}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[hsl(220_20%_16%)]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyName(k.name)}
                    className="border-[hsl(220_20%_18%)] hover:bg-[hsl(220_25%_14%)] gap-1.5 text-xs h-8"
                  >
                    <Copy className="w-3 h-3" />
                    نسخ الاسم
                  </Button>
                  {k.docsUrl && (
                    <a
                      href={k.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs h-8 px-3 rounded-md border border-[hsl(220_20%_18%)] hover:bg-[hsl(220_25%_14%)] transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      التوثيق
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}