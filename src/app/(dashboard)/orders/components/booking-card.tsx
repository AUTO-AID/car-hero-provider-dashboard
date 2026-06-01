"use client";

import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarClock, CarFront, Check, CheckCircle2, Clock, Eye, Loader2, MapPin, Play, User, X } from "lucide-react";
import { Booking } from "@/domain/entities/booking.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card className="glass-v2 border border-border/30 rounded-xl overflow-hidden hover:border-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-sm font-black text-foreground tabular-nums">
            {(booking.payableAmount ?? 0).toLocaleString("ar-SY")} ل.س
          </span>
        </div>

        <div>
          <h3 className="font-bold text-base text-white leading-snug">
            {booking.service?.name || "خدمة سيارات"}
          </h3>
          <p className="mt-1 text-[10px] font-mono text-muted-foreground/60" dir="ltr">
            {booking.orderNumber || booking._id}
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/75">
            <User className="w-3.5 h-3.5 shrink-0 text-primary/50" />
            <span>{booking.user?.fullName || "عميل غير معروف"}</span>
          </div>

          {booking.isScheduled && booking.scheduledAt && (
            <div className="flex items-center gap-2 text-xs text-amber-300/90">
              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
              <span>{new Date(booking.scheduledAt).toLocaleString("ar-SY")}</span>
            </div>
          )}

          {booking.vehicle && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/75 bg-secondary/20 p-2.5 rounded-lg border border-border/20">
              <CarFront className="w-4 h-4 shrink-0 text-primary/60" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">
                  {[booking.vehicle.brand, booking.vehicle.model].filter(Boolean).join(" ") || "مركبة العميل"}
                </p>
                {booking.vehicle.plateNumber && (
                  <span className="text-[10px] text-muted-foreground/60">{booking.vehicle.plateNumber}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground/75">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/50 mt-0.5" />
            <div className="min-w-0">
              <p className="truncate">{booking.address || "موقع محدد مسبقاً"}</p>
              {typeof lat === "number" && typeof lng === "number" && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-[10px] text-primary hover:underline mt-1 font-semibold"
                >
                  عرض الموقع على الخريطة
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/75">
            <Clock className="w-3.5 h-3.5 shrink-0 text-primary/50" />
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true, locale: ar })}</span>
          </div>
        </div>

        <div className="pt-3 flex flex-wrap gap-2 border-t border-border/20">
          <Button type="button" variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
            <Eye /> التفاصيل
          </Button>
          {booking.status === "pending" && (
            <Button type="button" size="sm" onClick={onAccept} disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-500">
              {pendingAction === "accept" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} قبول
            </Button>
          )}
          {["accepted", "provider_assigned", "provider_en_route", "provider_arrived"].includes(booking.status) && (
            <Button type="button" size="sm" onClick={onStart} disabled={isPending} className="flex-1 bg-violet-600 hover:bg-violet-500">
              {pendingAction === "start" ? <Loader2 className="animate-spin" /> : <Play />} بدء التنفيذ
            </Button>
          )}
          {booking.status === "in_progress" && (
            <Button type="button" size="sm" onClick={onComplete} disabled={isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
              {pendingAction === "complete" ? <Loader2 className="animate-spin" /> : <Check />} إكمال
            </Button>
          )}
          {canCancel && (
            <Button type="button" variant="destructive" size="sm" onClick={onCancel} disabled={isPending} aria-label="إلغاء الطلب">
              {pendingAction === "cancel" ? <Loader2 className="animate-spin" /> : <X />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
