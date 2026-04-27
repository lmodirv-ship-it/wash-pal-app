import { Settings, Lock } from "lucide-react";

export default function OwnerSettings() {
  const items = [
    { title: "الهوية البصرية", desc: "شعار، ألوان، خطوط المنصة" },
    { title: "اللغات والعملات", desc: "اللغات المدعومة والعملة الافتراضية" },
    { title: "تكاملات OAuth", desc: "Google, Apple, إلخ" },
    { title: "Webhooks", desc: "نقاط نهاية الأحداث الخارجية" },
    { title: "API العامة", desc: "إصدار وإدارة مفاتيح API" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-muted-foreground" />
          الإعدادات العامة للمنصة
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          إعدادات شاملة على مستوى المنصة. هذا القسم قيد التطوير.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] p-5 opacity-70"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">{it.title}</h3>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
              قريباً
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
