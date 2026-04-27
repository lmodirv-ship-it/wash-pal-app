# Phase 2 — Multi-Tenant Isolation (Hard Enforcement)

## الهدف
إزالة كل قنوات الوصول العالمي عبر الدور `admin` وجعله **مالك متجر فقط**. الوصول العالمي يبقى محصوراً في `owner` (حساب `lmodirv@gmail.com` لديه دور `owner` بالفعل، فلن يفقد صلاحياته).

## المبدأ
```text
owner       → وصول عالمي (is_owner())
admin       → داخل shop_id الخاص به فقط (عبر shops.owner_id أو shop_members)
supervisor  → داخل shop_id (shop_members)
manager     → داخل shop_id (shop_members)
employee    → داخل shop_id (shop_members)
customer    → بياناته الخاصة فقط
```

---

## 1) حذف سياسات الوصول العالمي للـ admin

ستُحذف **19** سياسة `*_admin_all` من الجداول التالية. الوصول الفعلي للـ admin سيمر من خلال سياسات `*_member_*` و `*_owner_all` الموجودة (لأن admin مالك المتجر يكون عضواً فيه عبر `shops.owner_id` أو `shop_members`).

| الجدول | السياسات المحذوفة |
|--------|-------------------|
| b2b_partners | `b2b_partners_admin_all` |
| branches | `branches_admin_all` |
| customers | `customers_admin_all` |
| discount_coupons | `coupons_admin_all` |
| employees | `employees_admin_all` |
| expenses | `expenses_admin_all` |
| invites | `invites_admin_all` |
| invoices | `invoices_admin_all` |
| message_templates | `templates_admin_all` |
| notification_settings | `notification_settings_admin_all` |
| notifications | `notifications_admin_all` |
| orders | `orders_admin_all` |
| pricing_plans | `pricing_plans_admin_all` |
| services | `services_admin_all` |
| shop_members | `shop_members_admin_all` |
| shops | `shops_admin_all` |
| subscriptions | `subscriptions_admin_all` |
| video_scans | `video_scans_admin_all` |
| video_scan_detections | `video_scan_detections_admin_all` |

كذلك تُحذف السياسات التي تعطي admin صلاحيات عالمية على جداول النظام:
- `profiles`: `Admins read all profiles`, `Admins update all profiles`, `Admins insert profiles`, `Admins delete profiles`
- `user_roles`: `Admins manage roles`
- `imou_devices`: `Admins manage imou_devices` + تضييق `imou_devices_select_member` ليحذف شرط `has_role admin/manager` العالمي
- `notifications`: تعديل `notifications_insert_member` لإزالة `has_role admin`
- `role_audit_logs`: `role_audit_logs_admin_select` (يبقى `role_audit_logs_owner_select` فقط — قراءة سجلات الأدوار صلاحية owner فقط)
- `login_attempts`: `Admins can view login attempts` (سجل أمني عالمي → owner فقط)

## 2) ضمان وجود سياسات shop-scoped لكل العمليات

سياسات `*_member_*` (SELECT/INSERT/UPDATE/DELETE) موجودة بالفعل لمعظم الجداول مع `WITH CHECK = is_shop_member(shop_id)`. سأتحقق من اكتمالها للجداول التالية وأضيف أي ناقص:

- `discount_coupons`, `message_templates`, `notification_settings` — موجودة ✓
- `b2b_partners` — لها `member_select` + `manager_insert/update/delete` ✓
- `imou_devices` — يحتاج إضافة سياسات INSERT/UPDATE/DELETE shop-scoped (manager-level فقط) بعد حذف policy الـ admin العالمية
- `pricing_plans` — جدول مرجعي عام: يبقى `select_all` للجميع، الكتابة تصبح `is_owner()` فقط
- `subscriptions` — يبقى `select_member` للقراءة، الكتابة تصبح `is_owner()` فقط (الـ admin لن يستطيع تعديل اشتراكه — هذا أمان مقصود؛ الترقية تتم عبر edge function لاحقاً)
- `notifications` — تعديل `insert_member` ليصبح: `auth.uid() = user_id AND (shop_id IS NULL OR is_shop_member(shop_id))` (بدون admin override)
- `shops` — السياسات الحالية (`shops_insert_self`, `shops_select_owner`, `shops_update_owner`) كافية لإدارة المتجر الذاتية
- `shop_members` — `shop_members_owner_manage` يسمح لمالك المتجر بإدارة أعضائه ✓
- `user_roles` — يبقى `Users read own roles` للقراءة الذاتية + `user_roles_owner_all` للـ owner. **لا يستطيع admin تعديل الأدوار عالمياً بعد الآن.** (إدارة أدوار الفريق داخل متجره ستُضاف في migration لاحق عبر `can_manage_shop_team` — ليس الآن لأنه يحتاج عمود `shop_id` في `user_roles` غير موجود).
- `profiles` — يبقى `Users can read own profile` + `profiles_update_own_no_role` + سياسات `profiles_owner_*`. admin لن يقرأ بروفايلات بقية المنصة.

