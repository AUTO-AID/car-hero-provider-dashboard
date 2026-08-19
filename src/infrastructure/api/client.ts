import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ProviderAuthResponse } from "@/domain/entities/auth.types";
import { clearStoredSession, getAccessToken, getRefreshToken, updateStoredTokens } from "@/infrastructure/auth/session";
import { unwrapApiData } from "./unwrap";

const configuredApiBase = process.env.NEXT_PUBLIC_API_URL;
const API_BASE =
  configuredApiBase && !configuredApiBase.includes("localhost:3000")
    ? configuredApiBase
    : "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const refreshApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const canRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/refresh-token");

    if (canRefresh) {
      originalRequest._retry = true;
      const token = await refreshAccessToken();

      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      clearStoredSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = refreshApi
      .post("/auth/refresh-token", { refreshToken })
      .then((response) => {
        const payload = unwrapApiData<ProviderAuthResponse>(response.data);
        if (!payload.accessToken || !payload.refreshToken) return null;
        updateStoredTokens(payload.accessToken, payload.refreshToken);
        return payload.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}
