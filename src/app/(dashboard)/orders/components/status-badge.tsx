"use client";

import { cn } from "@/lib/utils";

export const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: "قيد الانتظار", classes: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  accepted: { label: "مقبول", classes: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  provider_assigned: { label: "تم التعيين", classes: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" },
  provider_en_route: { label: "في الطريق", classes: "bg-sky-500/10 border-sky-500/20 text-sky-400" },
  provider_arrived: { label: "وصل المزود", classes: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" },
  in_progress: { label: "جار التنفيذ", classes: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
  completed: { label: "مكتمل", classes: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  cancelled: { label: "ملغي", classes: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
  rejected: { label: "مرفوض", classes: "bg-red-500/10 border-red-500/20 text-red-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    classes: "bg-secondary text-muted-foreground border-border/40",
  };

  return (
    <span className={cn("inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border", config.classes)}>
      {config.label}
    </span>
  );
}
