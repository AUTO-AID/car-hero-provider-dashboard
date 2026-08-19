export interface DashboardSummary {
  averageRating?: number;
  totalReviews?: number;
  totalOrders?: number;
  completedOrders?: number;
  totalRevenue?: number;
  status?: string;
}

export type OrderStatusCounts = Record<string, number>;

export interface RevenueStat {
  _id?: {
    month?: number;
    year?: number;
  };
  revenue?: number;
  count?: number;
  orders?: number;
}

export interface ServicePerformance {
  _id: string;
  count: number;
  revenue: number;
}

export interface ProviderDashboardStats {
  summary?: DashboardSummary;
  ordersStats?: OrderStatusCounts;
  revenueStats?: RevenueStat[];
  servicesPerformance?: ServicePerformance[];
}

