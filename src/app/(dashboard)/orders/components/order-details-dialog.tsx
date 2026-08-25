"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CalendarClock,
  CarFront,
  Check,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Phone,
  Play,
  Smartphone,
  StickyNote,
  User,
  UserCheck,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { providerQueryKeys } from "@/application/services/prefetch";
import type { Booking, DateLike } from "@/domain/entities/booking.types";
import { getBookingDetails } from "@/infrastructure/services/bookings.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge, TONE_SURFACE, statusConfig } from "./status-badge";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الدفع",
  completed: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
};

/**
 * تسميات القراءة تشمل المتقاعد أيضاً: طلبات قديمة تحمل `wallet` و`card`،
 * وعرضها بقيمتها الخام في نافذة عربية يبدو كعطل.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقداً عند الاستلام",
  points: "نقاط الولاء",
  cham_cash: "شام كاش",
  wallet: "المحفظة (متقاعد)",
  card: "بطاقة (متقاعد)",
  online: "دفع إلكتروني (متقاعد)",
};

/**
 * الإجراء الأساسي الوحيد المتاح في الحالة الراهنة للطلب.
 *
 * لا إجراء على `pending`: الطلب في هذه الحالة **عرضٌ بمهلة** مفتوح على تطبيق
 * الفنّي، والردّ عليه هناك حصراً. القبول من هنا كان يمرّ بمسار تغيير الحالة
 * العام فيتجاوز دفاتر العروض — يبقى العرض مفتوحاً ولا يُسجَّل عدّاد القبول —
 * ويسمح بأخذ طلب من أمام حاسوب لا يمكن الوصول منه إلى موقع العطل.
 */
function primaryAction(status: string) {
  if (["accepted", "provider_assigned", "provider_en_route", "provider_arrived"].includes(status))
    return { key: "start", label: "بدء التنفيذ", nextStatus: "in_progress", icon: Play } as const;
  if (status === "in_progress")
    return { key: "complete", label: "إنهاء الطلب", nextStatus: "completed", icon: Check } as const;
  return null;
}

interface OrderDetailsDialogProps {
  orderId: string | null;
  onClose: () => void;
  onStatusChange: (order: Booking, actionKey: string, nextStatus: string) => void;
  onRequestCancel: (order: Booking) => void;
  pendingAction?: string;
}

