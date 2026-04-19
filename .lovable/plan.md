
## إنشاء ZIP شامل لكل المنصة + قاعدة البيانات

سأجمع **كل شيء** بدون استثناء في ملف ZIP واحد، بما في ذلك نسخة كاملة من قاعدة البيانات.

### 📦 محتويات الـ ZIP

| المحتوى | الوصف | الحجم التقريبي |
|---------|-------|----------------|
| `src/` | كل الكود المصدري (110 ملفات، 28 صفحة، مكونات، contexts, hooks, types, i18n) | ~2 MB |
| `public/` | الأصول العامة (الشعار، robots.txt، placeholder) | ~0.5 MB |
| `src/assets/` | الفيديو الترويجي + الصور | ~11 MB |
| `supabase/` | كل الـ migrations + edge functions + config.toml | ~0.5 MB |
| `.lovable/` | ملفات الذاكرة والخطط | < 0.1 MB |
| `node_modules/` | كل المكتبات المثبتة | ~380 MB |
| `.env` | متغيرات البيئة (Supabase URL + Key) | < 1 KB |
| `.git/` | سجل Git (إن وُجد) | متغير |
| ملفات الإعداد الجذرية | `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `index.html`, `components.json`, `postcss.config.js`, `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`, `playwright-fixture.ts`, `README.md`, `.gitignore` | ~1 MB |
| ملفات القفل | `bun.lock`, `bun.lockb`, `package-lock.json` | ~2 MB |

### 🗄️ نسخة قاعدة البيانات (الجزء الجديد المهم)

سأُصدِّر **محتوى قاعدة البيانات الفعلي** من Supabase وأُضيفه داخل مجلد `database-backup/` في الـ ZIP:

| الملف | المحتوى |
|-------|---------|
| `database-backup/schema.sql` | بنية كل الجداول الـ 19 + الفهارس |
| `database-backup/rls-policies.sql` | كل سياسات RLS |
| `database-backup/functions.sql` | كل الدوال (has_role, handle_new_user, accept_invite, ...) |
| `database-backup/data/*.json` | بيانات كل جدول (services, customers, orders, employees, branches, invoices, b2b_partners, shops, shop_members, profiles, user_roles, subscriptions, pricing_plans, expenses, invites, notifications, notification_settings, login_attempts, imou_devices, visitor_stats) |
| `database-backup/README.md` | تعليمات الاستعادة |

### 📊 الجداول التي ستُصدَّر (19 جدول)

`b2b_partners`, `branches`, `customers`, `employees`, `expenses`, `imou_devices`, `invites`, `invoices`, `login_attempts`, `notification_settings`, `notifications`, `orders`, `pricing_plans`, `profiles`, `services`, `shop_members`, `shops`, `subscriptions`, `user_roles`, `visitor_stats`

### ⚙️ خطوات التنفيذ

1. قراءة كل بيانات الجداول الـ 19 عبر Supabase وحفظها كـ JSON
2. تصدير schema.sql + functions.sql + RLS policies
3. نسخ كل ملفات المشروع (بدون استثناء أي مجلد)
4. إنشاء ملف README داخل النسخة لتوضيح كيفية الاستعادة
5. ضغط كل شيء في `HLavage-Complete-Backup.zip`
6. حفظه في `/mnt/documents/`
7. عرض رابط التحميل + الحجم النهائي

### 📏 الحجم المتوقع

- **قبل الضغط**: ~395 MB + بيانات DB
- **بعد الضغط**: ~120-150 MB

### ⚠️ تنبيه أمني

الـ ZIP سيحوي `.env` ومفاتيح Supabase وبيانات المستخدمين الحقيقية. **احتفظ به في مكان آمن ولا تشاركه علناً**.

### ✅ النتيجة النهائية

ملف ZIP واحد = نسخة كاملة 100% من المنصة (كود + قاعدة بيانات + إعدادات + مكتبات) قابلة للاستعادة الكاملة في أي وقت.
