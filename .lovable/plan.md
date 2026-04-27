# مزامنة الأدوار وإصلاح التوجيه

## ✅ ما هو سليم
- enum `app_role` في DB: `admin, manager, supervisor, employee, customer`
- triggers `handle_new_user` تعمل وتحفظ كل تسجيل جديد في `profiles` + `user_roles`
- بيانات المستخدمين الحاليين متطابقة بين `profiles.role` و `user_roles`

## ❌ ما يجب إصلاحه

### 1. إزالة الدور الوهمي `super_admin` من الكود
**الملف**: `src/components/ProtectedRoute.tsx`
- حذف `"super_admin"` من النوع `AppRole` (غير موجود في DB enum).
- تحديث `isSuperAdmin` ليعتمد على `admin` فقط.
- تحديث route الأدمن في `src/App.tsx` ليستخدم `["admin"]` بدل `["super_admin", "admin"]`.

### 2. توحيد منطق التوجيه ليعتمد على **user_roles** (المصدر الموثوق)
**الملف**: `src/App.tsx` — دالة `RoleHomeRedirect` و `AppShell`
- بدلاً من الاعتماد على `profile.role` فقط، نقرأ `user_roles` من DB ونختار أعلى دور:
  - أولوية: `admin` > `supervisor` > `manager` > `employee` > `customer`
- التوجيه:
  - `admin` → `/admin`
  - `supervisor` / `manager` → `/dashboard`
  - `employee` → `/employee`
  - `customer` → `/app`

### 3. صفحة `/unauthorized` — تحويل تلقائي
**الملف**: `src/pages/Unauthorized.tsx`
- إضافة `useEffect` يقرأ user_roles ويعيد توجيه المستخدم لصفحته الصحيحة تلقائياً بعد 0ms (بدل عرض رسالة الخطأ).

### 4. ضمان أن trigger `handle_new_user` يعمل
- تأكيد أن trigger مرتبط فعلاً بجدول `auth.users` (الـ functions موجودة لكن يجب التحقق من ربطها كـ trigger). إن لم تكن، إنشاؤها عبر migration.

### 5. التحقق من تسجيل كل العمليات
- جميع جداول CRUD لها RLS مفعّلة ✓
- جميع الجداول الحساسة لها policies للـ admin + shop_member ✓
- لا توجد جداول مكشوفة بدون RLS

## 🎯 النتيجة
- لن يحدث أي تعارض بين الأدوار في الكود وقاعدة البيانات
- توجيه دقيق 100% بناء على `user_roles`
- صفحة Unauthorized لن تظهر أبداً لمستخدم مسجّل (سيُحوَّل تلقائياً)
- كل حساب جديد سيُسجَّل تلقائياً في `profiles` + `user_roles`

وافق على الخطة لأبدأ التنفيذ.