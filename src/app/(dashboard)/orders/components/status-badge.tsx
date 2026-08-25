"use client";

import {
  CalendarClock,
  Car,
  CheckCircle2,
  Hourglass,
  MapPin,
  UserCheck,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "warning" | "info" | "success" | "danger" | "default" | "neutral";

interface StatusConfig {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
  /** جملة واحدة تشرح ما يعنيه هذا الوضع عملياً لصاحب الورشة */
  hint: string;
}

/**
 * حالات الطلب: التسمية العربية + النغمة الدلالية + أيقونة + شرح بالعربية.
 *
 * كانت الألوان سلاسل tailwind خام لتسع حالات موزّعة على سبع لوحات مختلفة
 * (amber/blue/cyan/sky/indigo/violet/emerald/rose/red) دون معنى مشترك بينها —
 * فلا يستطيع المزوّد أن يتعلّم أن لوناً بعينه يعني شيئاً بعينه.
 * صارت أربع نغمات تحمل معنى: انتظار، قيد التنفيذ، نجاح، فشل.
 *
 * الأيقونة و`hint` أُضيفتا لأن جمهور هذه اللوحة ورشات لا مشغّلو أنظمة: تسعة
 * أسماء حالات متقاربة («تم التعيين»/«في الطريق»/«وصل المزوّد») لا تُميَّز
 * باللون وحده، والشرح يغني عن أن يسأل أحدهم عمّا تعنيه الكلمة.
 */
export const STATUS_MAP: Record<string, StatusConfig> = {
  pending: {
    label: "بانتظار الفنّي",
    tone: "warning",
    icon: Hourglass,
    hint: "الطلب معروض الآن على تطبيق الفنّي بانتظار قبوله.",
  },
  accepted: {
    label: "مقبول",
    tone: "info",
    icon: UserCheck,
    hint: "قُبل الطلب ولم يبدأ التنفيذ بعد.",
  },
  provider_assigned: {
    label: "تم تعيين فنّي",
    tone: "info",
    icon: UserCheck,
    hint: "أُسند الطلب إلى فنّي من فريقك.",
  },
  provider_en_route: {
    label: "الفنّي في الطريق",
    tone: "info",
    icon: Car,
    hint: "الفنّي متوجّه إلى موقع العميل.",
  },
  provider_arrived: {
    label: "الفنّي وصل",
    tone: "info",
    icon: MapPin,
    hint: "الفنّي على موقع العميل بانتظار بدء العمل.",
  },
  in_progress: {
    label: "جارٍ التنفيذ",
    tone: "default",
    icon: Wrench,
    hint: "العمل جارٍ الآن على مركبة العميل.",
  },
  completed: {
    label: "مكتمل",
    tone: "success",
    icon: CheckCircle2,
    hint: "أُنجز الطلب وأُغلق.",
  },
  cancelled: {
    label: "ملغى",
    tone: "danger",
    icon: XCircle,
    hint: "أُلغي الطلب قبل إنجازه.",
  },
  rejected: {
    label: "مرفوض",
    tone: "danger",
    icon: XCircle,
    hint: "رُفض الطلب ولم يُنفَّذ.",
  },
};

const FALLBACK: StatusConfig = {
  label: "غير معروف",
  tone: "neutral",
  icon: CalendarClock,
  hint: "حالة غير معروفة لدى اللوحة.",
};

export function statusConfig(status: string): StatusConfig {
  return STATUS_MAP[status] ?? { ...FALLBACK, label: status || FALLBACK.label };
}

/** خلفية/حدّ/نص الأيقونة لكل نغمة — تُشارَك بين الصفّ ونافذة التفاصيل. */
export const TONE_SURFACE: Record<StatusTone, string> = {
  warning: "border-warning/25 bg-warning/10 text-warning-soft",
  info: "border-info/25 bg-info/10 text-info-soft",
  success: "border-success/25 bg-success/10 text-success-soft",
  danger: "border-danger/25 bg-danger/10 text-danger-soft",
  default: "border-primary/25 bg-primary/10 text-primary",
  neutral: "border-border bg-secondary/60 text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
  withIcon = false,
}: {
  status: string;
  className?: string;
  withIcon?: boolean;
}) {
  const config = statusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.tone === "default" ? "default" : config.tone}
      className={cn("h-6 rounded-full border px-2.5 font-semibold", className)}
    >
      {withIcon && <Icon aria-hidden />}
      {config.label}
    </Badge>
  );
}
