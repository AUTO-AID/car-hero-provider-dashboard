import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";
import { ProviderProfile, WorkingHourItem, ServiceCatalogItem } from "@/domain/entities/provider.types";

export const getProviderProfile = () =>
  api.get("/providers/me").then((res) => unwrapApiData<ProviderProfile>(res.data));

export const updateProviderProfile = <T extends object>(data: T) =>
  api.put("/providers/me", data).then((res) => unwrapApiData<ProviderProfile>(res.data));

/**
 * حالة التوفّر التي يراها العملاء.
 * `GET /providers/nearby` لا يُرجع إلا المزوّدين بحالة `online`، أي أن هذه
 * القيمة تحدّد ظهور النشاط في التطبيق — ولم يكن في اللوحة أي وسيلة لتغييرها.
 */
export type ProviderAvailability = "online" | "busy" | "offline";

export const updateProviderStatus = (status: ProviderAvailability) =>
  api.put("/providers/me/status", { status }).then((res) => unwrapApiData<ProviderProfile>(res.data));

export const getServiceCatalog = () =>
  api.get("/services").then((res) => unwrapApiData<ServiceCatalogItem[]>(res.data));

export const updateProviderServices = (payload: {
  services: string[];
  servicePrices: Record<string, number>;
  serviceAvailability: Record<string, boolean>;
}) => api.put("/providers/me/services", payload).then((res) => unwrapApiData<ProviderProfile>(res.data));

export const updateProviderWorkingHours = (workingHours: WorkingHourItem[]) =>
  api.put("/providers/me/working-hours", { workingHours }).then((res) => unwrapApiData<ProviderProfile>(res.data));
