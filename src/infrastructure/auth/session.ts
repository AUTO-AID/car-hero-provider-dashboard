import { ProviderUser } from "@/domain/entities/auth.types";

const ACCESS_TOKEN_KEY = "provider_access_token";
const REFRESH_TOKEN_KEY = "provider_refresh_token";
const PROVIDER_DATA_KEY = "provider_data";

export interface ProviderAuthSession {
  accessToken: string;
  refreshToken: string;
  provider: ProviderUser;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredSession(): ProviderAuthSession | null {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const providerJson = localStorage.getItem(PROVIDER_DATA_KEY);

  if (!accessToken || !refreshToken || !providerJson) return null;

  try {
    return {
      accessToken,
      refreshToken,
      provider: JSON.parse(providerJson) as ProviderUser,
    };
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeSession(session: ProviderAuthSession) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(PROVIDER_DATA_KEY, JSON.stringify(session.provider));
  setAccessTokenCookie(session.accessToken);
}

export function updateStoredTokens(accessToken: string, refreshToken: string, provider?: ProviderUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (provider) localStorage.setItem(PROVIDER_DATA_KEY, JSON.stringify(provider));
  setAccessTokenCookie(accessToken);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(PROVIDER_DATA_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
}

function setAccessTokenCookie(accessToken: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax${secure}`;
}

