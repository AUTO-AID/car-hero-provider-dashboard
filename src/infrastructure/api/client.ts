import axios from "axios";

const configuredApiBase = process.env.NEXT_PUBLIC_API_URL;
const API_BASE =
  configuredApiBase && !configuredApiBase.includes("localhost:3000")
    ? configuredApiBase
    : "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("provider_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("provider_access_token");
      localStorage.removeItem("provider_refresh_token");
      localStorage.removeItem("provider_data");

      document.cookie = "provider_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
