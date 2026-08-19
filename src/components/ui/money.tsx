"use client";

import { cn } from "@/lib/utils";
import { currencyLabel, formatAmount, formatRelative } from "@/lib/format";
import { useClientReady } from "@/application/hooks/use-client-ready";

interface MoneyProps extends React.ComponentProps<"span"> {
  value: number | null | undefined;
  currency?: string | null;
  /** إظهار إشارة + / − صراحةً (سجل المعاملات) */
  signed?: boolean;
  /** إخفاء رمز العملة عندما يكون مكرّراً في سياق العمود */
  hideCurrency?: boolean;
}

/**
 * عرض المبالغ في مكان واحد: نظام أرقام واحد، وعملة تأتي من الخادم لا من
 * نص مكتوب يدوياً في كل بطاقة.
 */
export function Money({ value, currency, signed, hideCurrency, className, ...props }: MoneyProps) {
  const amount = value ?? 0;
  const sign = signed ? (amount > 0 ? "+" : amount < 0 ? "−" : "") : "";

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {sign}
      {formatAmount(signed ? Math.abs(amount) : amount)}
      {!hideCurrency && (
        <span className="ms-1 text-[0.75em] font-medium text-muted-foreground">
          {currencyLabel(currency)}
        </span>
      )}
    </span>
  );
}

/**
 * وقت نسبي ("منذ ٣ أيام"). يُعرض بعد التركيب فقط: القيمة تتغيّر مع مرور
 * الوقت، فحسابها على الخادم يُنتج اختلافاً في الترطيب.
 */
export function RelativeTime({ value, className, ...props }: React.ComponentProps<"span"> & { value: string | number | Date | null | undefined }) {
  const mounted = useClientReady();
  return (
    <span className={className} suppressHydrationWarning {...props}>
      {mounted ? formatRelative(value) : "…"}
    </span>
  );
}
