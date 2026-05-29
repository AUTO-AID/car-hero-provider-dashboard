"use client";

import { cn } from "@/lib/utils";
import { Power, PowerOff } from "lucide-react";

export type DayConfig = { open: string; close: string; isClosed: boolean };

interface DayRowProps {
  day: string;
  config: DayConfig;
  onToggle: () => void;
  onTimeChange: (field: "open" | "close", val: string) => void;
}

export function DayRow({
  day,
  config,
  onToggle,
  onTimeChange,
}: DayRowProps) {
  const closed = config.isClosed;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
        closed
          ? "bg-secondary/20 border-border/20 opacity-55"
          : "bg-secondary/40 border-border/40 hover:border-primary/25 hover:bg-secondary/60"
      )}
    >
      {/* Day name + status dot */}
      <div className="flex items-center gap-3 w-32 shrink-0">
        <span
          className={cn(
            "relative flex h-2.5 w-2.5 shrink-0"
          )}
        >
          {!closed && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              closed ? "bg-rose-500/60" : "bg-primary"
            )}
          />
        </span>
        <span
          className={cn(
            "font-bold text-sm",
            closed ? "text-muted-foreground/50" : "text-foreground"
          )}
        >
          {day}
        </span>
      </div>

      {/* Time inputs */}
      <div
        className={cn(
          "flex items-center gap-2 flex-1 justify-center",
          closed && "pointer-events-none opacity-25 grayscale"
        )}
      >
        <input
          type="time"
          value={config.open}
          onChange={(e) => onTimeChange("open", e.target.value)}
          className="time-input"
          aria-label={`وقت فتح ${day}`}
        />
        <span className="text-muted-foreground/50 text-xs font-semibold px-1">
          ←
        </span>
        <input
          type="time"
          value={config.close}
          onChange={(e) => onTimeChange("close", e.target.value)}
          className="time-input"
          aria-label={`وقت إغلاق ${day}`}
        />
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        aria-label={closed ? `تفعيل ${day}` : `إيقاف ${day}`}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all w-24 justify-center border",
          closed
            ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
        )}
      >
        {closed ? (
          <>
            <Power className="w-3 h-3" />
            تفعيل
          </>
        ) : (
          <>
            <PowerOff className="w-3 h-3" />
            إيقاف
          </>
        )}
      </button>
    </div>
  );
}
