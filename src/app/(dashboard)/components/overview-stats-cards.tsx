"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Banknote, ClipboardList, Star, Wrench } from "lucide-react";
import { currencyLabel, formatAmount, formatNumber } from "@/lib/format";

interface OverviewStatsCardsProps {
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRating: number;
  activeServices: number;
}

export function OverviewStatsCards({
  totalBookings,
  pendingBookings,
  totalRevenue,
  averageRating,
  activeServices,
}: OverviewStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
      {/* الشارة تظهر فقط حين يوجد ما ينتظر ردّ المزوّد. الحالة الصفرية كانت
          تكتب «لا شيء بانتظار إجراء» — سطر يشغل مساحة ليقول إنه لا خبر. */}
      <StatCard
        title="إجمالي الطلبات"
        value={totalBookings}
        icon={ClipboardList}
        subtitle={
          pendingBookings > 0
            ? `${formatNumber(pendingBookings)} بانتظار ردّك`
            : undefined
        }
        tone={pendingBookings > 0 ? "warning" : "primary"}
      />
      <StatCard
        title="إجمالي الأرباح"
        value={`${formatAmount(totalRevenue)} ${currencyLabel()}`}
        icon={Banknote}
        tone="info"
      />
      <StatCard
        title="التقييم العام"
        value={averageRating ? averageRating.toFixed(1) : "—"}
        icon={Star}
        tone="warning"
      />
      <StatCard
        title="الخدمات المتاحة"
        value={activeServices}
        icon={Wrench}
        tone="success"
      />
    </div>
  );
}
