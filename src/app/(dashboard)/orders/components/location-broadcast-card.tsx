"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, TriangleAlert } from "lucide-react";
import { Booking } from "@/domain/entities/booking.types";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useLocationBroadcast } from "@/application/hooks/use-location-broadcast";

/**
 * الحالات التي يقبل فيها الخادم تحديث الموقع
 * (UpdateProviderLocationUseCase.activeStatuses). الإرسال خارجها يُردّ بـ 400،
 * فنقصر البثّ عليها بدل توليد أخطاء متكرّرة.
 */
const TRACKABLE = new Set([
  "accepted",
  "provider_assigned",
  "provider_en_route",
  "provider_arrived",
  "in_progress",
]);

function formatClock(ms: number | null): string {
  if (!ms) return "لم يُرسل بعد";
  return new Date(ms).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LocationBroadcastCard({ bookings }: { bookings: Booking[] }) {
  const orderIds = useMemo(
    () =>
      bookings
        .filter((booking) => TRACKABLE.has(String(booking.status).toLowerCase()))
        .map((booking) => booking.id || booking._id)
        .filter(Boolean) as string[],
    [bookings],
  );

  const { supported, enabled, setEnabled, error, lastSentAt, accuracyM, sentCount, skippedCount } =
    useLocationBroadcast(orderIds);

  // «آخر إرسال منذ ٤ ثوانٍ» يجب أن يتقادم مع مرور الوقت لا مع وصول بيانات
  // جديدة. الساعة في حالة لا في نداء Date.now() أثناء التصيير: الأخير يجعل
  // ناتج المكوّن غير مستقرّ ويتغيّر مع أي إعادة تصيير عارضة.
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  // لا طلبات نشطة ⇒ لا شيء يُبَثّ إليه. إخفاء البطاقة أصدق من عرض مفتاح
  // مفعَّل لا يفعل شيئاً.
  if (!orderIds.length) return null;

  const secondsAgo = lastSentAt && now ? Math.max(0, Math.round((now - lastSentAt) / 1000)) : null;
  const healthy = enabled && !error && secondsAgo !== null && secondsAgo < 90;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={
              "flex size-9 shrink-0 items-center justify-center rounded-lg " +
              (healthy ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")
            }
          >
            <Navigation className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">مشاركة موقعي مع العميل</p>
            <p className="text-xs text-muted-foreground">
              {orderIds.length === 1
                ? "طلب نشط واحد — يرى العميل سيارتك على الخريطة"
                : `${orderIds.length.toLocaleString("ar-SY")} طلبات نشطة — يرى العملاء سيارتك على الخريطة`}
            </p>
          </div>
        </div>

        {supported ? (
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {enabled ? "مُفعَّل" : "متوقّف"}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={(value: boolean) => setEnabled(value)}
              aria-label="مشاركة الموقع مع العميل"
            />
          </label>
        ) : (
          <p className="text-xs font-semibold text-warning">المتصفّح لا يدعم تحديد الموقع</p>
        )}
      </div>

      {/* الحالة التشغيلية ظاهرة دائماً: مفتاح «مُفعَّل» بينما لا يصل شيء هو
          بالضبط العطل الصامت الذي يجعل العميل يظنّ الفني متوقّفاً. */}
      {enabled ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/20 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={
                "size-2 rounded-full " + (healthy ? "animate-pulse bg-success" : "bg-muted-foreground/40")
              }
            />
            {healthy ? "يُبثّ الآن" : "بانتظار إشارة GPS"}
          </span>
          <span>
            آخر إرسال: <span className="font-semibold text-foreground tabular-nums">{formatClock(lastSentAt)}</span>
            {secondsAgo !== null ? ` (منذ ${secondsAgo.toLocaleString("ar-SY")}ث)` : ""}
          </span>
          {accuracyM !== null ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              دقّة <span className="font-semibold text-foreground tabular-nums">{accuracyM.toLocaleString("ar-SY")}</span> م
            </span>
          ) : null}
          <span className="tabular-nums">
            أُرسل {sentCount.toLocaleString("ar-SY")}
            {skippedCount > 0 ? ` · تُجوهل ${skippedCount.toLocaleString("ar-SY")} لضعف الدقّة` : ""}
          </span>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </Card>
  );
}
