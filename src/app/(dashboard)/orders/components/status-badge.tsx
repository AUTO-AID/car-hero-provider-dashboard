"use client";

import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { label: string; classes: string }
> = {
  pending:     { label: "قيد الانتظار",  classes: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  accepted:    { label: "مقبول",         classes: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  in_progress: { label: "جارٍ التنفيذ",  classes: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
  completed:   { label: "مكتمل",         classes: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  cancelled:   { label: "ملغي",          classes: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? { label: status, classes: "bg-secondary text-muted-foreground border-border/40" };
  return (
    <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full border", cfg.classes)}>
      {cfg.label}
    </span>
  );
}
