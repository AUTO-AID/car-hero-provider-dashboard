"use client";

import { CalendarClock, CarFront, ChevronLeft, User } from "lucide-react";
import type { Booking } from "@/domain/entities/booking.types";
import { Money } from "@/components/ui/money";
import { formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge, TONE_SURFACE, statusConfig } from "./status-badge";

interface OrderRowProps {
  order: Booking;
  onOpen: () => void;
  /** خارج التجميع اليومي يحتاج الصفّ تاريخه كاملاً لا ساعته فقط */
  showFullDate?: boolean;
  /** في مجموعة المواعيد يكون الوقت المهمّ هو الموعد لا لحظة الحجز */
  useScheduledDate?: boolean;
}

function vehicleLabel(order: Booking) {
  if (!order.vehicle) return null;
  const name = [order.vehicle.brand, order.vehicle.model].filter(Boolean).join(" ");
  return name || order.vehicle.plateNumber || null;
}

/**
 * صفّ الطلب: **الصفّ كلّه زرّ واحد**.
 *
 * البطاقة السابقة كانت تحمل ثلاثة أزرار داخلها (بدء/تفاصيل/إلغاء) في شبكة
 * من ثلاثة أعمدة، فكان على المزوّد أن يقرّر أين ينقر قبل أن يعرف ما في
 * الطلب أصلاً. الآن: نقرة واحدة في أي مكان تفتح كل شيء، والقرارات تُتَّخذ
 * في نافذة التفاصيل حيث تكون البيانات أمام العين.
 */
export function OrderRow({ order, onOpen, showFullDate, useScheduledDate }: OrderRowProps) {
  const config = statusConfig(order.status);
  const Icon = config.icon;
  const vehicle = vehicleLabel(order);
  const stamp = useScheduledDate && order.scheduledAt ? order.scheduledAt : order.createdAt;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`عرض تفاصيل طلب ${order.service?.name || "خدمة"} — ${config.label}`}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-start transition-colors",
          "hover:border-primary/50 hover:bg-secondary/30",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "sm:gap-4 sm:p-4"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border sm:size-12",
            TONE_SURFACE[config.tone]
          )}
        >
          <Icon className="size-5" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[0.95rem] font-bold text-foreground">
            {order.service?.name || "خدمة سيارات"}
          </span>

          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <User className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">{order.user?.fullName || "عميل غير معروف"}</span>
            </span>

            {vehicle && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <CarFront className="size-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{vehicle}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 tabular-nums">
              {useScheduledDate && order.scheduledAt && (
                <CalendarClock className="size-3.5 shrink-0 text-warning-soft" aria-hidden />
              )}
              {showFullDate || (useScheduledDate && !order.scheduledAt)
                ? formatDateTime(stamp)
                : formatTime(stamp)}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <Money value={order.payableAmount} className="text-sm font-bold text-foreground" />
          <StatusBadge status={order.status} />
        </span>

        <ChevronLeft
          className="size-5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
          aria-hidden
        />
      </button>
    </li>
  );
}
