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

export function DayRow({ day, config, onToggle, onTimeChange, error }: DayRowProps) {
  const open = !config.isClosed;
  const errorId = `day-${day}-error`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:gap-4",
        error
          ? "border-danger/40 bg-danger/5"
          : open
            ? "border-border bg-secondary/20"
            : "border-border/50 bg-transparent"
      )}
    >
      {/* مفتاح واحد بدل زرّ "تفعيل/إيقاف" الذي كان يغيّر لونه ونصّه معاً:
          الحالة الآن مقروءة من شكل المفتاح مباشرة، لا من نصّ الزر */}
      <div className="flex w-full items-center gap-3 sm:w-36 sm:shrink-0">
        <Switch
          checked={open}
          onCheckedChange={onToggle}
          aria-label={`دوام يوم ${day}`}
        />
        <span
          className={cn(
            "text-[15px] font-semibold",
            open ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {day}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-start gap-2 sm:justify-center">
        {open ? (
          <>
            <input
              type="time"
              value={config.open}
              onChange={(event) => onTimeChange("open", event.target.value)}
              className="time-input"
              aria-label={`وقت فتح ${day}`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            <span className="px-1 text-xs text-muted-foreground">إلى</span>
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
          <span className="text-sm text-muted-foreground">مغلق طوال اليوم</span>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger-soft sm:max-w-[10rem] sm:text-end">
          {error}
        </p>
      )}
    </div>
  );
}