export function OrderDetailsDialog({
  orderId,
  onClose,
  onStatusChange,
  onRequestCancel,
  pendingAction,
}: OrderDetailsDialogProps) {
  const detailsQuery = useQuery({
    queryKey: providerQueryKeys.bookingDetails(orderId ?? ""),
    queryFn: () => getBookingDetails(orderId!),
    enabled: Boolean(orderId),
  });

  const order = detailsQuery.data;
  const action = order ? primaryAction(order.status) : null;

  // الإلغاء يخرج من `pending` لسبب مماثل: هذه الحالة عرضٌ لم يُقبل بعد،
  // وإلغاؤه من اللوحة **يقتل طلب العميل** بدل أن يمرّره إلى الفنّي التالي.
  const canCancel = order?.status === "accepted";

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {!order ? (
          <>
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب</DialogTitle>
              <DialogDescription>
                {detailsQuery.isError ? "تعذّر جلب البيانات" : "جارٍ جلب بيانات الطلب…"}
              </DialogDescription>
            </DialogHeader>
            {detailsQuery.isError ? (
              <ErrorState
                compact
                description="لم يستجب الخادم لطلب تفاصيل هذا الطلب."
                onRetry={() => void detailsQuery.refetch()}
                isRetrying={detailsQuery.isFetching}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-bold">
                  {order.service?.name || "خدمة سيارات"}
                </DialogTitle>
                <StatusBadge status={order.status} withIcon />
              </div>
              <DialogDescription>
                <span className="font-mono text-xs" dir="ltr">
                  {order.orderNumber || order._id}
                </span>
                {" · "}
                {statusConfig(order.status).hint}
              </DialogDescription>
            </DialogHeader>

            <AmountBand order={order} />

            {order.isScheduled && order.scheduledAt && (
              <p className="flex flex-wrap items-center gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm font-semibold text-warning-soft">
                <CalendarClock className="size-4 shrink-0" aria-hidden />
                موعد محجوز:
                <span className="tabular-nums">{formatDateTime(order.scheduledAt)}</span>
              </p>
            )}

            <OrderTimeline order={order} />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock icon={User} title="العميل">
                <p className="font-semibold">{order.user?.fullName || "عميل غير معروف"}</p>
                {order.user?.phoneNumber && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    render={<a href={`tel:${order.user.phoneNumber}`} />}
                  >
                    <Phone aria-hidden />
                    <span dir="ltr" className="font-mono text-xs">
                      {order.user.phoneNumber}
                    </span>
                  </Button>
                )}
              </InfoBlock>

              <InfoBlock icon={CarFront} title="المركبة">
                {order.vehicle ? (
                  <>
                    <p className="font-semibold">
                      {[order.vehicle.brand, order.vehicle.model].filter(Boolean).join(" ") || "مركبة العميل"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[order.vehicle.plateNumber, order.vehicle.color].filter(Boolean).join(" · ") ||
                        "بلا تفاصيل إضافية"}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">لم يحدّد العميل مركبة</p>
                )}
              </InfoBlock>

              <InfoBlock icon={MapPin} title="موقع الخدمة" className="sm:col-span-2">
                <p>{order.address || "موقع محدّد على الخريطة"}</p>
                <MapLink order={order} />
              </InfoBlock>
            </div>

            {order.userNotes && (
              <InfoBlock icon={StickyNote} title="ملاحظات العميل">
                <p className="leading-relaxed">{order.userNotes}</p>
              </InfoBlock>
            )}

            {order.cancellationReason && (
              <div className="rounded-xl border border-danger/25 bg-danger/10 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-danger-soft">
                  <XCircle className="size-3.5" aria-hidden /> سبب الإلغاء
                </p>
                <p className="text-sm leading-relaxed text-foreground">{order.cancellationReason}</p>
              </div>
            )}

            {order.status === "pending" && (
              <p
                role="note"
                className="flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground"
              >
                <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                هذا الطلب معروض الآن على تطبيق الفنّي بمهلة قصيرة. القبول أو الاعتذار من التطبيق وحده،
                حتى لا يُؤخذ طلب من أمام حاسوب لا يمكن الوصول منه إلى موقع العطل.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                إغلاق
              </Button>

              {canCancel && (
                <Button
                  type="button"
                  variant="destructive-soft"
                  onClick={() => onRequestCancel(order)}
                  disabled={Boolean(pendingAction)}
                >
                  <XCircle aria-hidden /> إلغاء الطلب
                </Button>
              )}

              {action && (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => onStatusChange(order, action.key, action.nextStatus)}
                  loading={pendingAction === action.key}
                  disabled={Boolean(pendingAction)}
                >
                  {pendingAction !== action.key && <action.icon aria-hidden />} {action.label}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AmountBand({ order }: { order: Booking }) {
  const paymentMethod = order.paymentMethod
    ? PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod
    : null;
  const paymentStatus = order.paymentStatus
    ? PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus
    : null;
  const paid = order.paymentStatus === "completed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">المبلغ المستحق</p>
        <Money value={order.payableAmount} className="text-2xl font-bold text-foreground" />
      </div>

      <div className="flex flex-col items-end gap-1 text-xs">
        {paymentMethod && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <Banknote className="size-4 text-muted-foreground" aria-hidden />
            {paymentMethod}
          </span>
        )}
        {paymentStatus && (
          <span className={cn("font-semibold", paid ? "text-success-soft" : "text-warning-soft")}>
            {paymentStatus}
          </span>
        )}
      </div>
    </div>
  );
}

interface TimelineStep {
  label: string;
  at: DateLike | undefined;
  icon: LucideIcon;
  tone: keyof typeof TONE_SURFACE;
}

/**
 * مسار الطلب من أختامه المحفوظة على المستند.
 *
 * هذا ما كان ناقصاً فعلاً حين طُلب «تاريخ الطلبات»: النافذة السابقة كانت
 * تعرض لحظة الإنشاء وحدها، فلا يعرف المزوّد متى قُبل الطلب ولا كم استغرق
 * التنفيذ — وهي الأسئلة التي يُسأل عنها حين يتّصل عميل معترض.
 */
function OrderTimeline({ order }: { order: Booking }) {
  const steps = [
    { label: "وصل الطلب", at: order.createdAt, icon: ClipboardList, tone: "neutral" },
    { label: "قُبل الطلب", at: order.acceptedAt, icon: UserCheck, tone: "info" },
    { label: "وصل الفنّي إلى الموقع", at: order.arrivedAt, icon: MapPin, tone: "info" },
    { label: "بدأ التنفيذ", at: order.startedAt, icon: Wrench, tone: "default" },
    { label: "اكتمل الطلب", at: order.completedAt, icon: CheckCircle2, tone: "success" },
    { label: "أُلغي الطلب", at: order.cancelledAt, icon: XCircle, tone: "danger" },
  ].filter((step): step is TimelineStep => Boolean(step.at));

  return (
    <section className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <h3 className="mb-3 text-xs font-semibold text-muted-foreground">مسار الطلب</h3>
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  TONE_SURFACE[step.tone]
                )}
              >
                <step.icon className="size-4" />
              </span>
              {index < steps.length - 1 && <span className="my-1 w-px flex-1 bg-border/60" />}
            </div>
            <div className={cn("min-w-0", index < steps.length - 1 && "pb-4")}>
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{formatDateTime(step.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-secondary/20 p-3", className)}>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {title}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function MapLink({ order }: { order: Booking }) {
  const [lng, lat] = order.location?.coordinates ?? [];
  // (0,0) هو ما يكتبه الخادم حين لا يصل موقع مع الطلب. رابط خريطة إلى خليج
  // غينيا ليس «موقع الخدمة»، فيُخفى الزرّ بدل أن يقود المزوّد إلى العدم.
  if (typeof lat !== "number" || typeof lng !== "number" || (lat === 0 && lng === 0)) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      render={
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
        />
      }
    >
      <MapPin aria-hidden /> فتح الموقع على الخريطة
    </Button>
  );
}
