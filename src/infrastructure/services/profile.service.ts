import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";
import { WorkingHourItem } from "@/domain/entities/provider.types";

export const getProviderProfile = () =>
  api.get("/providers/me").then((res) => unwrapApiData(res.data));

export const updateProviderProfile = <T extends object>(data: T) =>
  api.put("/providers/me", data).then((res) => unwrapApiData(res.data));

export const updateProviderDocuments = (docs: string[]) =>
  api.put("/providers/me/documents", { documents: docs }).then((res) => unwrapApiData(res.data));

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  email: boolean;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  basePrice: number;
  discountedPrice: number;
  estimatedDuration: number;
  isEmergency: boolean;
}

export const getAccountProfile = () =>
  api.get("/users/me").then((res) => unwrapApiData(res.data));

export const updateAccountPreferences = (preferences: { language: string; notifications: NotificationPreferences }) =>
  api.patch("/users/me", { preferences }).then((res) => unwrapApiData(res.data));

export const uploadProviderDocument = (file: File, onProgress: (percent: number) => void) => {
  const body = new FormData();
  body.append("file", file);
  return api.post("/providers/me/documents/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded * 100) / event.total));
    },
  }).then((res) => unwrapApiData<{ fileUrl: string }>(res.data));
};

export const getServiceCatalog = () =>
  api.get("/services").then((res) => unwrapApiData<ServiceCatalogItem[]>(res.data));

export const updateProviderServices = (payload: {
  services: string[];
  servicePrices: Record<string, number>;
  serviceAvailability: Record<string, boolean>;
}) => api.put("/providers/me/services", payload).then((res) => unwrapApiData(res.data));

export const updateProviderWorkingHours = (workingHours: WorkingHourItem[]) =>
  api.put("/providers/me/working-hours", { workingHours }).then((res) => unwrapApiData(res.data));
