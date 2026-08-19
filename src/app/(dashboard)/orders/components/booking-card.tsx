"use client";

import { CalendarClock, CarFront, Check, CheckCircle2, Clock, Eye, MapPin, Play, User, X } from "lucide-react";
import { Booking } from "@/domain/entities/booking.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money, RelativeTime } from "@/components/ui/money";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface BookingCardProps {
  booking: Booking;
  onAccept: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onViewDetails: () => void;
  pendingAction?: string;
}

/** الإجراء الأساسي الوحيد المتاح في الحالة الراهنة للطلب. */
function primaryAction(status: string) {
  if (status === "pending") return { key: "accept", label: "قبول الطلب", icon: CheckCircle2 } as const;
  if (["accepted", "provider_assigned", "provider_en_route", "provider_arrived"].includes(status))
    return { key: "start", label: "بدء التنفيذ", icon: Play } as const;
  if (status === "in_progress") return { key: "complete", label: "إنهاء الطلب", icon: Check } as const;
  return null;
}

export function BookingCard({
  booking,
  onAccept,
  onStart,
  onComplete,
  onCancel,
  onViewDetails,
  pendingAction,
}: BookingCardProps) {
  const [lng, lat] = booking.location?.coordinates || [];
  const isPending = Boolean(pendingAction);
  const canCancel = ["pending", "accepted"].includes(booking.status);

  // إجراء أساسي واحد بارز. كانت البطاقة تعرض ثلاثة أزرار متدرّجة الألوان
  // (أزرق/بنفسجي/أخضر) بالوزن البصري نفسه، فلا شيء يدلّ على الخطوة التالية.
  const action = primaryAction(booking.status);
  const runAction = action?.key === "accept" ? onAccept : action?.key === "start" ? onStart : onComplete;

  return (
    <Card className="gap-0 transition-colors hover:border-primary/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={booking.status} />
          <Money value={booking.payableAmount} className="text-sm font-bold" />
        </div>

        <div>
          <h3 className="text-base leading-snug font-bold text-foreground">
            {booking.service?.name || "خدمة سيارات"}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground" dir="ltr">
            {booking.orderNumber || booking._id}
          </p>
        </div>

        <dl className="space-y-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            <dt className="sr-only">العميل</dt>
            <dd>{booking.user?.fullName || "عميل غير معروف"}</dd>
          </div>

          {booking.isScheduled && booking.scheduledAt && (
            <div className="flex items-center gap-2 text-warning-soft">
              <CalendarClock className="size-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">الموعد</dt>
              <dd>{formatDateTime(booking.scheduledAt)}</dd>
            </div>
          )}

          {booking.vehicle && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 p-2.5">
              <CarFront className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
              <div className="min-w-0 flex-1">
                <dt className="sr-only">المركبة</dt>
                <dd className="truncate font-semibold text-foreground">
                  {[booking.vehicle.brand, booking.vehicle.model].filter(Boolean).join(" ") || "مركبة العميل"}
                </dd>
                {booking.vehicle.plateNumber && (
                  <span className="text-[11px] text-muted-foreground">{booking.vehicle.plateNumber}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            <div className="min-w-0">
              <dt className="sr-only">الموقع</dt>
              <dd className="truncate">{booking.address || "موقع محدّد مسبقاً"}</dd>
              {typeof lat === "number" && typeof lng === "number" && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-[11px] font-semibold text-primary hover:underline"
                >
                  عرض الموقع على الخريطة
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            <dt className="sr-only">وقت الإنشاء</dt>
            <dd><RelativeTime value={booking.createdAt} /></dd>
          </div>
        </dl>

        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          {action && (
            <Button
              type="button"
              onClick={runAction}
              loading={pendingAction === action.key}
              disabled={isPending}
              className="flex-1"
            >
              {pendingAction !== action.key && <action.icon aria-hidden />} {action.label}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onViewDetails}
            className={action ? undefined : "flex-1"}
          >
            <Eye aria-hidden /> التفاصيل
          </Button>

          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              loading={pendingAction === "cancel"}
              disabled={isPending}
              aria-label="إلغاء الطلب"
              title="إلغاء الطلب"
              className="text-muted-foreground hover:bg-danger/10 hover:text-danger-soft"
            >
              {pendingAction !== "cancel" && <X aria-hidden />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
