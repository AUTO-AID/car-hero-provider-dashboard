import { api } from "../api/client";

export const getProviderProfile = () =>
  api.get("/providers/me").then((res) => res.data);

export const updateProviderProfile = (data: Record<string, string>) =>
  api.put("/providers/me", data).then((res) => res.data);

export const updateProviderDocuments = (docs: string[]) =>
  api.put("/providers/me/documents", { documents: docs }).then((res) => res.data);

export const updateProviderServices = (services: string[], serviceCategories: string[] = []) =>
  api.put("/providers/me/services", { services, serviceCategories }).then((res) => res.data);

export const updateProviderWorkingHours = (workingHours: any[]) =>
  api.put("/providers/me/working-hours", { workingHours }).then((res) => res.data);
