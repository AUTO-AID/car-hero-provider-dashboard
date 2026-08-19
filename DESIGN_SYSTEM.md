# نظام التصميم — لوحة مزوّد الخدمة

> المرجع الوحيد لبناء أي شاشة جديدة في `car-hero-provider-dashboard`.
> القاعدة: **لا تكتب CSS مخصّصاً ولا سلاسل ألوان خام في الصفحات.** إن لم تجد ما تحتاجه هنا، أضفه هنا أولاً.

---

## 1) التوكنات (`src/app/globals.css`)

### الألوان
كل الألوان تُعرّف كثلاثيات HSL بلا `hsl()` لتقبل الشفافية: `hsl(var(--x) / 0.5)`.

| المجموعة | التوكنات | الاستخدام |
|----------|----------|-----------|
| الأساس | `--background` `--foreground` `--card` `--popover` | الأسطح والنصوص |
| الهوية | `--primary` `--primary-foreground` | لون كار هيرو البنفسجي `#8f5cb1` |
| محايد | `--secondary` `--muted` `--muted-foreground` `--border` `--input` `--ring` | الحدود والحقول والنص الثانوي |
| **دلالي** | `--success` `--warning` `--danger` `--info` + نسخة `-soft` لكلٍّ منها | الحالات |
| الرسوم | `--chart-1` … `--chart-5` | ألوان المخطّطات |

**القاعدة:** `-soft` هي درجة **النص** المقروءة فوق خلفية داكنة؛ الأساس (`--success`) للحدود والخلفيات الشفّافة.

```jsx
/* ✅ */ <span className="border-success/25 bg-success/10 text-success-soft">مكتمل</span>
/* ❌ */ <span className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">مكتمل</span>
```

### الزوايا
`--radius: 0.75rem` هو الأساس، والباقي مشتقّ منه:

| الفئة | القيمة | الاستخدام |
|-------|--------|-----------|
| `rounded-md` | 10px | الحقول والأزرار الصغيرة |
| `rounded-lg` | 12px | الأزرار |
| `rounded-xl` | 16px | البطاقات والحوارات |
| `rounded-2xl` | 20px | الأسطح الكبيرة |
| `rounded-full` | — | الشارات والرقائق والصور الرمزية |

لا تستخدم `rounded-[1.25rem]` ولا أي قيمة عشوائية.

### الارتفاع (الظلال)
`shadow-elev-1` (حافة) · `shadow-elev-2` (بطاقة طافية) · `shadow-elev-3` (حوار/قائمة منسدلة).
لا `shadow-2xl shadow-black/20`، ولا توهّجات ملوّنة حول البطاقات.

### الطبقات
`--z-header: 30` · `--z-sidebar: 50` · `--z-scrim: 55` · `--z-drawer: 58` · `--z-overlay: 60`.

### الطباعة
- الخط: **IBM Plex Sans Arabic** (400/500/600/700) محمّل في `app/layout.tsx`. المعرّفات اللاتينية بـ `font-mono` (IBM Plex Mono).
- `font-black` مربوط بالوزن 700: العائلة لا تتجاوزه، والتغميق الصناعي يشوّه اتصال الحروف.
- **ممنوع `tracking-*` على أي نص عربي** — يقطع اتصال الحروف. مسموح فقط داخل `dir="ltr"`.
- **ممنوع `uppercase` على العربية** — بلا معنى.
- ارتفاع السطر: 1.75 للنص، 1.35 للعناوين (مضبوط عالمياً، لا تعِده في الصفحات).

---

## 2) الاتجاه (RTL)

المستند `<html lang="ar" dir="rtl">`. بناءً عليه:

| ✅ استخدم | ❌ لا تستخدم |
|-----------|--------------|
| `ms-` `me-` `ps-` `pe-` | `ml-` `mr-` `pl-` `pr-` |
| `start-*` `end-*` | `left-*` `right-*` |
| `text-start` `text-end` | `text-left` `text-right` |
| `border-s` `border-e` | `border-l` `border-r` |

- **لا تضع `dir="rtl"`** على أي عنصر — المستند عربي أصلاً.
- **ضع `dir="ltr"`** على: أرقام الهواتف، IBAN، أرقام الطلبات والمعاملات، البريد الإلكتروني.
- الاستثناء الوحيد للخصائص الفيزيائية: تمركز الحوار (`left-1/2 -translate-x-1/2`) وهو محايد الاتجاه.

---

## 3) المكوّنات

### البدائيات (`src/components/ui/`)

