"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProviderBookings, updateBookingStatus } from "@/infrastructure/services/bookings.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Booking } from "@/domain/entities/booking.types";
import { Card } from "@/components/ui/card";
import { Calendar, Package, History } from "lucide-react";
import { toast } from "sonner";
import { WeeklyPerformanceChart } from "./components/weekly-performance-chart";
import { TabButton } from "./components/tab-button";
import { BookingCard } from "./components/booking-card";

export default function ProviderOrdersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  const { data, isLoading } = useQuery({
    queryKey: providerQueryKeys.bookings(activeTab),
    queryFn: () => getProviderBookings(activeTab),
  });

  const bookings = data?.data ?? [];
  const weeklyPerformance = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const dayBookings = bookings.filter((booking: Booking) => {
      const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
      return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt.toISOString().slice(0, 10) === key;
    });
    return {
      day: date.toLocaleDateString("ar-SY", { weekday: "short" }),
      orders: dayBookings.length,
      revenue: dayBookings
        .filter((booking: Booking) => booking.status === "completed")
        .reduce((sum: number, booking: Booking) => sum + (booking.payableAmount ?? 0), 0),
    };
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, "accepted"),
    onSuccess: () => {
      toast.success("تم قبول الطلب");
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    },
  });

  const startMut = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, "in_progress"),
    onSuccess: () => {
      toast.success("بدأ التنفيذ");
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    },
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, "completed"),
    onSuccess: () => {
      toast.success("اكتمل الطلب");
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Page Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border/20" />
          <div className="space-y-2">
            <div className="h-7 w-32 bg-card rounded-md" />
            <div className="h-4 w-48 bg-card/60 rounded-md" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-6 border-b border-border/20 pb-3">
          <div className="h-4 w-28 bg-card rounded-md" />
          <div className="h-4 w-28 bg-card rounded-md" />
        </div>

        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card/40 border border-border/20 h-56 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 bg-secondary/80 rounded-full" />
                <div className="h-5 w-16 bg-secondary/80 rounded-md" />
              </div>
              <div className="h-6 w-44 bg-secondary/80 rounded-md my-4" />
              <div className="space-y-2">
                <div className="h-3 w-32 bg-secondary/50 rounded-md" />
                <div className="h-3 w-40 bg-secondary/50 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ─── Page Header ─── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gradient tracking-tight">
            طلباتي
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {activeTab === "current" ? "الطلبات النشطة الحالية" : "سجل جميع طلباتك السابقة"}
          </p>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-6 border-b border-border/30">
        <TabButton
          label="الطلبات الحالية"
          active={activeTab === "current"}
          onClick={() => setActiveTab("current")}
        />
        <TabButton
          label="السجل التاريخي"
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
      </div>

      {/* ─── Weekly Performance Overview ─── */}
      <WeeklyPerformanceChart data={weeklyPerformance} />

      {/* ─── Content ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bookings.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border/40 bg-secondary/10">
            <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
              {activeTab === "current" ? (
                <Package className="w-7 h-7 text-muted-foreground/30" />
              ) : (
                <History className="w-7 h-7 text-muted-foreground/30" />
              )}
            </div>
            <p className="text-sm font-semibold text-muted-foreground/60">
              لا توجد طلبات في هذا القسم
            </p>
            <p className="text-[11px] text-muted-foreground/40 text-center max-w-[200px]">
              {activeTab === "current"
                ? "ستظهر هنا طلبات العملاء الجديدة فور وصولها"
                : "لم تُنجز أي طلبات بعد"}
            </p>
          </div>
        ) : (
          bookings.map((booking: Booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              activeTab={activeTab}
              onAccept={() => acceptMut.mutate(booking._id)}
              onStart={() => startMut.mutate(booking._id)}
              onComplete={() => completeMut.mutate(booking._id)}
              isAccepting={acceptMut.isPending && acceptMut.variables === booking._id}
              isStarting={startMut.isPending && startMut.variables === booking._id}
              isCompleting={completeMut.isPending && completeMut.variables === booking._id}
            />
          ))
        )}
      </div>
    </div>
  );
}
