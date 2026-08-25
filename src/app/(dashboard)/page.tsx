"use client";

import { useQuery } from "@tanstack/react-query";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import { getProviderDashboardAllStats } from "@/infrastructure/services/dashboard.service";
import { getProviderOrders } from "@/infrastructure/services/bookings.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { RevenueStat, ServicePerformance } from "@/domain/entities/dashboard.types";
import { OverviewHeader } from "./components/overview-header";
import { OverviewStatsCards } from "./components/overview-stats-cards";
import { OverviewRevenueChart } from "./components/overview-revenue-chart";
import { OverviewServicesRadar } from "./components/overview-services-radar";
import { OverviewStatusDonut } from "./components/overview-status-donut";
import { OverviewRecentBookings } from "./components/overview-recent-bookings";
import { OverviewAlerts } from "./components/overview-alerts";
import { Banknote, ClipboardList, Star, Wrench } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

const AR_MONTHS = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function ProviderDashboardHome() {
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: providerQueryKeys.profile,
    queryFn: getProviderProfile,
  });
  const provider = profileData;
  const activeServicesCount =
    provider?.services?.length ||
    provider?.services_list?.length ||
    provider?.requestedServices?.length ||
    0;

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: providerQueryKeys.dashboardAllStats,
    queryFn: getProviderDashboardAllStats,
  });

  const summary = dashboardStats?.summary ?? {};
  const orderCounts = dashboardStats?.ordersStats ?? {};
  const rawRevenueList: RevenueStat[] = dashboardStats?.revenueStats ?? [];
  const svcsPerformance: ServicePerformance[] = dashboardStats?.servicesPerformance ?? [];

  const { data: bookingsData } = useQuery({
    queryKey: providerQueryKeys.orders({ group: "active", page: 1, limit: 3 }),
    queryFn: () => getProviderOrders({ group: "active", page: 1, limit: 3 }),
  });
  const recentBookings = (bookingsData?.data ?? []).slice(0, 3);

  // Revenue chart data
  const chartData = [...rawRevenueList].reverse().map((item) => {
    const monthNum = item._id?.month || 0;
    return {
      name: `${AR_MONTHS[monthNum] || monthNum} ${item._id?.year || ""}`,
      earnings: item.revenue || 0,
      orders: item.count || item.orders || 0,
    };
  });


  const stats = {
    totalBookings: summary.totalOrders ?? 0,
    totalRevenue: summary.totalRevenue ?? 0,
    averageRating: summary.averageRating ?? 0,
    activeServices: activeServicesCount,
  };

  if (isProfileLoading || isStatsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[ClipboardList, Banknote, Star, Wrench].map((Icon, index) => (
            <StatCard key={index} title="" value="" icon={Icon} loading />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-[380px] rounded-xl xl:col-span-2" />
          <Skeleton className="h-[380px] rounded-xl" />
        </div>
      </div>
    );
  }

  const isApproved = provider?.isApproved && provider?.registrationStatus !== "pending";

  return (
    <div className="space-y-6 animate-fade-in-up">
      <OverviewHeader
        businessName={provider?.businessName ?? ""}
        ownerName={provider?.ownerName ?? ""}
        isApproved={Boolean(isApproved)}
      />

      {/* التنبيهات القابلة للتنفيذ تسبق الأرقام: أوّل سؤال للمزوّد كل صباح هو
          "ما الذي يحتاج تدخّلي؟" لا "كم بلغ إجمالي أرباحي التاريخي؟" */}
      <OverviewAlerts
        isApproved={Boolean(isApproved)}
        activeServicesCount={stats.activeServices}
      />

      <OverviewStatsCards
        totalBookings={stats.totalBookings}
        pendingBookings={orderCounts.pending || 0}
        totalRevenue={stats.totalRevenue}
        averageRating={stats.averageRating}
        activeServices={stats.activeServices}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OverviewRecentBookings recentBookings={recentBookings} />
        <OverviewStatusDonut
          pendingCount={orderCounts.pending || 0}
          completedCount={orderCounts.completed || 0}
          inProgressCount={orderCounts.in_progress || 0}
          cancelledCount={orderCounts.cancelled || 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <OverviewRevenueChart data={chartData} />
        <OverviewServicesRadar svcsPerformance={svcsPerformance} />
      </div>
    </div>
  );
}
