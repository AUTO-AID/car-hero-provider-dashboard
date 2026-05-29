"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Package, Wallet, Star, Zap } from "lucide-react";

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
  const ratingSparkline = averageRating > 0 ? [averageRating] : [];
  const servicesSparkline = activeServices > 0 ? [activeServices] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
      <StatCard
        title="إجمالي الطلبات"
        value={totalBookings.toLocaleString("ar-SA")}
        icon={Package}
        trend={{
          value: pendingBookings,
          label: "بانتظار الإجراء",
          customValue: `${pendingBookings.toLocaleString()} طلب`,
        }}
        sparkline={ordersSparkline}
      />
      <StatCard
        title="إجمالي الأرباح"
        value={`${totalRevenue.toLocaleString("ar-SA")} ل.س`}
        icon={Wallet}
        iconBg="from-blue-500/20 to-blue-500/5"
        iconColor="text-blue-400"
        trend={{ value: revenueSparkline.length, label: "???? ?????? ???????", type: "up" }}
        sparkline={revenueSparkline}
      />
      <StatCard
        title="التقييم العام"
        value={averageRating ? averageRating.toFixed(1) : "0.0"}
        icon={Star}
        iconBg="from-amber-500/20 to-amber-500/5"
        iconColor="text-amber-400"
        subtitle={`بناءً على ${totalReviews} تقييم`}
        sparkline={ratingSparkline}
      />
      <StatCard
        title="الخدمات المتاحة"
        value={activeServices}
        icon={Zap}
        iconBg="from-violet-500/20 to-violet-500/5"
        iconColor="text-violet-400"
        subtitle={activeServices === 0 ? "لم تُضف خدمات بعد" : `${activeServices} فئات مسجلة`}
        sparkline={servicesSparkline}
      />
    </div>
  );
}
