"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  label: string;
  value: number;
  accent?: boolean;
}

export function BalanceCard({ label, value, accent = false }: BalanceCardProps) {
  return (
    <Card
      className={cn(
        "relative rounded-3xl overflow-hidden transition-all duration-300 border",
        accent
          ? "bg-gradient-to-br from-primary/20 via-purple-900/10 to-blue-900/20 border-primary/30 shadow-xl shadow-primary/5 hover:border-primary/50"
          : "bg-gradient-to-br from-emerald-500/10 via-teal-900/5 to-cyan-900/10 border-emerald-500/20 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/40"
      )}
    >
      {/* Glow elements */}
      <span
        className={cn(
          "absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20",
          accent ? "bg-primary" : "bg-emerald-400"
        )}
      />
      <span
        className={cn(
          "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-10",
          accent ? "bg-blue-500" : "bg-teal-400"
        )}
      />

      <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1 text-center sm:text-right">
          <p className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase">
            {label}
          </p>
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span
              className={cn(
                "text-4xl sm:text-5xl font-black tracking-tight tabular-nums",
                accent ? "text-gradient" : "text-emerald-400"
              )}
            >
              {(value || 0).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-muted-foreground">ل.س</span>
          </div>
        </div>

        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 shadow-lg shadow-black/25",
            accent
              ? "bg-primary/20 border-primary/30 text-primary"
              : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
          )}
        >
          {accent ? <Wallet className="w-7 h-7" /> : <TrendingUp className="w-7 h-7" />}
        </div>
      </CardContent>
    </Card>
  );
}
