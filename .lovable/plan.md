# خطة: إضافة دور `owner` (مالك المنصة)

## الفرق الجوهري
- **حالياً:** `admin` = أعلى صلاحية، يصل لكل بيانات المنصة.
- **بعد التغيير:** `owner` = الأعلى (عبر المنصة)، و `admin` = مالك متجر واحد فقط.

ترتيب الأولوية الجديد: **owner > admin > supervisor > manager > employee > customer**

---

## التنفيذ — Migration واحد

### أ) إضافة الدور وترقية الحساب الرئيسي
- `ALTER TYPE app_role ADD VALUE 'owner'`
- ترقية الحساب الرئيسي (`lmodirv@gmail.com`) من `admin` إلى `owner` في `user_roles` و `profiles.role`
- باقي حسابات `admin` تبقى `admin` (سيمثلون مالكي متاجر)

### ب) دالة جديدة `is_owner()`
`SECURITY DEFINER` تعيد `true` لمن لديه دور `owner` — لاستخدامها في RLS

### ج) إضافة سياسات `*_owner_all` (مضافة بجانب السياسات القائمة، آمنة)
على 24 جدول: `orders, invoices, customers, employees, branches, services, expenses, discount_coupons, message_templates, b2b_partners, shops, shop_members, subscriptions, pricing_plans, notifications, notification_settings, profiles, user_roles, role_audit_logs, login_attempts, video_scans, video_scan_detections, imou_devices, invites`

كل سياسة: `USING (is_owner()) WITH CHECK (is_owner())` — تمنح owner وصولاً كاملاً.

> **لا نحذف سياسات `admin_all` الموجودة** — تبقى تماماً (admin يحتفظ بصلاحياته الحالية لئلا ينكسر شيء). التضييق الدلالي لـ admin يأتي تدريجياً في مرحلة لاحقة.

### د) تحديث الـ triggers
- `sync_profile_role_from_user_roles`: إضافة `owner` في أعلى أولوية المزامنة
- `prevent_role_self_escalation`: فقط `owner` يمنح/يزيل دور `owner`؛ `owner` و `admin` يغيّران باقي الأدوار
- `handle_new_user`: منع تعيين `owner` من بيانات signup (لا يمكن لأحد التسجيل كـ owner)

---

## التنفيذ — Frontend (5 ملفات)

### `src/hooks/useEffectiveRoles.ts`
```ts
export type AppRole = "owner" | "admin" | "supervisor" | "manager" | "employee" | "customer";
export const ALL_ROLES = ["owner", "admin", "supervisor", "manager", "employee", "customer"];
export const ROLE_PRIORITY = ["owner", "admin", "supervisor", "manager", "employee", "customer"];

homeForRole("owner") → "/admin"
homeForRole("admin") → "/admin"   // مؤقتاً نفس owner، حتى لا نكسر تدفق المالك الحالي
```

### `src/App.tsx` و `ProtectedRoute`
- `/admin/*` → `allowedRoles: ["owner", "admin"]` (سيُضيَّق لاحقاً لـ owner فقط)
- باقي المسارات بدون تغيير

### `src/components/AppSidebar.tsx`
- إضافة `owner` كحالة موازية لـ `admin` في عرض القائمة

### `AdminUsers.tsx` و `RoleAuditLogs.tsx`
- إضافة `owner` و `manager` إلى:
  - `ROLE_LABELS`: `owner: "Propriétaire"`, `manager: "Gérant / Manager"`
  - `ROLE_COLORS`: ألوان البادج
- إضافة `owner` إلى dropdown تغيير الدور (لكن RLS يمنع غير owner من اختياره)

### ذاكرة المشروع
- تحديث `mem://features/saas-architecture` بترتيب الأولوية الجديد + معنى كل دور

---

## ضمانات السلامة
- **لا يُحذف أي شيء** — كل التغييرات إضافية (سياسات جديدة، trigger محدّث، enum value جديد)
- **حساب الأدمن الرئيسي يُرقّى تلقائياً** ضمن نفس migration → لا انقطاع في الوصول
- **admin يحتفظ بكل صلاحياته الحالية** — التضييق التدريجي (admin = متجره فقط) يُؤجَّل لمرحلة لاحقة بعد التأكد من الاستقرار
- **`owner` لا يمكن إنشاؤه عبر signup** — يُمنح يدوياً فقط

## ما لن يتم
- لا حذف لـ `profiles.role`
- لا تعديل لسياسات `is_shop_member` الحالية
- لا تضييق لصلاحيات `admin` الحالية في هذه المرحلة (مرحلة منفصلة لاحقاً)
- لا تغيير في schema الجداول
