"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "warning" | "info" | "success" | "danger" | "default" | "neutral";

/**
 * حالات الطلب: التسمية العربية + النغمة الدلالية.
 *
 * كانت الألوان سلاسل tailwind خام لتسع حالات موزّعة على سبع لوحات مختلفة
 * (amber/blue/cyan/sky/indigo/violet/emerald/rose/red) دون معنى مشترك بينها —
 * فلا يستطيع المزوّد أن يتعلّم أن لوناً بعينه يعني شيئاً بعينه.
 * صارت أربع نغمات تحمل معنى: انتظار، قيد التنفيذ، نجاح، فشل.
 */
export const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "قيد الانتظار", tone: "warning" },
  accepted: { label: "مقبول", tone: "info" },
  provider_assigned: { label: "تم التعيين", tone: "info" },
  provider_en_route: { label: "في الطريق", tone: "info" },
  provider_arrived: { label: "وصل المزوّد", tone: "info" },
  in_progress: { label: "جارٍ التنفيذ", tone: "default" },
  completed: { label: "مكتمل", tone: "success" },
  cancelled: { label: "ملغى", tone: "danger" },
  rejected: { label: "مرفوض", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_MAP[status] ?? { label: status, tone: "neutral" as const };

  return (
    <Badge
      variant={config.tone}
      className={cn("h-6 rounded-full border px-2.5 font-semibold", className)}
    >
      {config.label}
    </Badge>
  );
}
