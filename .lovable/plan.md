## URGENT FIX — إعادة قائمة الخدمات لجميع الأدوار

### تشخيص (قبل أي تعديل)

| الدور | الوصول الحالي | الحالة |
|---|---|---|
| **Owner** | لا route تحت `/owner/*` للخدمات → الشريط لا يحتوي رابط | ❌ مفقود |
| **Admin / Supervisor / Manager** | `/services` داخل AppShell، يعمل عبر `services_select_member` RLS | ✅ يعمل |
| **Employee** | `/dashboard/services` (read-only) | ✅ يعمل |
| **Customer** | معروض في `CustomerApp` كقائمة | ✅ يعمل |

**السبب الجذري:** عند فصل لوحة الأونر تحت `/owner/*` (PR1)، لم يُضَف رابط/route للخدمات. الـ RLS و query تحميل الخدمات سليمة. لا حاجة لتعديل قاعدة البيانات.

### الملفات

**To change:**
- `src/components/OwnerSidebar.tsx` — إضافة عنصر "الخدمات" تحت مجموعة "إدارة المنصة".
- `src/App.tsx` — إضافة `<Route path="/owner/services" element={<Services />} />` داخل OwnerShell.
- `src/pages/Services.tsx` — للأونر فقط: dropdown لاختيار المتجر (All / shop X) + بادج اسم المتجر بجانب كل خدمة.

**New files:** لا شيء.

**Removals:** لا شيء (No-Deletion Policy).

### Data wiring

- `useApp().services` يستعمل `supabase.from('services').select('*')` بدون فلترة → RLS يتولى:
  - Owner يرى الكل (`services_owner_all`).
  - باقي الأدوار يرون متجرهم فقط (`services_select_member` عبر `is_shop_member`).
- لا تغيير في الاستعلام. لا hardcoded data.

### للأونر — Filter حسب المتجر

- إضافة state `ownerShopFilter: "all" | shopId`.
- يظهر `<Select>` فقط حين `isOwner === true` و `tenantShops.length > 1`.
- يطبَّق فلتر JS بعد الجلب.
- بادج صغير `Shop: <name>` يظهر في كل صف فقط للأونر، حتى يميّز أصول المتاجر.

### Security / Scope

- RLS موجودة وصحيحة — لا تُعدّل.
- لا توسعة لصلاحيات الكتابة.
- زر "خدمة جديدة" يبقى محكوماً بـ `isAdmin` (الموجود حالياً)، والـ DB trigger `enforce_service_limit` يحمي 60/متجر.

### Quality gates

- `tsc --noEmit` ✅
- Owner: يرى Services من `/owner/services` + يفلتر بحسب shop.
- Manager/Admin/Supervisor: `/services` كما هو.
- Employee: `/dashboard/services` كما هو.
- لا cross-shop write للأدوار غير الأونر (محمي بـ `services_*_manager` policies الموجودة).

### Diff Report (سيُسلَّم بعد التنفيذ)
- Added: عنصر sidebar + route + UI filter + badge.
- Updated: 3 ملفات (`OwnerSidebar.tsx`, `App.tsx`, `Services.tsx`).
- Removed: (فارغ).
- Migrations: لا شيء.
- RLS changes: لا شيء.
- Build/typecheck: سيُشغَّل ويُبلّغ.
