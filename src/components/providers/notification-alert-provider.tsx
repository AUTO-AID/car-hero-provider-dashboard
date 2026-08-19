"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { useSocket } from "@/application/hooks/use-socket";
import { Booking } from "@/domain/entities/booking.types";
import { cancelBooking, getBookingDetails, updateBookingStatus } from "@/infrastructure/services/bookings.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/ui/money";
import { Bell, MapPin, User, DollarSign, Clock, FileText, Check, X } from "lucide-react";

interface OrderNotification {
  type: string;
  title?: string;
  body?: string;
  data?: {
    orderId?: string;
    [key: string]: unknown;
  };
}

export interface NotificationEntry {
  id: string;
  type: string;
  title: string;
  body?: string;
  orderId?: string;
  receivedAt: number;
  read: boolean;
}

interface RealTimeNotificationContextType {
  activeNotification: OrderNotification | null;
  closeNotification: () => void;
  /** آخر ما وصل عبر السوكِت — يغذّي جرس الإشعارات في الهيدر */
  notifications: NotificationEntry[];
  unreadCount: number;
  markAllRead: () => void;
  clearNotifications: () => void;
  /** حالة السوكِت الفعلية — تغذّي مؤشّر الاتصال في الشريط الجانبي */
  isConnected: boolean;
}

const MAX_HISTORY = 20;

const TYPE_TITLES: Record<string, string> = {
  "order.created": "طلب حجز جديد",
  ORDER_CREATED: "طلب حجز جديد",
  "order.cancelled": "أُلغي طلب",
  "order.updated": "تحديث على طلب",
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const RealTimeNotificationContext = createContext<RealTimeNotificationContextType | null>(null);

export function RealTimeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [activeNotification, setActiveNotification] = useState<OrderNotification | null>(null);
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const activeOrderId = activeNotification?.data?.orderId;
  const orderQuery = useQuery({
    queryKey: providerQueryKeys.bookingDetails(activeOrderId ?? ""),
    queryFn: () => getBookingDetails(activeOrderId!),
    enabled: Boolean(activeOrderId),
  });

  const orderData = orderQuery.data;

  const invalidateOrderData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingsRoot });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.weeklyBookings });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.dashboardAllStats });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.wallet });
    if (activeOrderId) {
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingDetails(activeOrderId) });
    }
  }, [activeOrderId, queryClient]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: OrderNotification) => {
      invalidateOrderData();

      // كل إشعار يُحفظ في السجلّ، لا الطلبات الجديدة فقط: الجرس كان يعرض
      // العدد 0 دائماً لأن لا شيء كان يُخزَّن أصلاً.
      setNotifications((current) =>
        [
          {
            id: `${notification.type}-${notification.data?.orderId ?? ""}-${Date.now()}`,
            type: notification.type,
            title: notification.title || TYPE_TITLES[notification.type] || "إشعار جديد",
            body: notification.body,
            orderId: notification.data?.orderId,
            receivedAt: Date.now(),
            read: false,
          },
          ...current,
        ].slice(0, MAX_HISTORY)
      );

      if (notification.type === "order.created" || notification.type === "ORDER_CREATED") {
        playOrderChime();

        toast.info(notification.title || "طلب حجز جديد", {
          description: notification.body || "لديك طلب خدمة جديد يحتاج لموافقتك",
          duration: 10000,
        });

        setActiveNotification(notification);
        setIsDeclining(false);
        setDeclineReason("");
      }
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [invalidateOrderData, socket]);

  const handleAccept = async () => {
    if (!orderData?._id) return;
    setIsPendingAction(true);
    try {
      await updateBookingStatus(orderData._id, "accepted");
      toast.success("تم قبول الطلب بنجاح");
      invalidateOrderData();
      closeNotification();
    } catch {
      toast.error("فشل قبول الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setIsPendingAction(false);
    }
  };

  const handleDecline = async () => {
    if (!orderData?._id) return;

    if (!isDeclining) {
      setIsDeclining(true);
      return;
    }

    const reason = declineReason.trim();
    if (reason.length < 5) {
      toast.error("يرجى كتابة سبب واضح لرفض الطلب");
      return;
    }

    setIsPendingAction(true);
    try {
      await cancelBooking(orderData._id, reason);
      toast.info("تم رفض الطلب وتسجيل السبب");
      invalidateOrderData();
      closeNotification();
    } catch {
      toast.error("فشل رفض الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setIsPendingAction(false);
    }
  };

  const closeNotification = () => {
    setActiveNotification(null);
    setIsDeclining(false);
    setDeclineReason("");
  };

  const loadingOrder = orderQuery.isFetching;

  const markAllRead = useCallback(
    () => setNotifications((current) => current.map((item) => ({ ...item, read: true }))),
    []
  );
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const unreadCount = notifications.reduce((total, item) => total + (item.read ? 0 : 1), 0);

  const contextValue = useMemo(
    () => ({
      activeNotification,
      closeNotification,
      notifications,
      unreadCount,
      markAllRead,
      clearNotifications,
      isConnected,
    }),
    [activeNotification, notifications, unreadCount, markAllRead, clearNotifications, isConnected]
  );

  return (
    <RealTimeNotificationContext.Provider value={contextValue}>
      {children}

      <Dialog open={!!activeNotification} onOpenChange={(open) => !open && closeNotification()}>
        <DialogContent className="max-w-md" showCloseButton={!isPendingAction}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" aria-hidden />
              طلب حجز جديد
            </DialogTitle>
            <DialogDescription>
              يحتاج هذا الطلب قبولك أو رفضك الآن.
            </DialogDescription>
          </DialogHeader>

          {loadingOrder ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs text-muted-foreground">جاري تحميل تفاصيل الطلب...</span>
            </div>
          ) : orderData ? (
            <OrderDetails order={orderData} />
          ) : (
            <div className="py-6 text-center text-xs text-danger-soft" role="alert">
              تعذّر تحميل تفاصيل الطلب. راجع قائمة الطلبات مباشرةً.
            </div>
          )}

          {isDeclining && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground">سبب الرفض</label>
              <Textarea
                value={declineReason}
                onChange={(event) => setDeclineReason(event.target.value)}
                placeholder="مثال: المزود غير متاح لهذا الموعد"
                rows={3}
                disabled={isPendingAction}
              />
            </div>
          )}

          <DialogFooter>
            {isDeclining ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPendingAction}
                onClick={() => {
                  setIsDeclining(false);
                  setDeclineReason("");
                }}
                className="flex-1"
              >
                تراجع
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive-soft"
                disabled={loadingOrder || isPendingAction || !orderData}
                onClick={handleDecline}
                className="flex-1"
              >
                <X aria-hidden /> رفض الطلب
              </Button>
            )}

            {isDeclining ? (
              <Button
                type="button"
                variant="destructive"
                loading={isPendingAction}
                disabled={loadingOrder || !orderData || declineReason.trim().length < 5}
                onClick={handleDecline}
                className="flex-1"
              >
                تأكيد الرفض
              </Button>
            ) : (
              <Button
                type="button"
                loading={isPendingAction}
                disabled={loadingOrder || !orderData}
                onClick={handleAccept}
                className="flex-1"
              >
                {!isPendingAction && <Check aria-hidden />} قبول الطلب
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RealTimeNotificationContext.Provider>
  );
}

