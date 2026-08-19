"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * حالات الشاشة الثلاث في مكان واحد.
 *
 * كانت اللوحة تعرض ستّ حالات فراغ وخمس حالات خطأ بأشكال مختلفة تماماً:
 * سبينر في المنتصف هنا، نبض هناك، ونص عارٍ في ثالثة — فبدت كل شاشة وكأنها
 * من منتج مختلف.
 */

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** نسخة مضغوطة داخل بطاقة صغيرة */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "py-8" : "py-14",
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground/50",
            compact ? "size-11" : "size-14"
          )}
        >
          <Icon className={compact ? "size-5" : "size-7"} aria-hidden />
        </span>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = "تعذّر تحميل البيانات",
  description = "تحقّق من الاتصال بالخادم ثم أعد المحاولة.",
  onRetry,
  isRetrying,
  className,
  compact,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/5 text-center",
        compact ? "p-6" : "p-10",
        className
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-danger/10 text-danger-soft">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} loading={isRetrying}>
          {!isRetrying && <RefreshCw aria-hidden />} إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

/**
 * حالة التحميل الافتتاحية لصفحة كاملة.
 * تُفضَّل الهياكل العظمية المطابقة لشكل المحتوى، وتبقى هذه للحالات التي لا
 * يكون فيها شكل المحتوى معروفاً مسبقاً.
 */
export function LoadingState({ label = "جارٍ التحميل…", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-h-[45vh] flex-col items-center justify-center gap-3", className)}
    >
      <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
