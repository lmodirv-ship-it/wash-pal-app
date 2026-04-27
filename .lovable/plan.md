# خطة ترقية المنصة إلى SaaS احترافي

## الوضع الحالي (مبني فعلاً)

- ✅ Multi-tenant: `shops`, `shop_members`, دوال `is_shop_member` / `is_shop_manager` / `user_shop_ids`
- ✅ RLS مفعّل على كل الجداول الحساسة
- ✅ نظام أدوار: `admin / manager / supervisor / employee / customer`
- ✅ owner = `shops.owner_id` + دور `supervisor` تلقائي (تم اعتماده)
- ✅ Subscriptions table + pricing_plans + trial 15 يوم تلقائي
- ✅ Invites + accept_invite + auto-link عبر trigger
- ✅ Dashboard + Orders + Invoices + Notifications (جداول)
- ✅ صفحات: Admin, Dashboard, Employee, Customer, Login, Signup, CreateShop
- ✅ التوجيه حسب الأدوار عبر `useEffectiveRoles` + `homeForRole`

## الناقص — هذه الخطة

---

### المرحلة 1 — تقوية الأمان والتوجيه

**1.1 صفحة Login تستخدم homeForRole**
- بعد نجاح تسجيل الدخول، استدعِ `useEffectiveRoles` وأعد التوجيه بناءً على أعلى دور.
- منع الوصول إلى `/login` و`/signup` للمستخدمين المسجّلين (auto-redirect).

**1.2 ProtectedRoute صارم**
- التحقق من الجلسة + الدور قبل عرض أي صفحة.
- عند عدم التطابق → redirect إلى صفحة المستخدم الصحيحة (بدلاً من `/unauthorized`).

**1.3 تشديد RLS على `notifications`**
- منع المستخدم من إنشاء notifications لمستخدمين آخرين خارج نطاق محله.

**1.4 منع تصاعد الأدوار**
- التأكد من أن trigger `prevent_role_self_escalation` مفعّل على `profiles` و`user_roles`.

---

### المرحلة 2 — إدارة المستخدمين (AdminUsers + ShopMembers UI)

**2.1 صفحة `/admin/users`**
- جدول بكل المستخدمين (من `profiles` + emails من edge function آمن)
- تعديل الدور (admin فقط)
- تعطيل/تفعيل الحساب
- بحث/فلترة حسب الدور

**2.2 صفحة `/dashboard/team` محسّنة**
- عرض أعضاء المتجر الحالي من `shop_members`
- دعوة عضو جديد (موجود) + تعديل دور العضو + إزالته
- صلاحية: supervisor/manager للمحل فقط

**2.3 Edge function `admin-users-list`**
- يجلب قائمة المستخدمين مع الإيميل من `auth.users` (service role)
- محمي بـ `verify_jwt` + فحص `has_role(admin)`

---

### المرحلة 3 — Realtime + Notifications

**3.1 تفعيل Realtime على الجداول الحرجة**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
```

**3.2 Hook `useRealtimeOrders(shopId)`**
- يستمع لتغيّرات orders في المحل ويحدّث React Query cache تلقائياً.

**3.3 In-app Notifications**
- مكوّن `<NotificationBell />` في الـ AppShell
- عدّاد غير المقروءة + dropdown
- realtime subscription على `notifications` للمستخدم
- إنشاء notification تلقائياً عند: طلب جديد، اشتراك سينتهي، invite مقبول
- Triggers في DB لإنشاء notifications تلقائية

---

### المرحلة 4 — Subscription Limits Enforcement

**4.1 دالة `get_shop_limits(shop_id)` في DB**
- ترجع `max_employees`, `max_branches`, `max_orders_per_month` من خطة المحل.

**4.2 دوال فحص قبل الإدراج**
- Trigger BEFORE INSERT على `employees` و`branches` يرفض إذا تجاوز الحد.
- رسالة خطأ واضحة بالعربية.

**4.3 شاشة "ترقية الخطة"**
- عند رفض الإدراج، dialog يقترح ترقية + رابط `/pricing`.

**4.4 Dashboard usage widget**
- عرض: 4/5 موظفين، 12/100 طلب هذا الشهر، إلخ.

---

### المرحلة 5 — تحسين الأداء

**5.1 Lazy loading للصفحات**
- تحويل كل `import Page from ...` في `App.tsx` إلى `lazy(() => import(...))`
- `<Suspense fallback={<LoadingScreen />}>` حول `<Routes>`
- توفير ~60-70% من حجم bundle الأولي.

**5.2 React Query optimization**
- `staleTime: 30s` افتراضياً للـ queries الثابتة
- `refetchOnWindowFocus: false` للـ dashboards
- `prefetchQuery` للصفحات الشائعة

**5.3 إزالة الـ requests المكرّرة**
- توحيد `useEffectiveRoles` كـ single source (موجود) ومنع جلب الأدوار في كل مكان.

---

### المرحلة 6 — UI/UX

**6.1 Loading states موحّدة**
- مكوّن `<PageSkeleton />` لكل الصفحات
- `<TableSkeleton rows={5} />` للجداول

**6.2 Error boundaries**
- `<ErrorBoundary>` حول كل route رئيسي
- صفحة fallback مع زر "إعادة المحاولة"

**6.3 Empty states**
- "لا توجد طلبات بعد" + CTA لإنشاء أول طلب
- موحّد عبر مكوّن `<EmptyState icon title description action />`

---

## الملفات المتأثّرة (تقريبي)

```text
ملفات جديدة:
  src/pages/AdminUsers.tsx
  src/pages/AdminUsers/RoleEditor.tsx
  src/components/NotificationBell.tsx
  src/components/PageSkeleton.tsx
  src/components/EmptyState.tsx
  src/components/ErrorBoundary.tsx
  src/hooks/useRealtimeOrders.ts
  src/hooks/useNotifications.ts
  src/hooks/useShopLimits.ts
  supabase/functions/admin-users-list/index.ts
  supabase/migrations/<new>.sql  (realtime, limits triggers, notification triggers)

ملفات معدّلة:
  src/App.tsx               (lazy loading + ErrorBoundary)
  src/pages/Login.tsx       (homeForRole redirect)
  src/pages/Signup.tsx      (auto-redirect إذا مسجّل)
  src/components/ProtectedRoute.tsx  (redirect صارم)
  src/components/AppShell.tsx        (NotificationBell)
  src/pages/Team.tsx        (تحسين edit/remove)
  src/pages/Dashboard.tsx   (usage widget)
```

## ما لن يُنفَّذ في هذه الجولة

- **بوابة الدفع** (Stripe/Paddle) — مؤجّل بناءً على طلبك
- **Email notifications** — تتطلب نطاق email مُفعَّل
- **i18n كامل** — موجود حالياً عربي/إنجليزي/فرنسي في الجداول، لا يحتاج تغيير

## المخرجات المتوقّعة

- نظام أدوار صلب لا يمكن تجاوزه عبر URL manipulation
- لوحة admin كاملة لإدارة المستخدمين والأدوار
- تحديثات لحظية للطلبات والإشعارات
- فرض حدود الخطط على مستوى DB (لا يمكن تجاوزها من الواجهة)
- Bundle أصغر بـ ~60% وتحميل أسرع
- UX احترافي مع loading/error/empty states موحّدة

بعد الموافقة، سأنفّذ المراحل بالترتيب في رسالة واحدة موسّعة.
