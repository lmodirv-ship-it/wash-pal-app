# ترحيل قاعدة البيانات إلى Supabase خارجي مستقل

## القرارات المعتمدة
- **مسار Cutover:** B — مشروع Lovable جديد متصل بالـ Supabase الخارجي من البداية. الإنتاج الحالي يبقى يعمل دون انقطاع حتى لحظة التحويل.
- **ترحيل الـ Auth:** نقل `encrypted_password` (bcrypt) مباشرة عبر SQL.
- **النطاق صارم:** لا حذف، لا تعديل خارج الترحيل، لا cutover نهائي بدون موافقة صريحة منك.

---

## ⚠️ متطلبات منك قبل أي تنفيذ

أنا لا أستطيع إنشاء مشاريع Supabase خارجية ولا مشاريع Lovable جديدة نيابةً عنك. أحتاج منك:

1. **إنشاء مشروع Supabase خارجي** على supabase.com (نفس المنطقة الجغرافية مفضّل لتقليل زمن النقل).
2. **تزويدي بالأسرار التالية** عبر `add_secret` على المشروع الحالي (للمرحلة 1–4 فقط، للقراءة/الكتابة على الخارجي):
   - `EXTERNAL_SUPABASE_URL`
   - `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`
   - `EXTERNAL_SUPABASE_DB_URL` (PostgreSQL connection string الكامل، يحوي كلمة مرور DB)
   - `EXTERNAL_SUPABASE_ANON_KEY`
3. **التحقق من JWT Secret:**
   - افتح Supabase Dashboard → Settings → API → JWT Settings → JWT Secret على **المشروع الجديد**.
   - يجب أن يكون **مماثلاً** للـ JWT Secret في مشروع Cloud الحالي حتى تستمر الجلسات. إذا لم يكن متطابقاً، خياران: (أ) تعديل JWT Secret على الخارجي ليطابق الحالي قبل الترحيل، أو (ب) قبول أن جميع المستخدمين سيُسجَّلون خروجاً مرة واحدة عند الـ cutover (لكن كلمات مرورهم تبقى صحيحة).

---

## المراحل

### المرحلة 1 — استخراج Schema + Baseline (آمنة، لا تأثير على الإنتاج)

أُخرج إلى `/mnt/documents/migration/`:
- `01_schema.sql` — جميع `CREATE TABLE` + indexes + FK + enums (بما فيها `app_role`).
- `02_functions.sql` — كل الـ 37 دالة الموجودة (`is_owner`, `has_role`, `effective_services_for_employee`, إلخ).
- `03_triggers.sql` — جميع الـ triggers (`prevent_service_hard_delete`, `enforce_service_limit`, إلخ).
- `04_policies.sql` — كل RLS policies لكل جدول.
- `05_baseline_counts.json` — counts قبل لكل جدول (29 جدول).

### المرحلة 2 — تطبيق Schema على المشروع الخارجي

عبر `psql $EXTERNAL_SUPABASE_DB_URL`:
1. تشغيل `01` ثم `02` ثم `03` ثم `04` بالترتيب.
2. التحقق من نجاح كل مرحلة (`\dt`, `\df`, list policies).
3. تفعيل RLS على جميع الجداول.

### المرحلة 3 — ترحيل البيانات

ترتيب صارم لاحترام FK:
```
auth.users (مع encrypted_password) →
profiles → user_roles → shops → shop_members → branches →
employees → services → customers → orders → invoices →
b2b_partners → subscriptions → discount_coupons → expenses →
notifications → notification_settings → invites →
employee_join_requests → employee_service_overrides →
imou_devices → vehicle_plate_events → vehicle_sessions →
face_entry_events → message_templates → audit_logs →
role_audit_logs → login_attempts → pricing_plans →
visitor_stats → video_scans → video_scan_detections
```

**ترحيل auth.users بـ bcrypt مباشر:**
سكربت Node يقرأ من المصدر عبر `SUPABASE_DB_URL` (متاح كسرّ) ويُدخل في الخارجي:
```sql
INSERT INTO auth.users 
  (id, instance_id, email, encrypted_password, email_confirmed_at, 
   raw_user_meta_data, raw_app_meta_data, created_at, updated_at, 
   confirmation_token, recovery_token, aud, role)
VALUES (...);

INSERT INTO auth.identities 
  (id, user_id, provider_id, identity_data, provider, ...)
VALUES (...);
```
الحفاظ على نفس `id` لكل مستخدم ضروري — كل الـ FK تعتمد عليه.

