## الهدف
توحيد خلفية كل الصفحات (لوحة الإدارة، لوحة المالك، الشريط الجانبي، الشريط العلوي، التذييل المتنقل) على **أسود غامق حقيقي** بدلاً من الرمادي المزرق الحالي.

## المشكلة
حالياً المتغير `--background` أسود (`0 0% 0%`)، لكن المكونات الرئيسية تستخدم ألواناً مكتوبة يدوياً (hard-coded) مزرقّة:
- `Layout.tsx` → `bg-[hsl(220_30%_5%)]` و header `hsl(220_30%_6%)`
- `OwnerLayout.tsx` → `hsl(220_30%_4%)` و `hsl(220_30%_5%)`
- `AppSidebar.tsx` → `hsl(220_30%_7%)` + بطاقات `hsl(220_25%_10%)` و `hsl(220_30%_12%)`
- `MobileBottomNav.tsx` → `bg-card`
- بعض البطاقات في الـ topbar تستخدم `hsl(220_25%_10%)`

## التغييرات

### 1) `src/components/Layout.tsx`
- خلفية الـ wrapper: `bg-[hsl(220_30%_5%)]` → `bg-black`
- خلفية الـ header: `bg-[hsl(220_30%_6%)]/95` → `bg-black/95`
- إبقاء الحدود الرمادية الخفيفة كما هي للتمييز

### 2) `src/components/OwnerLayout.tsx`
- wrapper: `bg-[hsl(220_30%_4%)]` → `bg-black`
- header: `bg-[hsl(220_30%_5%)]/95` → `bg-black/95`

### 3) `src/components/AppSidebar.tsx`
- `SidebarContent` خلفية: `bg-[hsl(220_30%_7%)]` → `bg-black`
- بطاقات داخل السايدبار (brand header، admin card، toggle، carte الفرع): تخفيفها إلى `bg-[hsl(0_0%_6%)]` بدلاً من `hsl(220_25%_10%)` لتظل قابلة للتمييز فوق الأسود لكن دون لون أزرق

### 4) `src/index.css`
- التأكد من أن `body` و `html` يحملان `background: hsl(var(--background))` (أسود نقي)
- ضبط `--card`, `--popover`, `--sidebar-background` على درجات سوداء/رمادية محايدة (بدون hue 220 المزرق):
  - `--card: 0 0% 5%`
  - `--popover: 0 0% 4%`
  - `--sidebar-background: 0 0% 3%`
  - `--secondary: 0 0% 10%`
  - `--muted: 0 0% 8%`
  - `--input: 0 0% 10%`
- نفس القيم في الكتلة `.dark`

### 5) `src/components/MobileBottomNav.tsx`
- يستخدم `bg-card` بالفعل، سيصبح أسود تلقائياً بعد تعديل `--card`

## النتيجة المتوقعة
كل الصفحات (Dashboard, Orders, Services, Owner, Login… إلخ) ستظهر بخلفية سوداء غامقة موحّدة، مع الحفاظ على:
- الأزرار الزرقاء المتوهجة (button glow)
- الحدود الخفيفة بين الأقسام
- ألوان النصوص والأيقونات الحالية