function OrderDetails({ order }: { order: Booking }) {
  const amount = order.payableAmount ?? order.total ?? 0;

  return (
    <div className="space-y-3">
      {/* كان هذا القسم يقلب ترتيب كل صفّ يدوياً (`justify-end` + الأيقونة بعد
          النص) لمحاكاة RTL. المستند عربي الاتجاه أصلاً، فالترتيب الطبيعي يكفي. */}
      <dl className="space-y-2.5 rounded-xl border bg-secondary/30 p-4 text-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <dt className="text-muted-foreground">رقم الطلب</dt>
          <dd className="font-mono text-foreground" dir="ltr">{order.orderNumber}</dd>
        </div>

        <div className="flex items-center gap-2 text-foreground">
          <Clock className="size-3.5 shrink-0 text-primary" aria-hidden />
          <dt className="sr-only">الخدمة</dt>
          <dd className="font-semibold">{order.service?.name || "خدمة سيارات"}</dd>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">العميل</dt>
          <dd>{order.user?.fullName || "عميل غير معروف"}</dd>
        </div>

        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">الموقع</dt>
          <dd className="truncate">{order.address || "موقع محدّد مسبقاً"}</dd>
        </div>

        {order.userNotes && (
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 p-2.5 text-muted-foreground">
            <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">ملاحظات العميل</dt>
            <dd className="flex-1 leading-relaxed">{order.userNotes}</dd>
          </div>
        )}
      </dl>

      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <DollarSign className="size-3.5" aria-hidden /> المبلغ الإجمالي
        </span>
        <Money value={amount} className="text-lg font-bold text-primary" />
      </div>
    </div>
  );
}

function playOrderChime() {
  try {
    const soundEnabled = localStorage.getItem("provider_order_sound_enabled") !== "false";
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!soundEnabled || !AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    playTone(audioCtx, 880, 0.45, 0);
    playTone(audioCtx, 698.46, 0.6, 180);
  } catch {
    // Audio is best-effort and should never block order handling.
  }
}

function playTone(audioCtx: AudioContext, freq: number, duration: number, delay: number) {
  window.setTimeout(() => {
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration - 0.02);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Ignore browser-level audio interruptions.
    }
  }, delay);
}

export const useRealTimeNotification = () => {
  const ctx = useContext(RealTimeNotificationContext);
  if (!ctx) throw new Error("useRealTimeNotification must be used within RealTimeNotificationProvider");
  return ctx;
};

