import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";

export const getProviderDashboardSummary = () =>
  api.get("/providers/dashboard/summary").then((res) => unwrapApiData(res.data));

export const getProviderOrdersStats = () =>
  api.get("/providers/dashboard/orders-stats").then((res) => unwrapApiData(res.data));

export const getProviderRevenueStats = () =>
  api.get("/providers/dashboard/revenue-stats").then((res) => unwrapApiData(res.data));

export const getProviderServicesPerformance = () =>
  api.get("/providers/dashboard/services-performance").then((res) => unwrapApiData(res.data));

export const getProviderDashboardAllStats = () =>
  api.get("/providers/dashboard/all-stats").then((res) => unwrapApiData(res.data));
