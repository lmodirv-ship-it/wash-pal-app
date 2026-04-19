
المستخدم يريد إكمال صفحة `/admin/leads` + إضافة قوالب رسائل (Email + WhatsApp) لإرسالها للمحلات المُكتشفة لشرح المنصة ودعوتهم للتسجيل.

## ما هو موجود فعلاً
- ✅ Edge function `generate-leads` (يستخدم Lovable AI)
- ✅ Migration: أعمدة `country, whatsapp, website, source` + trigger للـ reference `B-XXXXXX`
- ❌ صفحة `/admin/leads` (لم تُكمل — تم إلغاؤها)
- ❌ Route + رابط في Sidebar
- ❌ قوالب الرسائل

## الخطة

### 1. صفحة `src/pages/AdminLeads.tsx`
- **Header** + إحصائيات سريعة (عدد leads المحفوظة، عدد المُتواصل معهم)
- **نموذج توليد**: اختيار البلد (dropdown شامل + "كل العالم") + المدينة + العدد (5/10/20)
- **زر "🌍 توليد ذكي"** → يستدعي edge function مع loading
- **جدول النتائج** مع أعمدة: ✓ | الاسم | المالك | البلد | المدينة | إيميل | واتساب | هاتف | موقع | إجراءات
- **إجراءات لكل صف**:
  - زر **واتساب** → يفتح wa.me برسالة دعوة جاهزة
  - زر **إيميل** → يفتح mailto: برسالة دعوة جاهزة
  - زر **حفظ في DB**
- **أزرار جماعية**: حفظ المحدد | تصدير Excel | تصدير CSV
- **جدول leads المحفوظة سابقاً** (من `b2b_partners` حيث `source = 'ai_generated'`)

### 2. قوالب الرسائل (`src/lib/leadMessages.ts`)
ملف جديد يحتوي على:
- `buildInviteWhatsAppMessage(lead, lang)` — رسالة قصيرة جذابة بالعربية/الإنجليزية/الفرنسية حسب البلد
- `buildInviteEmailSubject(lead, lang)` 
- `buildInviteEmailBody(lead, lang)` — يشرح المنصة + المميزات + رابط التسجيل
- اللغة تُختار تلقائياً حسب البلد (المغرب/الجزائر→عربي/فرنسي، فرنسا→فرنسي، باقي العالم→إنجليزي)

محتوى الرسالة سيشمل:
- تحية شخصية باسم المحل
- تعريف بـ H&Lavage
- 3 مميزات رئيسية (إدارة الطلبات، الفواتير، التقارير)
- عرض تجريبي مجاني 15 يوم
- رابط: https://hn-carwash.online
- توقيع

### 3. Route + Sidebar
- إضافة `/admin/leads` في `src/App.tsx` (داخل block super_admin/admin)
- إضافة عنصر "🌍 توليد عملاء" في `src/components/AppSidebar.tsx` (يظهر فقط للأدمن)

### 4. ملاحظة بسيطة
- استخدام `B-XXXXXX` reference تلقائياً (الـ trigger موجود)
- التحقق من عدم تكرار الإيميل عند الحفظ

## الملفات
1. ✏️ `src/pages/AdminLeads.tsx` (إنشاء)
2. ✏️ `src/lib/leadMessages.ts` (إنشاء)
3. ✏️ `src/App.tsx` (إضافة route)
4. ✏️ `src/components/AppSidebar.tsx` (إضافة رابط)

## التكلفة
~4 ملفات، ~5 دقائق. لا migration جديد ولا edge function جديد.