| المكوّن | ملاحظات |
|---------|---------|
| `Card` | `relative` + حدّ واحد. **لا تضف `border`** في الصفحة إلا لتغيير اللون. الحشو عبر `className="p-5"`. |
| `Button` | `variant`: `default` \| `outline` \| `secondary` \| `ghost` \| `destructive` \| `destructive-soft` \| `link`. **استخدم `loading` بدل تمرير سبينر يدوياً.** منطقة اللمس موسّعة إلى 44px عبر `after` دون تغيير الحجم المرئي. |
| `Input` / `Textarea` | تنسّق نفسها. لا تمرّر خلفيات أو حلقات تركيز مخصّصة. |
| `Select` | يستبدل `<select>` الأصلية. `options={[{value,label}]}` + `aria-label` **إلزامي** في أشرطة الفلاتر. |
| `Field` | تسمية + حقل + `hint`/`error`. يربط `aria-describedby` و`aria-invalid` تلقائياً. |
| `Badge` | `variant`: `success` \| `warning` \| `danger` \| `info` \| `neutral` + الافتراضية. |
| `Skeleton` / `SkeletonList` | التنفيذ الوحيد. لا `animate-pulse` يدوي. |
| `Switch` | لثنائيات الحالة. غلّفه بـ `<label>` ليكون النص جزءاً من منطقة النقر. |
| `Dialog` | `max-h-[85vh]` مع تمرير داخلي. |

### المكوّنات المركّبة

| المكوّن | يستبدل |
|---------|--------|
| `PageHeader` | رؤوس الصفحات المكتوبة يدوياً |
| `DataToolbar` | شبكة الفلاتر + **رقائق الفلاتر النشطة** + مسح الكل |
| `Pagination` | زرَّي "السابق/التالي" |
| `ConfirmDialog` | حوارات التأكيد اليدوية |
| `EmptyState` / `ErrorState` / `LoadingState` | حالات الشاشة المتفرّقة |
| `StatCard` | بطاقة مؤشّر — `tone` بدل ثلاث سلاسل ألوان |
| `Money` / `RelativeTime` | كل استدعاءات `toLocaleString` |

---

## 4) التنسيق (`src/lib/format.ts`)

**مصدر واحد.** لا تستدعِ `toLocaleString` ولا `toLocaleDateString` في أي مكوّن.

```ts
LOCALE = "ar-SY-u-nu-latn"   // أسماء شهور شامية (آب) + أرقام لاتينية
formatNumber() formatAmount() formatCompact()
formatDate(v, "short"|"medium"|"long"|"weekday") formatDateTime() formatTime()
formatRelative() formatWeekdayShort()
currencyLabel(code)          // SYP → ل.س ، SAR → ر.س
```

العملة تأتي من الخادم (`wallet.currency`) وتُمرَّر إلى `<Money currency={...} />` — لا تكتب `ل.س` نصّاً.

---

## 5) قواعد التغذية الراجعة

| الآلية | متى |
|--------|-----|
| **Inline** تحت الحقل | خطأ في حقل نموذج — عبر `Field error=` |
| **Banner** داخل الصفحة | حالة مستمرّة (الحساب قيد المراجعة، رصيد افتتاحي) |
| **Toast** | نتيجة عملية عابرة (تم الحفظ، فشل الطلب) |
| **Dialog** | قرار حاجز فقط (تأكيد إلغاء أو حذف) |

**لا تُبلّغ خطأ تحقّق عبر toast وحده** — المستخدم لن يعرف أي حقل يقصد.

ترتيب أزرار الحوار: **التراجع أولاً في ترتيب القراءة، والتأكيد في النهاية.** يفرضه `ConfirmDialog`.

---

## 6) الحركة

- الحركات الزخرفية اللانهائية ممنوعة على المحتوى. المسموح: `animate-fade-in`، `animate-fade-in-up`، `stagger`، ومؤشرات التقدّم.
- كل الحركات مُلغاة تحت `prefers-reduced-motion: reduce` عدا `animate-spin` (مؤشر حالة).
- `backdrop-blur` للأسطح الطافية فقط (شريط جانبي، هيدر، حوار) — لا على البطاقات العادية.

---

## 7) قائمة مراجعة قبل الدمج

- [ ] لا `toLocaleString` خارج `lib/format.ts`
- [ ] لا خصائص فيزيائية (`mr/ml/pr/pl`, `left/right`)
- [ ] لا `tracking-*` ولا `uppercase` على نص عربي
- [ ] لا ألوان tailwind خام (`emerald-*`, `rose-*`, `amber-*`, `sky-*`)
- [ ] لا `<select>` أصلية
- [ ] كل زرّ أيقوني له `aria-label`
- [ ] الشاشة تعرض حالات: تحميل / فراغ / خطأ / بيانات كثيفة
- [ ] `npm run lint && npx tsc --noEmit && npm run build` نظيفة
