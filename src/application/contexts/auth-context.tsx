"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "@/infrastructure/api/client";
import { providerLogin, providerLogout } from "@/infrastructure/services/auth.service";
import { ProviderUser, AuthContextType } from "@/domain/entities/auth.types";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ProviderUser | null>(() => getStoredProvider());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading] = useState(false);

  const login = async (phoneNumber: string, password?: string) => {
    const trimmedPhone = phoneNumber.trim();

    const payload = await providerLogin(trimmedPhone, password);
    const { accessToken, refreshToken, user: rawUser } = (payload?.data ?? payload) ?? {};

    const userData = normalizeProvider(rawUser);

    if (!accessToken || !refreshToken || !userData) {
      throw new Error("بيانات الدخول غير صحيحة");
    }

    if (userData.role?.toUpperCase() !== "PROVIDER") {
      throw new Error("هذا الحساب ليس حساب مزود خدمة");
    }

    storeSession(accessToken, refreshToken, userData);
    setToken(accessToken);
    setProvider(userData);
  };

  const logout = () => {
    providerLogout().catch(() => {});
    clearStoredSession();
    setProvider(null);
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ admin: provider, provider, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function normalizeProvider(user: Partial<ProviderUser> | null | undefined): ProviderUser | null {
  if (!user) return null;

  const id = user._id ?? user.id;
  return {
    _id: id,
    id,
    name: user.name ?? user.fullName ?? "Dev Provider",
    role: user.role ?? "PROVIDER",
    fullName: user.fullName ?? "Dev Provider",
    phoneNumber: user.phoneNumber ?? "+963000000000",
    accountType: user.accountType ?? "provider",
  };
}

function clearStoredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("provider_access_token");
  localStorage.removeItem("provider_refresh_token");
  localStorage.removeItem("provider_data");
  
  document.cookie = "provider_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function storeSession(accessToken: string, refreshToken: string, userData: ProviderUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem("provider_access_token", accessToken);
  localStorage.setItem("provider_refresh_token", refreshToken);
  localStorage.setItem("provider_data", JSON.stringify(userData));

  document.cookie = `provider_access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("provider_access_token");
}

function getStoredProvider() {
  if (typeof window === "undefined") return null;

  const storedToken = localStorage.getItem("provider_access_token");
  const storedUser = localStorage.getItem("provider_data");
  if (!storedToken || !storedUser) return null;

  try {
    return normalizeProvider(JSON.parse(storedUser));
  } catch {
    clearStoredSession();
    return null;
  }
}
