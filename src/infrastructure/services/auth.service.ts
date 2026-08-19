import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";
import { ProviderAuthResponse } from "@/domain/entities/auth.types";

export const providerLogin = (phoneNumber: string, password?: string) =>
  api.post("/auth/login", { phoneNumber, password }).then((res) => unwrapApiData<ProviderAuthResponse>(res.data));

export const refreshProviderToken = (refreshToken: string) =>
  api.post("/auth/refresh-token", { refreshToken }).then((res) => unwrapApiData<ProviderAuthResponse>(res.data));

export const providerLogout = () =>
  api.post("/auth/logout").then((res) => res.data);
