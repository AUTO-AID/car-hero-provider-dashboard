"use client";

import Link from "next/link";
import { ChevronLeft, Clock, Package, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money, RelativeTime } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/states";
import { Booking } from "@/domain/entities/booking.types";
import { StatusBadge } from "@/app/(dashboard)/orders/components/status-badge";

interface OverviewRecentBookingsProps {
  recentBookings: Booking[];
}

export function OverviewRecentBookings({ recentBookings }: OverviewRecentBookingsProps) {
  return (
    <Card className="gap-0 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-primary" aria-hidden /> آخر الطلبات النشطة
        </CardTitle>
        <Link
          href="/orders"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          عرض الكل <ChevronLeft className="size-3.5" aria-hidden />
        </Link>
      </CardHeader>

      <CardContent className="p-5">
        {recentBookings.length > 0 ? (
          <ul className="space-y-3">
            {recentBookings.map((booking) => (
              <li key={booking._id}>
                <Link
                  href="/orders"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3.5 transition-colors hover:border-primary/40 hover:bg-secondary/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <User className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {booking.service?.name || "خدمة سيارات"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="max-w-[140px] truncate">
                          {booking.user?.fullName || "العميل"}
                        </span>
                        <span className="size-1 rounded-full bg-border" aria-hidden />
                        <RelativeTime value={booking.createdAt} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Money value={booking.payableAmount} className="text-sm font-bold text-foreground" />
                    <StatusBadge status={booking.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={Package}
            title="لا توجد طلبات نشطة حالياً"
            description="ستظهر هنا أحدث طلبات عملائك فور وصولها."
          />
        )}
      </CardContent>
    </Card>
  );
}
