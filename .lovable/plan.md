
## إنشاء نسخة ZIP كاملة (بدون استثناءات)

سأجمع **كل شيء** في ملف ZIP واحد كما طلبت، دون استبعاد أي ملف.

### ما سيتم تضمينه (كل شيء)

| المجلد/الملف | الحجم التقريبي |
|--------------|----------------|
| `src/` (الكود المصدري) | ~2 MB |
| `public/` (الأصول العامة) | ~0.5 MB |
| `supabase/` (migrations + functions + config) | ~0.5 MB |
| `.lovable/` (الذاكرة والخطط) | < 0.1 MB |
| `node_modules/` (كل المكتبات) | ~380 MB |
| `.env` (متغيرات البيئة) | < 1 KB |
| `.git/` (سجل Git إن وُجد) | متغير |
| `dist/` / `build/` (إن وُجدت) | متغير |
| كل ملفات الإعداد (`package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `index.html`, `components.json`, `postcss.config.js`, `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`, `playwright-fixture.ts`, `README.md`, `.gitignore`) | ~1 MB |
| ملفات القفل (`bun.lock`, `bun.lockb`, `package-lock.json`) | ~2 MB |

### الحجم المتوقع للـ ZIP

- **قبل الضغط**: ~395 MB
- **بعد الضغط ZIP**: ~120-150 MB (لأن `node_modules` يُضغط جيداً)

### ⚠️ تنبيه أمني مهم

ملف `.env` يحتوي على مفاتيح حساسة (Supabase URL + Publishable Key). بما أنك طلبت تضمين كل شيء، سأضمّنه — **لكن لا تشارك ملف الـ ZIP علنياً** (لا ترفعه على GitHub عام أو منتديات).

### الخطوات التنفيذية

1. التحقق من وجود `node_modules/`، `.git/`، `dist/` في بيئة العمل
2. إنشاء أرشيف ZIP شامل باسم: `HLavage-Platform-Complete.zip`
3. حفظه في `/mnt/documents/` ليكون قابلاً للتحميل
4. عرض الحجم النهائي وزر التحميل المباشر

### ما ستحصل عليه

ملف ZIP واحد يحوي **نسخة طبق الأصل** من المنصة كاملة بكل ملفاتها ومكتباتها — جاهزة للاستخدام مباشرة بعد فك الضغط دون الحاجة لـ `npm install`.
