"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/application/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Loader2 } from "lucide-react";
import { prefetchProviderDashboardData } from "@/application/services/prefetch";
import { RealTimeNotificationProvider } from "@/components/providers/notification-alert-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !admin) router.replace("/login");
  }, [admin, isLoading, router, mounted]);

  useEffect(() => {
    if (!admin) return;

    const prefetch = () => {
      void prefetchProviderDashboardData(queryClient);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetch, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [admin, queryClient]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <RealTimeNotificationProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div 
          className="flex-1 flex flex-col min-h-screen w-full transition-all duration-300"
          style={{ marginRight: 'var(--sidebar-width)' }}
        >
          <Header />
          <main className="flex-1 p-6 w-full">
            {children}
          </main>
        </div>
      </div>
    </RealTimeNotificationProvider>
  );
}