كل جدول يُنقل في batches من 500 صف، مع **disable triggers مؤقتاً** أثناء النقل لتجنب إطلاق `enforce_service_limit` و `notify_on_new_order` وغيرها، ثم إعادة تفعيلها.

### المرحلة 4 — التحقق + اختبار RLS (بدون لمس الإنتاج)

1. **counts بعد** لكل جدول — مقارنة بـ baseline. أي فرق = فشل = rollback لذلك الجدول.
2. **Spot-check بيانات حساسة:** عينات من `services`, `orders`, `audit_logs`.
3. **اختبار RLS لكل دور** عبر إنشاء JWT اختباري لكل دور وتشغيل SELECT/INSERT/UPDATE:
   - `owner` — يرى كل شيء
   - `admin` — حسب الـ shop
   - `supervisor` / `manager` — حسب is_shop_manager
   - `employee` — خدمات متجره فقط
   - `customer` — طلباته فقط
   - `anon` — مرفوض
4. **اختبار الدوال الحرجة:** `effective_services_for_employee`, `submit_join_request`, `approve_join_request`.

عند نهاية هذه المرحلة: المشروع الخارجي **جاهز ومعزول**. الإنتاج الحالي يعمل بدون أي تأثير. **أتوقف هنا وأنتظر قرارك.**

### المرحلة 5 — Cutover (لا ينفَّذ إلا بموافقة منفصلة)

عند موافقتك:
1. **تنشئ مشروع Lovable جديداً** وتربطه بمشروع Supabase الخارجي.
2. أنا أنسخ الكود (كل `src/`, `supabase/functions/`, `index.html`, إلخ) إلى المشروع الجديد.
3. يُعاد ربط الـ custom domain من المشروع القديم إلى الجديد (DNS switch).
4. **Delta sync نهائي** للبيانات التي أُضيفت بين المرحلة 3 والـ cutover (audit_logs, orders, notifications).
5. تجميد الكتابة على المشروع القديم لمدة 5 دقائق أثناء التحويل.
6. بعد 24 ساعة من استقرار الجديد: المشروع القديم يبقى للـ rollback، لا يُحذف.

---

## خطة Rollback

- **بعد المرحلة 1–4:** لا حاجة، لم يُلمس الإنتاج.
- **أثناء Cutover:** عودة فورية بـ DNS switch إلى المشروع القديم (TTL منخفض قبل ساعة).
- **بعد Cutover:** المشروع القديم يبقى مجمَّداً للقراءة لمدة 30 يوماً كنسخة احتياطية حية.

---

## التقرير النهائي (Evidence Pack)

عند نهاية المرحلة 4 سأسلّم:
- جدول before/after counts لكل الـ 29 جدول.
- نتيجة `tsc --noEmit` و `bun run build` (تبقى نفس النتيجة لأن الكود لم يتغير في هذه المراحل).
- جدول pass/fail اختبار RLS لكل دور × كل جدول حساس.
- لقطات SQL لعينة من البيانات (services, orders, profiles).
- ملف JSON واحد: `/mnt/documents/migration/final_report.json`.

---

## التفاصيل التقنية

**أدوات الاستخراج:** `pg_dump --schema-only --no-owner --no-acl` للـ schema، و scripts Node مخصصة للبيانات (لتجنب مشاكل dump/restore مع `auth.*`).

**الـ batching:** 500 صف لكل INSERT لتجنب timeout. PG connection pooling مع `pg` library.

**التعطيل المؤقت للـ triggers أثناء النقل:**
```sql
ALTER TABLE public.services DISABLE TRIGGER USER;
-- INSERT...
ALTER TABLE public.services ENABLE TRIGGER USER;
```

**اختبار RLS برمجياً:** استخدام `SET LOCAL request.jwt.claims = '{"sub":"...","role":"authenticated"}'` ثم تشغيل SELECT والتحقق من النتائج المتوقعة.

**ملفات لن تُلمس في المراحل 1–4:** كامل `src/`, كامل `supabase/functions/`, `package.json`, أي ملف من ملفات الإنتاج. كل العمل في `/mnt/documents/migration/` و scripts مؤقتة في `/tmp/`.

---

## ما أحتاجه منك الآن للانتقال للتنفيذ

1. أنشئ مشروع Supabase الخارجي.
2. زوّدني بالأسرار الأربعة المذكورة أعلاه.
3. أكّد تطابق JWT Secret أو قرارك بشأنه.
4. عند الجاهزية، اكتب: "ابدأ المرحلة 1".

سأنفذ المراحل 1→4 بشكل متسلسل وأتوقف عند نهاية 4 لانتظار قرار الـ cutover.