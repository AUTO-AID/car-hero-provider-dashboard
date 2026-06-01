"use client";

import { LucideIcon, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  label: string;
  value: number;
  currency: string;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "muted";
}

const ACCENTS = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  muted: "border-border/30 bg-card/60 text-foreground",
};

export function BalanceCard({ label, value, currency, icon: Icon = Wallet, accent = "muted" }: BalanceCardProps) {
  return (
    <Card className={cn("rounded-xl border", ACCENTS[accent])}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-white">
              {(value || 0).toLocaleString("ar-SY", { maximumFractionDigits: 2 })}
              <span className="mr-1 text-[11px] font-bold text-muted-foreground">{currency}</span>
            </p>
          </div>
          <div className={cn("size-10 rounded-lg border flex items-center justify-center", ACCENTS[accent])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
