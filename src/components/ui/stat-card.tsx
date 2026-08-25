"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

/**
 * نغمات دلالية بدل تمرير ثلاث سلاسل tailwind خام لكل بطاقة
 * (`iconBg="from-emerald-500/20 to-emerald-500/5"` + `iconColor="text-emerald-400"`
 * + `glowClass="glow-green"`) — وهو ما كان يتكرّر في كل صفحة بقيم مختلفة قليلاً.
 */
const TONES = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/10 text-success-soft",
  warning: "border-warning/20 bg-warning/10 text-warning-soft",
  danger: "border-danger/20 bg-danger/10 text-danger-soft",
  info: "border-info/20 bg-info/10 text-info-soft",
} as const;

interface StatCardProps {
  title: string;
  /**
   * `ReactNode` وليس نصّاً: المبالغ تُمرَّر كـ `<Money/>` كي تأتي العملة من
   * الخادم لا من `"ل.س"` مكتوبة يدوياً في الصفحة. الأرقام العارية تبقى
   * تمرّ على `formatNumber` كما كانت.
   */
  value: ReactNode;
  /**
   * سطر تنبيه يظهر كشارة ملوّنة تحت الرقم. لأنه يُرسم بوزن بصري عالٍ،
   * لا يُمرَّر إلا لِما يستدعي تصرّفاً — «٣ طلبات تنتظر ردّك» نعم،
   * «على مدى ٧ أشهر» لا. الحشو هنا يسرق الانتباه من الرقم نفسه.
   */
  subtitle?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "primary",
  loading,
  children,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("gap-3 p-5", className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-9 w-24" />
      </Card>
    );
  }

  return (
    <Card className={cn("gap-3 p-5 transition-colors hover:border-border", className)}>
      {/* العنوان بجانب الأيقونة لا تحته: القارئ يعرف ما يقيسه الرقم قبل أن
          يقرأه، لا بعده. وكانت مكانه أعمدة اتجاه صغيرة بلا محور ولا مقياس —
          تزيّن ولا تُقرأ، والجمهور هنا ورشات لا محلّلو بيانات. */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl border",
            TONES[tone]
          )}
        >
          <Icon className="size-6" aria-hidden />
        </span>
        <p className="min-w-0 text-lg leading-snug font-bold text-foreground">{title}</p>
      </div>

      <p className="text-4xl leading-none font-bold text-foreground tabular-nums">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>

      {subtitle && (
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-lg border px-2.5 py-1 text-sm font-semibold",
            TONES[tone]
          )}
        >
          {subtitle}
        </span>
      )}

      {children}
    </Card>
  );
}
