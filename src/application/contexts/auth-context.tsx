"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { AuthContextType, ProviderUser } from "@/domain/entities/auth.types";
import { clearStoredSession, getStoredSession, storeSession } from "@/infrastructure/auth/session";
import { providerLogin, providerLogout } from "@/infrastructure/services/auth.service";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isLoading, setIsLoading] = useState(false);
  const provider = session?.provider ?? null;
  const token = session?.accessToken ?? null;

  const login = async (phoneNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const payload = await providerLogin(phoneNumber.trim(), password);
      const providerData = normalizeProvider(payload.user);

      if (!payload.accessToken || !payload.refreshToken || !providerData) {
        throw new Error("بيانات الدخول غير صحيحة");
      }

      // مصدر الحقيقة لكون الحساب مزوّدًا هو `accountType`: الـ backend يخزّن
      // حسابات المزوّدين في `users` بـ accountType='provider' لكن حقل role
      // الخام يبقى 'user' (الدور يُشتقّ من accountType عند التوثيق فقط).
      // الاعتماد على role كان يرفض كل مزوّد سليم.
      const accountType = (providerData.accountType ?? providerData.role ?? "").toLowerCase();
      if (accountType !== "provider") {
        throw new Error("هذا الحساب ليس حساب مزود خدمة");
      }

      const nextSession = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        provider: providerData,
      };

      storeSession(nextSession);
      setSession(nextSession);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    void (async () => {
      try {
        await providerLogout();
      } catch {
        // Local session cleanup should still happen if the server logout endpoint is unreachable.
      } finally {
        clearStoredSession();
        setSession(null);
        window.location.href = "/login";
      }
    })();
  };

  return (
    <AuthContext.Provider value={{ provider, token, login, logout, isLoading }}>
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
    businessName: user.businessName ?? user.fullName ?? "Dev Provider",
    role: user.role ?? user.accountType ?? "provider",
    fullName: user.fullName ?? "Dev Provider",
    phoneNumber: user.phoneNumber ?? "+963000000000",
    accountType: user.accountType ?? "provider",
  };
}
