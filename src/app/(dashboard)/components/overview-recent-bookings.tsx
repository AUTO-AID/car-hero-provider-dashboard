"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, ChevronLeft, User, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { Booking } from "@/domain/entities/booking.types";

interface OverviewRecentBookingsProps {
  recentBookings: Booking[];
}

export function OverviewRecentBookings({ recentBookings }: OverviewRecentBookingsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="lg:col-span-2 glass-v2 border border-border/30 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </span>
          آخر الطلبات النشطة
        </CardTitle>
        <Link
          href="/orders"
          className="text-[11px] text-primary/70 hover:text-primary font-semibold flex items-center gap-1 transition-colors"
        >
          عرض الكل <ChevronLeft className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {recentBookings.length > 0 ? (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/20 border border-border/40 hover:border-border/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {booking.service?.name || "خدمة سيارات"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[180px]">
                        {booking.user?.fullName || "العميل"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>
                        {mounted
                          ? formatDistanceToNow(new Date(booking.createdAt), {
                              addSuffix: true,
                              locale: ar,
                            })
                          : "..."}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end">
                  <span className="text-xs font-bold text-white tabular-nums">
                    {booking.payableAmount?.toLocaleString()} ل.س
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border mt-1.5 ${
                      booking.status === "pending"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : booking.status === "accepted"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                    }`}
                  >
                    {booking.status === "pending"
                      ? "قيد الانتظار"
                      : booking.status === "accepted"
                      ? "مقبول"
                      : "جارٍ"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
              <Package className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground/60">
              لا توجد طلبات نشطة حالياً
            </p>
            <p className="text-[11px] text-muted-foreground/40 text-center max-w-[180px]">
              ستظهر هنا أحدث طلبات عملائك فور وصولها.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
