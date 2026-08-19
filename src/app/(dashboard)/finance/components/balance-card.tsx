"use client";

import { LucideIcon, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  label: string;
  value: number;
  currency?: string;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "muted";
}

/**
 * النغمة تلوّن الأيقونة والرقم فقط.
 * الشكل السابق كان يضيف على كل بطاقة توهّجاً ملوّناً (`drop-shadow` بلون
 * الحالة) + ظلاً خارجياً + تدرّجاً على الـ hover، فصار المبلغ نفسه أقل وضوحاً
 * من الهالة المحيطة به.
 */
const TONES = {
  primary: { icon: "border-primary/20 bg-primary/10 text-primary", value: "text-foreground" },
  success: { icon: "border-success/20 bg-success/10 text-success-soft", value: "text-success-soft" },
  warning: { icon: "border-warning/20 bg-warning/10 text-warning-soft", value: "text-warning-soft" },
  muted: { icon: "border-border bg-secondary/60 text-muted-foreground", value: "text-foreground" },
} as const;

export function BalanceCard({ label, value, currency, icon: Icon = Wallet, tone = "muted" }: BalanceCardProps) {
  const styles = TONES[tone];

  return (
    <Card className="gap-0 transition-colors hover:border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Money
              value={value}
              currency={currency}
              className={cn("mt-2 block text-2xl font-bold", styles.value)}
            />
          </div>
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border",
              styles.icon
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
