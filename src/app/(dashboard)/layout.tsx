"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useClientReady } from "@/application/hooks/use-client-ready";
import { useAuth } from "@/application/contexts/auth-context";
import { ShellProvider, useShell } from "@/application/contexts/shell-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LoadingState } from "@/components/ui/states";
import { prefetchProviderDashboardData } from "@/application/services/prefetch";
import { RealTimeNotificationProvider } from "@/components/providers/notification-alert-provider";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { provider, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useClientReady();

  useEffect(() => {
    if (mounted && !isLoading && !provider) router.replace("/login");
  }, [provider, isLoading, router, mounted]);

  useEffect(() => {
    if (!provider) return;

    const prefetch = () => {
      void prefetchProviderDashboardData(queryClient);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetch, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [provider, queryClient]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState className="min-h-screen" />
      </div>
    );
  }

  if (!provider) return null;

  return (
    <RealTimeNotificationProvider>
      <ShellProvider>
        <DashboardShell>{children}</DashboardShell>
      </ShellProvider>
    </RealTimeNotificationProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useShell();

  return (
    <div className="min-h-screen bg-background">
      {/* رابط التخطّي: يسمح لمستخدم الكيبورد بتجاوز ستّة روابط تنقّل في كل
          تحميل صفحة بدل المرور عليها واحداً واحداً */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[var(--z-overlay)] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        تخطّي إلى المحتوى
      </a>

      <Sidebar />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300",
          isSidebarCollapsed ? "lg:ms-[76px]" : "lg:ms-[264px]"
        )}
      >
        <Header />

        {/* عرض موحّد لكل المسارات: كانت الصفحات تتفاوت بين بلا حدّ أقصى و
            max-w-7xl و max-w-4xl و max-w-3xl، فيقفز المحتوى عند كل تنقّل.
            حُذف أيضاً `overflow-x-hidden` الذي كان يخفي التجاوز بدل معالجته. */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
