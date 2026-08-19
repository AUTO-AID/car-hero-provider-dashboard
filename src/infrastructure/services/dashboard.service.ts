import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";
import { DashboardSummary, OrderStatusCounts, ProviderDashboardStats, RevenueStat, ServicePerformance } from "@/domain/entities/dashboard.types";

export const getProviderDashboardSummary = () =>
  api.get("/providers/dashboard/summary").then((res) => unwrapApiData<DashboardSummary>(res.data));

export const getProviderOrdersStats = () =>
  api.get("/providers/dashboard/orders-stats").then((res) => unwrapApiData<OrderStatusCounts>(res.data));

export const getProviderRevenueStats = () =>
  api.get("/providers/dashboard/revenue-stats").then((res) => unwrapApiData<RevenueStat[]>(res.data));

export const getProviderServicesPerformance = () =>
  api.get("/providers/dashboard/services-performance").then((res) => unwrapApiData<ServicePerformance[]>(res.data));

export const getProviderDashboardAllStats = () =>
  api.get("/providers/dashboard/all-stats").then((res) => unwrapApiData<ProviderDashboardStats>(res.data));
