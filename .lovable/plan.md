
المستخدم يريد (بعد تصحيح الإملاء): في صفحة المدير، تحت قسم الخدمات/قارئ، إضافة **قارئ فيديوهات** — يرفع فيديوهات من جهاز الحاسوب، والنظام يحللها تلقائياً ويسجل: **عدد السيارات + رقم اللوحة + التوقيت**.

## الفهم
- مكان الميزة: صفحة `/admin` (لوحة Super Admin)
- المدخل: ملفات فيديو يرفعها المدير من حاسوبه
- الإخراج: جدول يحتوي على (عدد السيارات المُكتشفة، رقم اللوحة، وقت ظهور كل سيارة)
- الموجود: `PlateScanner.tsx` + `CameraMode.tsx` (يستخدمان كاميرا حية)
- الجديد: تحليل ملفات فيديو مرفوعة (مختلف عن الكاميرا الحية)

## التحديات التقنية
1. تحليل فيديو في المتصفح ثقيل — لا يمكن إرسال فيديو كامل لـ Lovable AI
2. الحل: استخراج إطارات (frames) كل N ثانية من الفيديو، ثم إرسال كل إطار لـ `google/gemini-2.5-flash` (Vision) لاكتشاف اللوحة
3. تخزين النتائج في جدول جديد `video_scan_results`

## الخطة

### 1. Migration: جدول جديد
```sql
CREATE TABLE video_scans (
  id uuid PK, admin_id uuid, video_name text,
  total_cars int, duration_sec int, created_at timestamptz
);
CREATE TABLE video_scan_detections (
  id uuid PK, scan_id uuid FK, plate text,
  timestamp_sec numeric, frame_image text, created_at timestamptz
);
```
RLS: admin only.

### 2. مكون جديد `VideoScanner.tsx`
- زر رفع فيديو (`<input type=file accept=video/*>`)
- `<video>` مخفي + `<canvas>` لاستخراج إطارات
- يستخرج إطار كل 2 ثانية → يحوّله لـ base64
- يرسل لـ edge function `scan-video-frame` → يعيد اللوحة المكتشفة
- يعرض progress bar + جدول مباشر بالنتائج

### 3. Edge function `scan-video-frame`
- يستقبل image base64
- يستدعي Lovable AI Gateway (`google/gemini-2.5-flash`) مع prompt: "استخرج رقم لوحة السيارة من هذه الصورة. أعد JSON: {plate, has_car}"
- يعيد النتيجة

### 4. صفحة `/admin/video-scanner` + إضافتها للـ Sidebar
أو دمج المكون مباشرة كـ tab في `/admin` تحت الإحصائيات.

→ سأضع المكون داخل `/admin` كقسم جديد (أبسط للمستخدم).

## الملفات
1. ➕ Migration للجدولين + RLS
2. ➕ `supabase/functions/scan-video-frame/index.ts`
3. ➕ `src/components/VideoScanner.tsx`
4. ✏️ `src/pages/AdminDashboard.tsx` (إضافة قسم في الأسفل)

## ملاحظة مهمة
دقة قراءة لوحات السيارات من فيديو منخفض الجودة محدودة. Gemini Flash جيد لكن قد يخطئ في لوحات ضبابية أو مائلة. سيتم عرض كل اكتشاف مع صورة الإطار حتى يمكن للمدير التحقق يدوياً.
