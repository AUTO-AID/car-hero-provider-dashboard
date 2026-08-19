import { QueryClient } from "@tanstack/react-query";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import { BookingFilters, getProviderBookings } from "@/infrastructure/services/bookings.service";
import { getProviderWallet, getProviderTransactions } from "@/infrastructure/services/wallet.service";

export const providerQueryKeys = {
  profile: ["provider-profile"] as const,
  account: ["provider-account"] as const,
  bookingsRoot: ["provider-bookings"] as const,
  bookings: (filters?: BookingFilters) => ["provider-bookings", filters ?? {}] as const,
  bookingDetails: (id: string) => ["provider-booking-details", id] as const,
  weeklyBookings: ["provider-bookings-weekly"] as const,
  wallet: ["provider-wallet"] as const,
  transactionsRoot: ["provider-transactions"] as const,
  transactions: (filters?: object) => ["provider-transactions", filters ?? {}] as const,
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
        queryKey: providerQueryKeys.bookings({ view: "current", page: 1, limit: 9 }),
        queryFn: () => getProviderBookings({ view: "current", page: 1, limit: 9 }),
      });
    case "/finance":
      return Promise.all([
        queryClient.prefetchQuery({
          queryKey: providerQueryKeys.wallet,
          queryFn: getProviderWallet,
        }),
        queryClient.prefetchQuery({
          queryKey: providerQueryKeys.transactions(),
          queryFn: () => getProviderTransactions(),
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
