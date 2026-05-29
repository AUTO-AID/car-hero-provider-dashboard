"use client";

import { useQuery } from "@tanstack/react-query";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import { getProviderDashboardAllStats } from "@/infrastructure/services/dashboard.service";
import { getProviderBookings } from "@/infrastructure/services/bookings.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { OverviewHeader } from "./components/overview-header";
import { OverviewStatsCards } from "./components/overview-stats-cards";
import { OverviewRevenueChart } from "./components/overview-revenue-chart";
import { OverviewServicesRadar } from "./components/overview-services-radar";
import { OverviewStatusDonut } from "./components/overview-status-donut";
import { OverviewRecentBookings } from "./components/overview-recent-bookings";
import { OverviewAlerts } from "./components/overview-alerts";
import { Package, Wallet, Star, Zap } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

const AR_MONTHS = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function ProviderDashboardHome() {
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: providerQueryKeys.profile,
    queryFn: getProviderProfile,
  });
  const provider = profileData?.data ?? profileData;

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: providerQueryKeys.dashboardAllStats,
    queryFn: getProviderDashboardAllStats,
  });

  const summary = dashboardStats?.summary ?? {};
  const orderCounts = dashboardStats?.ordersStats ?? {};
  const rawRevenueList = (dashboardStats?.revenueStats ?? []) as any[];
  const svcsPerformance = (dashboardStats?.servicesPerformance ?? []) as any[];

  const { data: bookingsData } = useQuery({
    queryKey: providerQueryKeys.bookings("current"),
    queryFn: () => getProviderBookings("current"),
  });
  const recentBookings = (bookingsData?.data ?? []).slice(0, 3);

  // Revenue chart data
  const chartData = [...rawRevenueList].reverse().map((item: any) => {
    const monthNum = item._id?.month || 0;
    return {
      name: `${AR_MONTHS[monthNum] || monthNum} ${item._id?.year || ""}`,
      earnings: item.revenue || 0,
      orders: item.count || 0,
    };
  });


  const stats = {
    totalBookings: summary.totalOrders ?? 0,
    totalRevenue: summary.totalRevenue ?? 0,
    averageRating: summary.averageRating ?? 0,
    activeServices: provider?.services?.length || 0,
  };

  const revenueSparkline = chartData.map((d) => d.earnings);
  const ordersSparkline = chartData.map((d) => d.orders);

  if (isProfileLoading || isStatsLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-36 rounded-2xl bg-card/40 border border-border/20 p-6 flex flex-col justify-center gap-3">
          <div className="h-3.5 w-32 bg-secondary/80 rounded-md" />
          <div className="h-8 w-64 bg-secondary/80 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[Package, Wallet, Star, Zap].map((Icon, i) => (
            <StatCard key={i} title="" value="" icon={Icon} loading={true} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-[380px] rounded-2xl bg-card/40 border border-border/20" />
          <div className="h-[380px] rounded-2xl bg-card/40 border border-border/20" />
        </div>
      </div>
    );
  }

  const isApproved = provider?.isApproved && provider?.registrationStatus !== "pending";

  return (
    <div className="space-y-8 animate-fade-in-up">
      <OverviewHeader
        businessName={provider?.businessName}
        ownerName={provider?.ownerName}
        isApproved={isApproved}
      />

      <OverviewStatsCards
        totalBookings={stats.totalBookings}
        pendingBookings={orderCounts.pending || 0}
        totalRevenue={stats.totalRevenue}
        averageRating={stats.averageRating}
        totalReviews={summary.totalReviews || 0}
        activeServices={stats.activeServices}
        revenueSparkline={revenueSparkline}
        ordersSparkline={ordersSparkline}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <OverviewRevenueChart data={chartData} />
        <OverviewServicesRadar svcsPerformance={svcsPerformance} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OverviewStatusDonut
          pendingCount={orderCounts.pending || 0}
          completedCount={orderCounts.completed || 0}
          inProgressCount={orderCounts.in_progress || 0}
          cancelledCount={orderCounts.cancelled || 0}
        />
        <OverviewRecentBookings recentBookings={recentBookings} />
      </div>

      <OverviewAlerts
        isApproved={isApproved}
        activeServicesCount={stats.activeServices}
      />
    </div>
  );
}
