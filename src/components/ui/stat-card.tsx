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
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  loading?: boolean;
  children?: ReactNode;
  /** أعمدة صغيرة تلخّص اتجاهاً — قيم مطبَّعة بين 0 و1 */
  sparkline?: number[];
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
  sparkline,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("gap-4 p-5", className)}>
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
      </Card>
    );
  }

  return (
    <Card className={cn("gap-3 p-5 transition-colors hover:border-border", className)}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border",
            TONES[tone]
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>

        {sparkline && sparkline.length > 0 && (
          <div className="flex h-8 flex-1 items-end justify-end gap-[3px]" aria-hidden>
            {sparkline.map((height, index) => (
              <div
                key={index}
                className="w-1.5 rounded-sm bg-primary/35"
                style={{ height: `${Math.max(height, 0.06) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-3xl leading-none font-bold text-foreground tabular-nums">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground/80">{subtitle}</p>}
      </div>

      {children}
    </Card>
  );
}
