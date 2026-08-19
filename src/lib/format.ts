import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

/**
 * مصدر التنسيق الوحيد في اللوحة.
 *
 * قبل هذا الملف كانت الشاشة الواحدة تعرض ثلاثة أنظمة أرقام معاً:
 * `ar-SY` و`ar-EG` (أرقام هندية ١٢٣) و`toLocaleString()` بلا locale (أرقام لاتينية 123).
 *
 * الخيار المعتمد: **أسماء شهور شامية + أرقام لاتينية** (`-u-nu-latn`).
 * السبب: الأرقام اللاتينية هي السائدة في السياق التجاري السوري، وهي الوحيدة
 * التي تصطفّ بعرض ثابت مع `font-variant-numeric: tabular-nums` في الجداول.
 * لتبديل نظام الأرقام كلّه، غيّر هذا الثابت وحده.
 */
export const LOCALE = "ar-SY-u-nu-latn";

/** رموز العملات → تسميتها العربية المختصرة. الخادم قد يعيد SAR افتراضياً. */
const CURRENCY_LABELS: Record<string, string> = {
  SYP: "ل.س",
  SAR: "ر.س",
  USD: "$",
  EUR: "€",
};

export const DEFAULT_CURRENCY = "SYP";

export function currencyLabel(code?: string | null) {
  if (!code) return CURRENCY_LABELS[DEFAULT_CURRENCY];
  return CURRENCY_LABELS[code.toUpperCase()] ?? code;
}

/** رقم عادي (عدّاد، كمية، نسبة). */
export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(LOCALE, options).format(value ?? 0);
}

/**
 * مبلغ مالي. الكسور تُعرض فقط عند وجودها حتى لا تمتلئ الجداول بـ `,00`
 * التي لا تضيف معلومة.
 */
export function formatAmount(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value ?? 0);
}

/** اختصار المبالغ الكبيرة على محاور الرسوم: 12,400 → 12.4 ألف */
export function formatCompact(value: number | null | undefined) {
  const amount = value ?? 0;
  if (Math.abs(amount) < 1000) return formatNumber(amount);
  return new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_STYLES: Record<"short" | "medium" | "long" | "weekday", Intl.DateTimeFormatOptions> = {
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  medium: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  weekday: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
};

export function formatDate(value: DateInput, style: keyof typeof DATE_STYLES = "medium") {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALE, DATE_STYLES[style]).format(date);
}

export function formatDateTime(value: DateInput) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(value: DateInput) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" }).format(date);
}

/** "منذ 3 أيام" — تُستدعى بعد التركيب فقط لتفادي اختلاف الخادم عن العميل. */
export function formatRelative(value: DateInput) {
  const date = toDate(value);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: ar });
}

/** اسم اليوم المختصر — لمحاور الرسوم الأسبوعية. */
export function formatWeekdayShort(value: DateInput) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(date);
}
