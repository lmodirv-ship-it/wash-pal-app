
المستخدم يريد إضافة زر "توليد ذكي" في صفحة المالك (Owner/Admin) يستخدم AI للبحث عن أصحاب محلات غسل السيارات حول العالم (لا المغرب فقط) وجلب معلوماتهم (الاسم، المالك، الإيميل، واتساب، الهاتف، المدينة، البلد، العنوان) وعرضها في جدول، وكل محل يُضاف تلقائياً لقاعدة البيانات مع reference خاص.

## التحليل
- الجدول الموجود `b2b_partners` يحتوي على: name, owner_name, email, phone, address, city, reference, package_name, total_points... — مناسب جداً.
- يجب إضافة عمود `country` و `whatsapp` للجدول.
- سنستخدم Lovable AI Gateway (`google/gemini-2.5-pro` مع Google Search grounding) لتوليد leads حقيقية.
- سننشئ edge function `generate-leads` يستقبل (country, city, count) ويرجع قائمة محلات مع معلومات تواصل.
- سنضيف الزر في صفحة `AdminDashboard.tsx` (صفحة المالك) — أو نبني صفحة جديدة `/admin/leads`.

## الخطة

### 1. Migration
- إضافة `country TEXT` و `whatsapp TEXT` لجدول `b2b_partners`.
- إضافة دالة + trigger لتوليد reference بصيغة `B-XXXXXX` تلقائياً (إن لم يكن موجود).

### 2. Edge Function `generate-leads`
- Input: `{ country?: string, city?: string, count: number }` (إذا لم يحدد البلد → عالمياً)
- يستخدم Lovable AI (`google/gemini-2.5-pro`) مع prompt يطلب JSON structured output بقائمة محلات حقيقية مع: name, owner_name, email, whatsapp, phone, city, country, address, website, notes.
- Returns: قائمة JSON.

### 3. صفحة جديدة `/admin/leads` (LeadsGenerator.tsx)
- زر "🌍 توليد ذكي" + اختيار البلد (أو "كل العالم") + المدينة (اختياري) + عدد المحلات.
- Loading state مع spinner.
- جدول يعرض النتائج مع checkbox لاختيار من يُضاف.
- زر "حفظ المحدد في قاعدة البيانات" → يُدخل في `b2b_partners` (reference يُولّد تلقائياً).
- زر "تصدير Excel".
- زر "إرسال دعوة" لكل صف (يفتح WhatsApp/Email مع رسالة جاهزة لدعوتهم للتسجيل).

### 4. ربط في Sidebar/AdminDashboard
- إضافة رابط/زر "توليد leads" في صفحة الأدمن.

### التكلفة
- 1 migration
- 1 edge function جديد
- 1 صفحة جديدة + رابط في Sidebar أو زر في AdminDashboard
- ~5 دقائق

اضغط **Approve** للبدء.
