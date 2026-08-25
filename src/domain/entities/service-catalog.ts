import {
  BatteryCharging,
  CircleDotDashed,
  CircleGauge,
  Droplets,
  Fuel,
  KeyRound,
  SprayCan,
  TriangleAlert,
  Truck,
  Wrench,
} from "lucide-react";

/**
 * كتالوج المنصّة — الخدمات التسع، تعريفاً واحداً للوحة الأدمن.
 *
 * الفئة هي **هوية الخدمة** لا وسماً عليها: منها يُشتقّ الاسم العربي والأيقونة
 * واللون في كل شاشة. كانت هذه الثلاثة مكتوبة في `services/page.tsx` وحدها،
 * بفئات لم تعد في الخادم (`roadside_assistance`, `maintenance`) وبلا الفئات
 * الثلاث الجديدة — فكانت شرائح المزوّدين تعرض معرّفات إنجليزية خاماً لأي خدمة
 * أضيفت بعد كتابة ذلك الجدول.
 *
 * النظائر: `CAR_HERO_BACKEND/src/config/service-catalog.ts` (المصدر)،
 * و`car-hero-provider-dashboard/src/domain/entities/service-catalog.ts`،
 * و`serviceCatalog.js` في التطبيقين، و`content/services.js` في الموقع.
 */
export interface ServiceCategoryMeta {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}

/** بترتيب العرض. المفاتيح هي `category` في الخادم حرفياً. */
export const categoryMeta: Record<string, ServiceCategoryMeta> = {
  towing: { label: "خدمة السحب", color: "text-info", bg: "bg-blue-500/10 border-blue-500/20", icon: Truck },
  battery: { label: "تشغيل البطارية", color: "text-info", bg: "bg-violet-500/10 border-violet-500/20", icon: BatteryCharging },
  tire: { label: "تغيير الإطار", color: "text-danger", bg: "bg-rose-500/10 border-rose-500/20", icon: CircleDotDashed },
  fuel: { label: "توصيل الوقود", color: "text-warning", bg: "bg-amber-500/10 border-amber-500/20", icon: Fuel },
  lockout: { label: "فتح الأقفال", color: "text-info", bg: "bg-cyan-500/10 border-cyan-500/20", icon: KeyRound },
  oil: { label: "تغيير الزيت", color: "text-success", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Droplets },
  breakdown: { label: "أعطال مفاجئة", color: "text-warning", bg: "bg-orange-500/10 border-orange-500/20", icon: TriangleAlert },
  engine: { label: "مشاكل المحرك", color: "text-danger", bg: "bg-red-500/10 border-red-500/20", icon: CircleGauge },
  car_wash: { label: "غسيل السيارة", color: "text-info", bg: "bg-sky-500/10 border-sky-500/20", icon: SprayCan },
};

export const SERVICE_CATEGORIES = Object.keys(categoryMeta);

/**
 * فئات متقاعدة ما زالت في وثائق قديمة.
 *
 * الخادم لا يقبل كتابتها بعد الآن لكنه يقرؤها، فاللوحة تحتاج أن تعرف أين
 * تعرضها — بدونها كانت الخدمة القديمة تسقط إلى شريحة بلا اسم ولا أيقونة.
 */
const LEGACY_ALIAS: Record<string, string> = {
  maintenance: "oil",
  roadside_assistance: "breakdown",
  other: "breakdown",
  emergency: "breakdown",
};

/** شريحة محايدة لفئة مجهولة تماماً — أفضل من `undefined` يُسقِط الصف. */
export const UNKNOWN_CATEGORY_META: ServiceCategoryMeta = {
  label: "غير مصنّفة",
  color: "text-muted-foreground",
  bg: "bg-slate-500/10 border-slate-500/20",
  icon: Wrench,
};

/** **لا تُرجع `undefined` أبداً**: تُقرأ منها `.icon` مباشرةً كوسم JSX. */
export function categoryMetaFor(category?: string | null): ServiceCategoryMeta {
  if (!category) return UNKNOWN_CATEGORY_META;
  return categoryMeta[category] ?? categoryMeta[LEGACY_ALIAS[category]] ?? UNKNOWN_CATEGORY_META;
}

/** الاسم العربي للفئة، بتراجع مقروء. */
export function categoryLabel(category?: string | null): string {
  if (!category) return "";
  const meta = categoryMeta[category] ?? categoryMeta[LEGACY_ALIAS[category]];
  return meta?.label ?? String(category).replace(/_/g, " ");
}
