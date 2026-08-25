"use client";

import { useMemo } from "react";
import type { RevenueTrendPoint } from "@/domain/entities/wallet.types";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { formatAmount, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const DAYS = 30;

interface EarningsChartProps {
  trend: RevenueTrendPoint[];
  currency?: string;
}

/**
 * أرباح آخر ثلاثين يوماً — بأعمدة CSS لا بمكتبة رسوم.
 *
 * كان في هذه الصفحة مخطّطا ECharts، والمكتبة وحدها **١٫١ ميغابايت** تُحمَّل
 * وتُصرَّف لرسم ثلاثين عموداً بلا محاور ولا تكبير ولا تفاعل حقيقي — وهي
 * السبب الأول في أن `/finance` كان أبطأ مسار في اللوحة (٢٦ ثانية تصريفاً في
 * التطوير). الأعمدة هنا عناصر عادية: تُرسم فوراً، وتقرأ ألوان النظام،
 * وتحترم الوضع الداكن بلا إعداد.
 */
export function EarningsChart({ trend, currency }: EarningsChartProps) {
  const { days, max, total, best } = useMemo(() => {
    // الخادم يعيد الأيام ذات الأرباح فقط. عرضها متلاصقةً يكذب على العين:
    // يومان بينهما أسبوع صامت يظهران متجاورين كأنّ العمل لم ينقطع.
    const byDate = new Map(trend.map((point) => [point.date, point.amount]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: DAYS }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (DAYS - 1 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return { date, amount: byDate.get(key) ?? 0 };
    });

    const max = Math.max(...days.map((day) => day.amount), 0);
    const total = days.reduce((sum, day) => sum + day.amount, 0);
    const best = days.reduce((top, day) => (day.amount > top.amount ? day : top), days[0]);

    return { days, max, total, best };
  }, [trend]);

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground">أرباحك في آخر ٣٠ يوماً</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">من الطلبات المكتملة</p>
        </div>
        <Money value={total} currency={currency} className="text-xl font-bold text-foreground" />
      </div>

      {max === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          لا أرباح مسجّلة في آخر ٣٠ يوماً.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`أرباح آخر ٣٠ يوماً، المجموع ${formatAmount(total)}، وأعلى يوم ${formatDate(best.date, "medium")} بمبلغ ${formatAmount(best.amount)}`}
            className="flex h-32 items-end gap-[3px]"
          >
            {days.map((day) => (
              <span
                key={day.date.getTime()}
                title={`${formatDate(day.date, "medium")} — ${formatAmount(day.amount)}`}
                className="flex h-full flex-1 items-end"
              >
                <span
                  className={cn(
                    "w-full rounded-t-sm transition-colors",
                    day.amount > 0 ? "bg-primary/70 hover:bg-primary" : "bg-border/70"
                  )}
                  // خطّ رفيع لأيّام الصفر: الفراغ التامّ يُقرأ كعطل في الرسم،
                  // والخطّ يقول «هذا اليوم مرّ ولم يكن فيه دخل».
                  style={{ height: day.amount > 0 ? `${Math.max((day.amount / max) * 100, 4)}%` : "2px" }}
                />
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatDate(days[0].date, "medium")}</span>
            <span>أفضل يوم: {formatDate(best.date, "medium")}</span>
            <span>{formatDate(days[days.length - 1].date, "medium")}</span>
          </div>
        </>
      )}
    </Card>
  );
}
