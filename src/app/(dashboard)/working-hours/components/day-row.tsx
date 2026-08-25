"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export type DayConfig = { open: string; close: string; isClosed: boolean };

interface DayRowProps {
  day: string;
  config: DayConfig;
  onToggle: () => void;
  onTimeChange: (field: "open" | "close", val: string) => void;
  error?: string;
}

/**
 * صفّ اليوم الواحد.
 *
 * كان صفّاً بارتفاع 56px، اسم اليوم فيه بقياس 15px والمنتقيان بقياس 14px
 * في عمود مضغوط وسط الصفّ — سبعة صفوف متطابقة الرمادية يصعب على العين
 * أن تميّز فيها المفتوح من المغلق دون قراءة كل واحد.
 *
 * الآن: اليوم اسمٌ عريض في مقدّمة الصفّ، والحالة تُقرأ من لون الحافّة
 * والخلفية قبل النصّ، والمنتقيان بارتفاع 44px — أدنى مساحة لمس مقبولة.
 */
export function DayRow({ day, config, onToggle, onTimeChange, error }: DayRowProps) {
  const open = !config.isClosed;
  const errorId = `day-${day}-error`;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        error
          ? "border-danger/40 bg-danger/5"
          : open
            ? "border-border bg-secondary/25"
            : "border-dashed border-border/60 bg-transparent"
      )}
    >
      {/* مفتاح واحد بدل زرّ "تفعيل/إيقاف" الذي كان يغيّر لونه ونصّه معاً:
          الحالة الآن مقروءة من شكل المفتاح مباشرة، لا من نصّ الزر */}
      <label className="flex w-full cursor-pointer items-center gap-3.5 sm:w-40 sm:shrink-0">
        <Switch checked={open} onCheckedChange={onToggle} aria-label={`دوام يوم ${day}`} />
        <span
          className={cn(
            "text-lg font-bold",
            open ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {day}
        </span>
      </label>

      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {open ? (
          <>
            <span className="text-sm font-semibold text-muted-foreground">من</span>
            <input
              type="time"
              value={config.open}
              onChange={(event) => onTimeChange("open", event.target.value)}
              className="time-input"
              aria-label={`وقت فتح ${day}`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            <span className="text-sm font-semibold text-muted-foreground">إلى</span>
            <input
              type="time"
              value={config.close}
              onChange={(event) => onTimeChange("close", event.target.value)}
              className="time-input"
              aria-label={`وقت إغلاق ${day}`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </>
        ) : (
          <span className="text-base font-semibold text-muted-foreground">مغلق طوال اليوم</span>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-semibold text-danger-soft sm:max-w-48 sm:text-end"
        >
          {error}
        </p>
      )}
    </div>
  );
}
