"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "border-primary/25 bg-primary/10 text-primary group-hover/card:bg-primary/20",
  success: "border-success/25 bg-success/10 text-success-soft group-hover/card:bg-success/20",
  info: "border-info/25 bg-info/10 text-info-soft group-hover/card:bg-info/20",
} as const;

interface MoneyTileProps {
  label: string;
  value: number;
  currency?: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
}

/**
 * بطاقة رقم مالي واحدة — بقالب واحد للثلاث.
 *
 * كانت البطاقات الثلاث بثلاثة أشكال: الرصيد بأيقونة في الطرف ورقم بقياس
 * text-4xl، والأخريان بأيقونة صغيرة بجانب التسمية ورقم بقياس text-2xl —
 * ثلاثة تخطيطات لثلاثة أرقام من النوع نفسه، فلا تُقرأ كصفّ واحد قابل
 * للمقارنة. القالب هنا واحد، والفرق الوحيد المسموح هو نغمة الأيقونة.
 */
export function MoneyTile({ label, value, currency, icon: Icon, tone }: MoneyTileProps) {
  return (
    <Card className="gap-4 p-5 transition-colors hover:border-border sm:p-6">
      <span
        aria-hidden
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-2xl border transition-colors",
          TONES[tone]
        )}
      >
        <Icon className="size-7" />
      </span>

      <div className="min-w-0">
        <p className="text-base font-semibold text-muted-foreground">{label}</p>
        <Money
          value={value}
          currency={currency}
          className="mt-1.5 block text-3xl leading-none font-bold text-foreground"
        />
      </div>
    </Card>
  );
}
