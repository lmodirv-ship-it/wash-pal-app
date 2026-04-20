
سأضيف زر "تحويل الإيميل إلى Mailbutler" بجانب أزرار الإجراءات الحالية في صفحة /admin/leads، يفتح Mailbutler مباشرة مع الإيميل والموضوع والنص جاهزة.

## الخطة

### تعديل `src/lib/leadMessages.ts`
إضافة دالة `mailbutlerComposeLink(email, subject, body)` تبني رابط Mailbutler:
- `https://web.mailbutler.io/compose?to=...&subject=...&body=...`
- (Mailbutler Web يدعم نفس بارامترات mailto القياسية)

### تعديل `src/pages/AdminLeads.tsx`
1. استيراد `mailbutlerComposeLink` و أيقونة `Mail` إضافية (مثل `MailPlus` من lucide-react).
2. إضافة handler جديد `sendViaMailbutler(lead)` يستخدم نفس قالب `buildEngagementEmailSubject/Body` ويفتح الرابط في تبويب جديد.
3. إضافة زر جديد بجانب أزرار WhatsApp / Gmail / Engagement في:
   - جدول النتائج المُولّدة
   - جدول المحلات المحفوظة
4. ستايل الزر: تدرج برتقالي/كهرماني (`bg-gradient-to-br from-orange-500/20 to-amber-500/10`) مع glow hover ليتميز عن باقي الأزرار، وأيقونة `MailPlus`.
5. tooltip عربي: "إرسال عبر Mailbutler".

### ملاحظات
- لا حاجة لأي تغيير في قاعدة البيانات أو edge functions.
- نفس قالب الرسالة التشجيعية المُستخدم حالياً (متعدد اللغات: عربي/فرنسي/إنجليزي حسب بلد المحل).
- الزر يظهر فقط للمحلات التي لها إيميل (`disabled={!lead.email}`).

## الملفات المعدّلة
- `src/lib/leadMessages.ts` — إضافة `mailbutlerComposeLink`
- `src/pages/AdminLeads.tsx` — handler + زر في الجدولين
