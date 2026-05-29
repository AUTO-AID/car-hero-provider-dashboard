"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  glowClass?: string;
  trend?: { value: number; label: string; customValue?: string; type?: "up" | "down" | "neutral" };
  loading?: boolean;
  children?: ReactNode;
  /** Decorative mini bars — array of 0-1 normalized heights */
  sparkline?: number[];
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "from-primary/20 to-primary/5",
  glowClass = "",
  trend,
  loading,
  children,
  sparkline,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-5 bg-card border-border/40">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded mb-2" />
        <Skeleton className="h-3.5 w-20 rounded" />
      </Card>
    );
  }

  const defaultSparkline = sparkline ?? [0.4, 0.6, 0.5, 0.8, 0.65, 0.9, 1];

  return (
    <Card
      className={cn(
        "stat-card-v2 card-hover-v2 p-5 bg-card border border-border/30 relative overflow-hidden",
        glowClass
      )}
    >
      {/* Ambient glow blob */}
      <span className="stat-blob" aria-hidden />

      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between mb-5">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br border border-white/8 shadow-lg shadow-primary/10",
            iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} aria-hidden />
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border",
              trend.value > 0
                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                : "text-red-400 bg-red-400/10 border-red-400/20"
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.customValue ?? `${Math.abs(trend.value)}%`}</span>
          </div>
        )}
      </div>

      {/* Value & label */}
      <div className="space-y-1 mb-4">
        <p className="text-3xl font-black text-foreground tabular-nums tracking-tight leading-none">
          {value}
        </p>
        <p className="text-[13px] font-semibold text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/50">{subtitle}</p>
        )}
        {trend && (
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">{trend.label}</p>
        )}
      </div>

      {/* Mini sparkline bars */}
      <div className="flex items-end gap-[3px] h-7 mt-auto pt-2 border-t border-border/20" aria-hidden>
        {defaultSparkline.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/25 transition-all duration-500"
            style={{ height: `${h * 100}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>

      {children}
    </Card>
  );
}
