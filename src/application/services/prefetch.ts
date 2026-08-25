import { QueryClient } from "@tanstack/react-query";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import {
  getProviderOrders,
  getProviderOrdersSummary,
  type OrderQuery,
} from "@/infrastructure/services/bookings.service";
import { getProviderWallet, getProviderTransactions } from "@/infrastructure/services/wallet.service";

/** حجم صفحة سجلّ الطلبات — يُشارَك مع الصفحة كي يتطابق مفتاح الجلب المسبق */
export const ORDERS_PAGE_SIZE = 15;

export const providerQueryKeys = {
  profile: ["provider-profile"] as const,
  account: ["provider-account"] as const,
  // القائمة والملخّص تحت الجذر نفسه: إبطال واحد عند وصول حدث سوكِت
  // يُحدّث الصفحة المعروضة وعدّادات الرقاقات معاً، ولا يترك أحدهما متأخّراً.
  bookingsRoot: ["provider-bookings"] as const,
  orders: (query?: OrderQuery) => ["provider-bookings", "list", query ?? {}] as const,
  ordersSummary: (query?: Pick<OrderQuery, "search" | "dateFrom" | "dateTo">) =>
    ["provider-bookings", "summary", query ?? {}] as const,
  bookingDetails: (id: string) => ["provider-booking-details", id] as const,
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
    case "/orders": {
      // نفس الوسائط التي تطلبها الصفحة عند أوّل تصيير — أيّ اختلاف يجعل
      // المفتاح مختلفاً فيذهب الجلب المسبق هدراً وتبدأ الصفحة بهيكل عظمي.
      const first: OrderQuery = { group: "all", sort: "newest", page: 1, limit: ORDERS_PAGE_SIZE };
      return Promise.all([
        queryClient.prefetchQuery({
          queryKey: providerQueryKeys.orders(first),
          queryFn: () => getProviderOrders(first),
        }),
        queryClient.prefetchQuery({
          queryKey: providerQueryKeys.ordersSummary({}),
          queryFn: () => getProviderOrdersSummary({}),
        }),
      ]);
    }
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