## 3) تأثير على الواجهة (UI impact)

الصفحات التي تعتمد على وصول admin العالمي ستحتاج تعديل:

- **`AdminUsers.tsx`**: يستدعي edge function `admin-users-list` ويعرض كل المستخدمين. هذه الصفحة صلاحية owner فقط — يجب حصرها بـ `isPlatformOwner` (إخفاء من السايدبار + ProtectedRoute).
- **`RoleAuditLogs.tsx`**: نفس الشيء — owner فقط.
- **صفحات admin global (إن وُجدت):** أي قائمة "كل المتاجر" / "كل الفواتير" / "كل المستخدمين" تُحجب عن admin.
- صفحات إدارة المتجر العادية (Orders, Customers, Employees, Services, Branches, Invoices, Expenses) ستستمر بالعمل للـ admin لأنه عضو في متجره.

سأفحص `AppSidebar.tsx` و `App.tsx` وأحدّث القيود حيث يلزم.

## 4) ما **لا** يتم في هذه المرحلة (لتجنب التوسع)

- لا تعديل على `audit_logs` — يبقى للأدوار فقط.
- لا حذف لـ `profiles.role` — يبقى cache.
- لا تغيير على schema الجداول.
- لا تغيير على `is_shop_member` / `is_shop_manager` / `can_manage_shop_team`.
- لا دمج مع Stripe.
- لا إعادة كتابة إدارة الأدوار عبر `shop_id` (يحتاج عمود جديد — مرحلة لاحقة).

## 5) معايير القبول والتحقق

بعد التنفيذ:
1. `bunx tsc --noEmit` ينجح.
2. تسجيل الدخول بـ `lmodirv@gmail.com` (owner) → يصل لكل شيء عادي.
3. تسجيل دخول حساب admin متجر A → يرى فقط بيانات متجر A في `orders/invoices/customers/employees/services/branches/expenses/b2b_partners`.
4. حساب admin متجر A لا يستطيع SELECT بيانات متجر B (تجربة SQL يدوية).
5. حساب admin لا يرى صفحات `AdminUsers` و `RoleAuditLogs`.
6. `AppSidebar` يعرض روابط الإدارة العالمية فقط للـ owner.

## 6) ملفات ستتغير

- **Migration واحد** يحذف ~25 سياسة admin عالمية ويستبدل/يصلح الجداول الخاصة (imou_devices, notifications, pricing_plans writes, subscriptions writes, login_attempts).
- **`src/App.tsx`** — تقييد routes `/admin/users` و `/admin/role-audit-logs` لـ owner فقط.
- **`src/components/AppSidebar.tsx`** — إخفاء روابط الإدارة العالمية عن non-owner.
- **`src/pages/AdminUsers.tsx`** و **`src/pages/RoleAuditLogs.tsx`** — حراسة client-side: redirect إذا ليس owner.

---

## ⚠️ تحذير قبل الموافقة

هذا التغيير **سيكسر فوراً** أي مكان يفترض أن admin يرى بيانات عالمية. إذا كان هناك حساب admin (غير owner) يستخدم النظام الآن، سيفقد الوصول لكل ما هو خارج متجره. الحساب الرئيسي `lmodirv@gmail.com` آمن لأنه owner. تأكد من أن هذا هو المطلوب قبل الموافقة.