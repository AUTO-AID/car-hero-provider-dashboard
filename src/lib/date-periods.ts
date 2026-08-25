/**
 * الفترات الزمنية المشتركة بين سجلّ الطلبات وسجلّ الأرباح.
 *
 * تعريفٌ واحد لا نسخة في كل شاشة: «آخر ٧ أيام» يجب أن تعني الشيء نفسه في
 * الصفحتين، وإلّا ظهر للمزوّد عددُ طلبات لا يطابق عدد الأرباح لفترةٍ يظنّها
 * واحدة.
 */
export type PeriodKey = "all" | "today" | "7d" | "30d" | "12m";

export const PERIODS: Array<{ value: PeriodKey; label: string }> = [
  { value: "all", label: "كل الأوقات" },
  { value: "today", label: "اليوم" },
  { value: "7d", label: "آخر ٧ أيام" },
  { value: "30d", label: "آخر ٣٠ يوماً" },
  { value: "12m", label: "آخر سنة" },
];

/**
 * بداية النطاق بصيغة ISO، أو `undefined` لِـ «كل الأوقات».
 *
 * مثبّتة على بداية اليوم عمداً: لو حُسبت من اللحظة الراهنة لتغيّرت القيمة مع
 * كل تصيير، فيتغيّر معها مفتاح الذاكرة ويُعاد الجلب بلا سبب.
 */
export function periodStart(period: PeriodKey): string | undefined {
  if (period === "all") return undefined;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === "7d") date.setDate(date.getDate() - 6);
  if (period === "30d") date.setDate(date.getDate() - 29);
  if (period === "12m") date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}
