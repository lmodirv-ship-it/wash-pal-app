## Feature: عمليات الموظف كجدول + Reference + start/end datetime

النظام حالياً يستخدم جدول `orders` وليس `work_entries`. سأبني فوق `orders` الموجود (مع البيانات والاشتراكات) بدل إنشاء جدول جديد منفصل، وأضيف الحقول الناقصة فقط. الـ RLS متاحة بالفعل (member/manager/owner). صفحة `EmployeeApp` فيها بالفعل جدول صغير لـ "أعمالي اليوم" — سأطوّره ليصبح الجدول الرسمي المطلوب.

---

### 1) تعديلات قاعدة البيانات (migration)

تعديل جدول `orders`:
- إضافة `start_at timestamptz NOT NULL DEFAULT now()`
- إضافة `expected_end_at timestamptz` (محسوب تلقائياً من duration الخدمة)
- `completed_at` موجود — سيُحدَّث تلقائياً عند تحويل الحالة إلى `completed`
- توسيع `status` ليدعم: `waiting | in_progress | completed | cancelled` (الحالي يحتوي `waiting`)
- تغيير صيغة `reference` من 6 أرقام إلى **حرف واحد + 6 أرقام** (مثال: `S483920`)
  - استبدال `generate_reference` لجدول orders بـ trigger مخصّص `generate_order_reference` يولّد `S` + 6 أرقام عشوائية فريدة
  - إضافة `CHECK (reference ~ '^[A-Z][0-9]{6}$')` (سيُطبَّق على الجديد فقط؛ السجلات القديمة بدون reference ستبقى كما هي وعند أول كتابة سيُولَّد reference متوافق)
- Trigger لتعبئة `expected_end_at` تلقائياً = `start_at + duration` بناءً على أوّل خدمة في `services[]`
- Trigger لتعيين `completed_at = now()` عند الانتقال إلى `status='completed'`، وتفريغها عند العودة لحالة أخرى

Indexes:
- `idx_orders_shop_created (shop_id, created_at DESC)`
- `idx_orders_status (status)`
- `idx_orders_reference (reference)` (unique موجود ضمنياً)

ملاحظة: لا حاجة لتغييرات RLS — السياسات الحالية (`orders_member_*` و`orders_owner_all`) تطبّق بالضبط القاعدة المطلوبة (موظف يرى متجره فقط، owner يرى الكل، لا cross-shop).

---

### 2) تحديثات Frontend

**`src/contexts/AppContext.tsx`** (أو مكان `addOrder`):
- عند إنشاء طلب: إرسال `status: 'in_progress'` افتراضياً (بدل `waiting`) — لأن العملية تبدأ فور التسجيل
- استرجاع الحقول الجديدة في الـ select: `reference, start_at, expected_end_at, completed_at, status`
- إضافة `updateOrderStatus(id, status)` يضع `completed_at` في الـ payload عند الإكمال

**`src/types/index.ts`**: إضافة الحقول الجديدة لنوع Order.

**`src/pages/EmployeeApp.tsx`** (استبدال `DailyOrdersTable`):
- جدول كامل بالأعمدة المطلوبة:
  Reference | اسم الخدمة | نوع السيارة | الموظف | بداية | نهاية متوقعة | نهاية فعلية | المدة (دقيقة) | الثمن | الحالة | ملاحظات | إجراء
- الإجراء: زر "إكمال" / "إلغاء" يحدّث الحالة
- بحث (Reference + اسم الخدمة)
- فلاتر: الحالة، التاريخ (today/week/all)، الموظف (للمدراء)
- ترتيب تنازلي حسب `start_at`
- Pagination: 20/صفحة
- Mobile: `overflow-x-auto` مع `min-w-[900px]` للجدول + sticky header

**`src/pages/Orders.tsx` و`src/pages/Entries.tsx`**: تحديث طفيف لإظهار الأعمدة الجديدة (Reference + start/end) إن لزم.

---

### 3) السلوك المتوقع

- موظف يسجّل طلباً جديداً → يحصل تلقائياً على `S######` + `start_at=now()` + `expected_end_at=start_at+duration` + `status=in_progress`
- زر "إكمال" → `status=completed` + `completed_at=now()`
- زر "إلغاء" → `status=cancelled`
- كل عرض محصور بالـ shop عبر RLS

---

### 4) معايير القبول

- ✅ Reference جديد بصيغة `^[A-Z][0-9]{6}$` لكل عملية
- ✅ start_at / expected_end_at / completed_at تظهر في الجدول
- ✅ المدراء (manager/supervisor/owner) يرون نفس السجلات حسب صلاحياتهم
- ✅ لا cross-shop access (مضمون بـRLS الموجود)
- ✅ `tsc --noEmit` ينجح

---

### الملفات المتأثرة

- migration جديدة: تعديل `orders` + triggers + indexes
- `src/contexts/AppContext.tsx`
- `src/types/index.ts`
- `src/pages/EmployeeApp.tsx` (جدول جديد بدل DailyOrdersTable)
- (اختياري) `src/pages/Orders.tsx`, `src/pages/Entries.tsx`