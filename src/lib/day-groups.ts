import type { DateLike } from "@/domain/entities/booking.types";
import { formatDate } from "@/lib/format";

/**
 * تجميع أي سجلّ بأيّامه.
 *
 * سجلّ الطلبات وسجلّ الحركات المالية يُقرآن بالطريقة نفسها — «اليوم»، «أمس»،
 * ثم اسم اليوم — فالمنطق هنا لا في كل صفحة على حدة، وإلّا انحرف أحدهما عن
 * الآخر بعد أوّل تعديل.
 */
export interface DaySection<T> {
  day: Date;
  items: T[];
}

function startOfDay(value: DateLike) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function groupByDay<T>(items: T[], getDate: (item: T) => DateLike): Array<DaySection<T>> {
  const buckets = new Map<number, DaySection<T>>();

  for (const item of items) {
    // سطر بتاريخ تالف لا يُسقَط: يُجمَع تحت الحقبة صفر بدل أن يختفي بصمت —
    // والاختفاء الصامت هو أسوأ ما قد تفعله شاشة سجلّ.
    const key = (startOfDay(getDate(item)) ?? new Date(0)).getTime();
    const bucket = buckets.get(key);
    if (bucket) bucket.items.push(item);
    else buckets.set(key, { day: new Date(key), items: [item] });
  }

  return [...buckets.values()];
}

/** «اليوم» و«أمس» و«غداً» تُقرأ أسرع من تاريخ كامل، والباقي يحتاج اسم يومه. */
export function dayHeading(day: Date): { title: string; subtitle?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return { title: "اليوم", subtitle: formatDate(day, "medium") };
  if (diffDays === -1) return { title: "أمس", subtitle: formatDate(day, "medium") };
  if (diffDays === 1) return { title: "غداً", subtitle: formatDate(day, "medium") };
  return { title: formatDate(day, "weekday") };
}
