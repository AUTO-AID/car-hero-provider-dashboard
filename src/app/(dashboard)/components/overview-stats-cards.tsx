"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Package, Wallet, Star, Zap } from "lucide-react";
import { currencyLabel, formatAmount, formatNumber } from "@/lib/format";

interface OverviewStatsCardsProps {
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  activeServices: number;
  revenueSparkline: number[];
  ordersSparkline: number[];
}

function normalizeSparkline(data: number[]): number[] {
  if (!data || data.length === 0) return [];
  const max = Math.max(...data);
  if (max === 0) return [];
  return data.map((value) => value / max);
}

export function OverviewStatsCards({
  totalBookings,
  pendingBookings,
  totalRevenue,
  averageRating,
  totalReviews,
  activeServices,
  revenueSparkline,
  ordersSparkline,
}: OverviewStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
      <StatCard
        title="إجمالي الطلبات"
        value={totalBookings}
        icon={Package}
        subtitle={
          pendingBookings > 0
            ? `${formatNumber(pendingBookings)} بانتظار إجراء منك`
            : "لا شيء بانتظار إجراء"
        }
        tone={pendingBookings > 0 ? "warning" : "primary"}
        sparkline={normalizeSparkline(ordersSparkline)}
      />
      <StatCard
        title="إجمالي الأرباح"
        value={`${formatAmount(totalRevenue)} ${currencyLabel()}`}
        icon={Wallet}
        tone="info"
        subtitle={
          revenueSparkline.length
            ? `على مدى ${formatNumber(revenueSparkline.length)} أشهر`
            : "لا توجد أرباح مسجّلة بعد"
        }
        sparkline={normalizeSparkline(revenueSparkline)}
      />
      <StatCard
        title="التقييم العام"
        value={averageRating ? averageRating.toFixed(1) : "—"}
        icon={Star}
        tone="warning"
        subtitle={
          totalReviews > 0
            ? `بناءً على ${formatNumber(totalReviews)} تقييم`
            : "لم يصلك تقييم بعد"
        }
      />
      <StatCard
        title="الخدمات المتاحة"
        value={activeServices}
        icon={Zap}
        tone="success"
        subtitle={activeServices === 0 ? "لم تُضف خدمات بعد" : "فئة مسجّلة في ملفك"}
      />
    </div>
  );
}
