"use client";

import { CalendarClock, CheckCircle2, ClipboardList, Search, Wrench, X, XCircle, type LucideIcon } from "lucide-react";
import type { OrderGroup, OrderSortKey, OrdersSummary } from "@/infrastructure/services/bookings.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PeriodKey = "all" | "today" | "7d" | "30d" | "12m";

interface GroupDef {
  value: OrderGroup;
  label: string;
  icon: LucideIcon;
  count: (summary: OrdersSummary) => number;
}

/**
 * المجموعات الخمس بترتيب يوم العمل: ما يحتاج تصرّفاً الآن أوّلاً، ثم ما
 * انتهى. «الكل» في المقدّمة لأن الصفحة سجلّ قبل أن تكون قائمة مهام.
 */
export const GROUPS: GroupDef[] = [
  { value: "all", label: "كل الطلبات", icon: ClipboardList, count: (s) => s.total },
  { value: "active", label: "قيد التنفيذ", icon: Wrench, count: (s) => s.active },
  { value: "scheduled", label: "مواعيد محجوزة", icon: CalendarClock, count: (s) => s.scheduled },
  { value: "completed", label: "مكتملة", icon: CheckCircle2, count: (s) => s.completed },
  { value: "cancelled", label: "ملغاة", icon: XCircle, count: (s) => s.cancelled },
];

const PERIOD_OPTIONS: SelectOption[] = [
  { value: "all", label: "كل الأوقات" },
  { value: "today", label: "اليوم" },
  { value: "7d", label: "آخر ٧ أيام" },
  { value: "30d", label: "آخر ٣٠ يوماً" },
  { value: "12m", label: "آخر سنة" },
];

const SORT_BY_DATE: SelectOption[] = [
  { value: "newest", label: "الأحدث أولاً" },
  { value: "oldest", label: "الأقدم أولاً" },
  { value: "amount", label: "الأعلى مبلغاً" },
];

/**
 * في مجموعة المواعيد يفرز المزوّد بالموعد لا بلحظة الحجز: «الأقرب أولاً» هو
 * السؤال الوحيد الذي يطرحه على هذه القائمة صباحاً.
 */
const SORT_BY_SCHEDULE: SelectOption[] = [
  { value: "soonest", label: "الموعد الأقرب أولاً" },
  { value: "latest", label: "الموعد الأبعد أولاً" },
  { value: "amount", label: "الأعلى مبلغاً" },
];

export function sortOptionsFor(group: OrderGroup) {
  return group === "scheduled" ? SORT_BY_SCHEDULE : SORT_BY_DATE;
}

export function defaultSortFor(group: OrderGroup): OrderSortKey {
  return group === "scheduled" ? "soonest" : "newest";
}

/**
 * الفرز الذي ستطلبه المجموعة فعلاً: الحالي إن كان صالحاً فيها، وإلّا افتراضيّها.
 *
 * مشتركة بين النقر والتسخين المسبق عمداً. لو حسب كلٌّ منهما فرزه بنفسه
 * واختلفا، لاختلف مفتاح الذاكرة عن مفتاح الطلب — فيذهب التسخين هدراً
 * ويعود انتظار الشبكة كما كان، دون أيّ عطل ظاهر يدلّ على السبب.
 */
export function resolveSort(group: OrderGroup, current: OrderSortKey): OrderSortKey {
  return sortOptionsFor(group).some((option) => option.value === current)
    ? current
    : defaultSortFor(group);
}

/** بداية النطاق بصيغة ISO، أو `undefined` لِـ «كل الأوقات». */
export function periodStart(period: PeriodKey): string | undefined {
  if (period === "all") return undefined;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === "7d") date.setDate(date.getDate() - 6);
  if (period === "30d") date.setDate(date.getDate() - 29);
  if (period === "12m") date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}

interface OrdersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  group: OrderGroup;
  onGroupChange: (group: OrderGroup) => void;
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  sort: OrderSortKey;
  onSortChange: (sort: OrderSortKey) => void;
  summary: OrdersSummary;
  loadingCounts?: boolean;
  /** يُستدعى عند المرور فوق الرقاقة لجلب مجموعتها قبل النقر */
  onWarmGroup?: (group: OrderGroup) => void;
}

export function OrdersToolbar({
  search,
  onSearchChange,
  group,
  onGroupChange,
  period,
  onPeriodChange,
  sort,
  onSortChange,
  summary,
  loadingCounts,
  onWarmGroup,
}: OrdersToolbarProps) {
  return (
    <Card className="gap-0 p-0">
      {/* ١) البحث — حقل واحد يبحث في كل ما قد يتذكّره المزوّد عن الطلب */}
      <div className="relative p-4">
        <Search
          className="pointer-events-none absolute start-7 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث باسم العميل أو رقم هاتفه أو رقم الطلب…"
          aria-label="بحث في الطلبات"
          className="h-12 rounded-lg ps-12 pe-12 text-base"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onSearchChange("")}
            aria-label="مسح البحث"
            className="absolute end-7 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X aria-hidden />
          </Button>
        )}
      </div>

      {/* ٢) المجموعات — الفلتر الرئيسي. كل رقاقة تحمل عدّادها فيعرف المزوّد
          ماذا سيجد قبل أن ينقر، ولا يقع على قائمة فارغة بلا تفسير. */}
      <div
        role="group"
        aria-label="تصفية الطلبات"
        className="flex gap-2 overflow-x-auto border-t border-border/50 px-4 py-3"
      >
        {GROUPS.map((item) => {
          const active = group === item.value;
          const count = item.count(summary);
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onGroupChange(item.value)}
              onMouseEnter={() => onWarmGroup?.(item.value)}
              onFocus={() => onWarmGroup?.(item.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-elev-1"
                  : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
              <span
                className={cn(
                  "min-w-6 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  active ? "bg-primary-foreground/20" : "bg-background/70"
                )}
              >
                {loadingCounts ? "…" : formatNumber(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ٣) الفترة والترتيب — بتسميات مرئية لا بأيقونات: الجمهور ورشات، و
          قائمة بلا عنوان تعني أن على المزوّد فتحها ليعرف ما تفعله. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/50 px-4 py-3">
        <div className="flex min-w-52 flex-1 items-center gap-3">
          <label htmlFor="orders-period" className="shrink-0 text-sm font-semibold text-muted-foreground">
            الفترة
          </label>
          <Select
            id="orders-period"
            aria-label="الفترة الزمنية"
            value={period}
            onValueChange={(value) => onPeriodChange(value as PeriodKey)}
            options={PERIOD_OPTIONS}
          />
        </div>

        <div className="flex min-w-52 flex-1 items-center gap-3">
          <label htmlFor="orders-sort" className="shrink-0 text-sm font-semibold text-muted-foreground">
            الترتيب
          </label>
          <Select
            id="orders-sort"
            aria-label="ترتيب الطلبات"
            value={sort}
            onValueChange={(value) => onSortChange(value as OrderSortKey)}
            options={sortOptionsFor(group)}
          />
        </div>
      </div>
    </Card>
  );
}
