
المستخدم يريد تطبيق ستايل HN-DRIVER (من الصورة) — وهو مختلف عن ستايل /admin/leads الحالي. الميزات البارزة في الصورة:

- سايدبار غامق (slate-900) بعرض أكبر مع كروت أزرار كبيرة (rounded-2xl) لكل عنصر قائمة
- كرت "Administrator" أعلى السايدبار: أيقونة برتقالية دائرية + اسم + بادج رقم مرجعي برتقالي (A562576)
- شعار اللوحة في الأعلى: أيقونة + "Panneau d'administration" + "Control Panel"
- كروت KPI كبيرة (rounded-2xl) بخلفية slate-800/50 مع أيقونة ملوّنة في الأعلى يسار + رقم ضخم + label أسفل
- شريط علوي: dropdowns (دولة/مدينة) + بحث + زر Déconnexion + counters (3776 / 1023 / 106)
- ألوان: خلفية navy غامق `hsl(220 30% 8%)`، نص فاتح، accents برتقالي/أزرق/أخضر/بنفسجي للأيقونات

## الخطة

### 1. السايدبار — `src/components/AppSidebar.tsx`
- خلفية `bg-[hsl(220_30%_10%)]` بعرض أكبر (`w-72`)
- header: أيقونة دائرية + "Panneau d'administration" + "Control Panel"
- كرت Administrator أسفل header: دائرة برتقالية + اسم + بادج برتقالي مرجعي (آخر 7 أحرف من user.id)
- عناصر القائمة: كروت كبيرة `rounded-2xl py-4 px-4 bg-slate-800/40` مع أيقونة + نص، النشط بحدود برتقالية + glow
- بادج عدّاد على يمين بعض العناصر (مثل "Demandes 6")

### 2. شريط علوي موحّد — `src/components/Layout.tsx`
- إضافة topbar ثابت: dropdowns بلد/مدينة (إن لزم) + حقل بحث + زر Déconnexion برتقالي + 3 counters صغيرة (eye/users/trend) + LanguageSwitcher
- خلفية `bg-[hsl(220_30%_6%)]` مع border سفلي خفيف

### 3. صفحة AdminDashboard — `src/pages/AdminDashboard.tsx`
- عنوان كبير مع إيموجي 📊 + التاريخ بالفرنسية
- شبكة KPI: كروت `rounded-2xl bg-slate-800/40 p-6` — أيقونة ملوّنة (12x12) أعلى يسار، رقم ضخم `text-5xl`، label أسفل
- ألوان أيقونات متنوّعة: أزرق/برتقالي/أخضر/بنفسجي/أصفر

### 4. توحيد الـ tokens
- لن أعدّل `index.css` بشكل جذري — فقط استخدام Tailwind classes مباشرة
- ألوان مرجعية: bg `hsl(220 30% 8%)`، sidebar `hsl(220 30% 10%)`، card `hsl(220 25% 14%)`، accent برتقالي `hsl(28 90% 55%)`

### 5. تطبيق تجريبي على صفحة واحدة فقط
- أبدأ بـ **AdminDashboard + AppSidebar + Layout topbar** كنموذج
- بعد موافقتك على الشكل، أعمّم على باقي صفحات الأدمن والمالك

## الملفات المعدّلة (3 ملفات فقط في هذه الجولة)
1. `src/components/AppSidebar.tsx` — إعادة تصميم كامل بستايل HN-DRIVER
2. `src/components/Layout.tsx` — topbar جديد بالعناصر المذكورة
3. `src/pages/AdminDashboard.tsx` — KPIs بالشكل الجديد + header

بعد رؤيتك للنتيجة، أطبّق نفس النمط على باقي الصفحات.
