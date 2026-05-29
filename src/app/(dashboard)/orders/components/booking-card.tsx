"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Booking } from "@/domain/entities/booking.types";
import { MapPin, Clock, User, CheckCircle2, Play, Check, Loader2, CarFront } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface BookingCardProps {
  booking: Booking;
  activeTab: string;
  onAccept: () => void;
  onStart: () => void;
  onComplete: () => void;
  isAccepting?: boolean;
  isStarting?: boolean;
  isCompleting?: boolean;
}

export function BookingCard({
  booking,
  activeTab,
  onAccept,
  onStart,
  onComplete,
  isAccepting = false,
  isStarting = false,
  isCompleting = false,
}: BookingCardProps) {
  const [lng, lat] = booking.location?.coordinates || [];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5 space-y-4">
        {/* Top: status + amount */}
        <div className="flex items-center justify-between">
          <StatusBadge status={booking.status} />
          <span className="text-sm font-black text-foreground tabular-nums">
            {booking.payableAmount?.toLocaleString()} ل.س
          </span>
        </div>

        {/* Service name */}
        <h3 className="font-bold text-base text-white leading-snug">
          {booking.service?.name || "خدمة سيارات"}
        </h3>

        {/* Meta rows */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/75">
            <User className="w-3.5 h-3.5 shrink-0 text-primary/50" />
            <span>{booking.user?.fullName || "عميل غير معروف"}</span>
          </div>

          {/* Vehicle info block if available */}
          {booking.vehicle && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/75 bg-secondary/20 p-2.5 rounded-xl border border-border/20">
              <CarFront className="w-4 h-4 shrink-0 text-primary/60" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground leading-none truncate">
                  {booking.vehicle.brand} {booking.vehicle.model}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {booking.vehicle.color && (
                    <span className="text-[10px] text-muted-foreground/50">
                      اللون: {booking.vehicle.color}
                    </span>
                  )}
                  {booking.vehicle.plateNumber && (
                    <span className="text-[9px] bg-black/30 border border-border/40 rounded px-1.5 py-0.5 tabular-nums">
                      {booking.vehicle.plateNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground/75">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/50 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="truncate">{booking.address || "موقع محدد مسبقاً"}</p>
              {lat && lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1 font-semibold"
                >
                  عرض الموقع على خرائط جوجل 🌍
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/75">
            <Clock className="w-3.5 h-3.5 shrink-0 text-primary/50" />
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

        {/* Action buttons */}
        {activeTab === "current" && (
          <div className="pt-3 flex gap-2 border-t border-border/20">
            {booking.status === "pending" && (
              <Button
                onClick={onAccept}
                disabled={isAccepting}
                className="flex-1 h-9 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 font-bold text-xs gap-1.5"
              >
                {isAccepting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                قبول
              </Button>
            )}
            {booking.status === "accepted" && (
              <Button
                onClick={onStart}
                disabled={isStarting}
                className="flex-1 h-9 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/20 font-bold text-xs gap-1.5"
              >
                {isStarting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                بدء التنفيذ
              </Button>
            )}
            {booking.status === "in_progress" && (
              <Button
                onClick={onComplete}
                disabled={isCompleting}
                className="flex-1 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 font-bold text-xs gap-1.5"
              >
                {isCompleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                إكمال
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
