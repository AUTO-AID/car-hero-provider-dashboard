"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

const COLLAPSE_KEY = "provider_sidebar_collapsed";

/**
 * تفضيل طيّ الشريط الجانبي مخزَّن خارج React (localStorage).
 * `useSyncExternalStore` هو الأداة المخصّصة لذلك: يُرجع `false` على الخادم
 * فلا يقع اختلاف ترطيب، ويقرأ القيمة الحقيقية على العميل دون `setState`
 * داخل `useEffect` (الذي يسبّب دورة رسم إضافية عند كل تحميل).
 */
const collapseStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    collapseStore.listeners.add(listener);
    // لا بدّ أن تُرجع دالة إلغاء اشتراك؛ `Set.delete` تُرجع boolean
    // فيحاول React استدعاءه عند التنظيف ويرمي خطأً.
    return () => {
      collapseStore.listeners.delete(listener);
    };
  },
  getSnapshot: () => localStorage.getItem(COLLAPSE_KEY) === "true",
  getServerSnapshot: () => false,
  set(next: boolean) {
    localStorage.setItem(COLLAPSE_KEY, String(next));
    collapseStore.listeners.forEach((listener) => listener());
  },
};

interface ShellContextValue {
  /** الشريط الجانبي مطويّ على الشاشات الكبيرة */
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  /** درج التنقّل على الجوال */
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  /** تحديث بيانات اللوحة كلّها */
  refreshAll: () => void;
  isRefreshing: boolean;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isSidebarCollapsed = useSyncExternalStore(
    collapseStore.subscribe,
    collapseStore.getSnapshot,
    collapseStore.getServerSnapshot
  );

  // عدّاد react-query العام: زرّ التحديث في الهيدر يدور طالما هناك أي طلب جارٍ،
  // بدل أن تصنع كل صفحة زرّها الخاص بحالته الخاصة.
  const fetchingCount = useIsFetching();

  const toggleSidebar = useCallback(() => {
    collapseStore.set(!collapseStore.getSnapshot());
  }, []);

  const openMobileNav = useCallback(() => setIsMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  const refreshAll = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  const value = useMemo<ShellContextValue>(
    () => ({
      isSidebarCollapsed,
      toggleSidebar,
      isMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      refreshAll,
      isRefreshing: fetchingCount > 0,
    }),
    [
      isSidebarCollapsed,
      toggleSidebar,
      isMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      refreshAll,
      fetchingCount,
    ]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
