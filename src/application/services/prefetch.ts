import { QueryClient } from "@tanstack/react-query";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import { getProviderBookings } from "@/infrastructure/services/bookings.service";
import { getProviderWallet, getProviderTransactions } from "@/infrastructure/services/wallet.service";

export const providerQueryKeys = {
  profile: ["provider-profile"] as const,
  bookings: (tab: "current" | "history") => ["provider-bookings", tab] as const,
  wallet: ["provider-wallet"] as const,
  transactions: ["provider-transactions"] as const,
  dashboardSummary: ["provider-dashboard-summary"] as const,
  ordersStats: ["provider-orders-stats"] as const,
  revenueStats: ["provider-revenue-stats"] as const,
  servicesPerformance: ["provider-services-performance"] as const,
  dashboardAllStats: ["provider-dashboard-all-stats"] as const,
};

export function prefetchProviderRouteData(
  queryClient: QueryClient,
  href: string
) {
  switch (href) {
    case "/":
    case "/services":
    case "/working-hours":
    case "/settings":
      return queryClient.prefetchQuery({
        queryKey: providerQueryKeys.profile,
        queryFn: getProviderProfile,
      });
    case "/orders":
      return queryClient.prefetchQuery({
        queryKey: providerQueryKeys.bookings("current"),
        queryFn: () => getProviderBookings("current"),
      });
    case "/finance":
      return Promise.all([
        queryClient.prefetchQuery({
          queryKey: providerQueryKeys.wallet,
          queryFn: getProviderWallet,
        }),
        queryClient.prefetchQuery({
          queryKey: providerQueryKeys.transactions,
          queryFn: getProviderTransactions,
        }),
      ]);
    default:
      return Promise.resolve();
  }
}

export function prefetchProviderDashboardData(queryClient: QueryClient) {
  return Promise.all([
    prefetchProviderRouteData(queryClient, "/"),
    prefetchProviderRouteData(queryClient, "/orders"),
    prefetchProviderRouteData(queryClient, "/finance"),
  ]);
}
