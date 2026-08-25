import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";
import { ProviderProfile, WorkingHourItem, ServiceCatalogItem } from "@/domain/entities/provider.types";

export const getProviderProfile = () =>
  api.get("/providers/me").then((res) => unwrapApiData<ProviderProfile>(res.data));

export const updateProviderProfile = <T extends object>(data: T) =>
  api.put("/providers/me", data).then((res) => unwrapApiData<ProviderProfile>(res.data));

/**
 * موقع النشاط على الخريطة.
 *
 * `PUT /providers/me/location` كان جاهزاً في الخلفية منذ البداية (يتحقّق من
 * المدى ويكتب `location` بفهرس 2dsphere الذي يقوم عليه `/providers/nearby`)
 * ولم تكن اللوحة تستدعيه قطّ — فكان موقع الورشة هو ما سُجّل لحظة التسجيل
 * ولا سبيل إلى تصحيحه.
 *
 * الترتيب هنا مسمّى لا موضعيّ عمداً: الخادم يقرأ `longitude`/`latitude`
 * بينما GeoJSON يخزّنها `[lng, lat]` — وعكسها يضع الورشة في نصف كرة آخر.
 */
export const updateProviderLocation = (coords: { longitude: number; latitude: number }) =>
  api.put("/providers/me/location", coords).then((res) => unwrapApiData<ProviderProfile>(res.data));

export const getServiceCatalog = () =>
  api.get("/services").then((res) => unwrapApiData<ServiceCatalogItem[]>(res.data));

export const updateProviderServices = (payload: {
  services: string[];
  servicePrices: Record<string, number>;
  serviceAvailability: Record<string, boolean>;
}) => api.put("/providers/me/services", payload).then((res) => unwrapApiData<ProviderProfile>(res.data));

export const updateProviderWorkingHours = (workingHours: WorkingHourItem[]) =>
  api.put("/providers/me/working-hours", { workingHours }).then((res) => unwrapApiData<ProviderProfile>(res.data));
