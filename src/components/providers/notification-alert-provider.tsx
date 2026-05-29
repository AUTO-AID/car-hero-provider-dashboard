"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "@/application/hooks/use-socket";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/infrastructure/api/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, User, DollarSign, Clock, FileText, Check, X } from "lucide-react";

interface RealTimeNotificationContextType {
  activeNotification: any | null;
  closeNotification: () => void;
}

const RealTimeNotificationContext = createContext<RealTimeNotificationContextType | null>(null);

export function RealTimeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isPendingAction, setIsPendingAction] = useState(false);

  useEffect(() => {
    if (!socket) return;

    console.log("[Notifications] Listening for notifications on socket...");

    // Listen to real-time notifications
    socket.on("notification", (notification: any) => {
      console.log("[Notifications] Received real-time notification:", notification);
      
      if (notification.type === "order.created" || notification.type === "ORDER_CREATED") {
        // Trigger notification sound via Web Audio API (offline friendly)
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const playTone = (freq: number, duration: number, delay: number) => {
              setTimeout(() => {
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
                } catch (e) {
                  console.warn("[Notifications] Audio context play error:", e);
                }
              }, delay);
            };
            // Dual-tone high-quality chime sequence
            playTone(880, 0.45, 0);     // A5 note
            playTone(698.46, 0.6, 180); // F5 note
          }
        } catch (soundErr) {
          console.error("[Notifications] Audio synthesized chime error:", soundErr);
        }

        // Display toast alert
        toast.info(notification.title || "طلب حجز جديد 📦", {
          description: notification.body || "لديك طلب خدمة جديد يحتاج لموافقتك",
          duration: 10000,
        });

        // Set active notification to show modal
        setActiveNotification(notification);
      }
    });

    return () => {
      socket.off("notification");
    };
  }, [socket]);

  // Fetch full order details when a notification arrives
  useEffect(() => {
    if (activeNotification?.data?.orderId) {
      setLoadingOrder(true);
      setOrderData(null);
      
      api.get(`/orders/${activeNotification.data.orderId}`)
        .then((res) => {
          const fetched = res.data?.data ?? res.data;
          setOrderData(fetched);
        })
        .catch((err) => {
          console.error("[Notifications] Failed to fetch order details:", err);
          toast.error("فشل جلب تفاصيل الطلب الوارد");
        })
        .finally(() => {
          setLoadingOrder(false);
        });
    } else {
      setOrderData(null);
    }
  }, [activeNotification]);

  const handleAccept = async () => {
    if (!orderData?._id) return;
    setIsPendingAction(true);
    try {
      await api.patch(`/orders/${orderData._id}/status`, { status: "accepted" });
      toast.success("✅ تم قبول الطلب بنجاح");
      
      // Invalidate React Query lists to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-dashboard"] });
      
      closeNotification();
    } catch (err) {
      console.error(err);
      toast.error("فشل قبول الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setIsPendingAction(false);
    }
  };

  const handleDecline = async () => {
    if (!orderData?._id) return;
    setIsPendingAction(true);
    try {
      // Transitioning status to cancelled
      await api.patch(`/orders/${orderData._id}/status`, { status: "cancelled" });
      toast.info("تم رفض الطلب وإلغاؤه");
      
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-dashboard"] });
      
      closeNotification();
    } catch (err) {
      console.error(err);
      toast.error("فشل رفض الطلب");
    } finally {
      setIsPendingAction(false);
    }
  };

  const closeNotification = () => {
    setActiveNotification(null);
    setOrderData(null);
  };

  return (
    <RealTimeNotificationContext.Provider value={{ activeNotification, closeNotification }}>
      {children}

      {/* Sleek Dark-themed Real-time Order Popup Modal */}
      <Dialog open={!!activeNotification} onOpenChange={(open) => !open && closeNotification()}>
        <DialogContent className="bg-card/95 border-border/50 rounded-2xl max-w-md backdrop-blur-xl text-right" showCloseButton={!isPendingAction}>
          <DialogHeader className="text-right">
            <DialogTitle className="text-white text-base font-bold flex items-center gap-2 justify-end">
              <span>طلب حجز جديد وارد!</span>
              <Bell className="w-5 h-5 text-primary animate-bounce" />
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              لديك طلب خدمة جديد يحتاج لموافقتك أو رفضك الفوري
            </DialogDescription>
          </DialogHeader>

          {loadingOrder ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs text-muted-foreground">جاري تحميل تفاصيل الطلب...</span>
            </div>
          ) : orderData ? (
            <div className="space-y-4 py-2">
              {/* Order Details Grid */}
              <div className="bg-secondary/20 p-4 rounded-xl border border-border/30 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                  <span className="font-bold text-white tabular-nums">{orderData.orderNumber}</span>
                  <span className="text-muted-foreground">رقم الطلب</span>
                </div>

                <div className="space-y-2.5 text-xs text-right">
                  <div className="flex items-center gap-2 justify-end text-foreground font-semibold">
                    <span className="text-white">{orderData.serviceName || "خدمة سيارات"}</span>
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </div>

                  <div className="flex items-center gap-2 justify-end text-muted-foreground">
                    <span>{orderData.user?.fullName || "عميل غير معروف"}</span>
                    <User className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>

                  <div className="flex items-center gap-2 justify-end text-muted-foreground">
                    <span className="truncate max-w-[280px]" dir="rtl">
                      {orderData.address || "موقع محدد مسبقاً"}
                    </span>
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>

                  {orderData.userNotes && (
                    <div className="flex items-start gap-2 justify-end text-muted-foreground bg-black/10 p-2.5 rounded-lg border border-border/10">
                      <span className="text-[11px] leading-relaxed text-right flex-1">{orderData.userNotes}</span>
                      <FileText className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                    </div>
                  )}
                </div>
              </div>

              {/* Price Tag */}
              <div className="flex items-center justify-between bg-primary/5 p-3.5 rounded-xl border border-primary/20">
                <span className="text-lg font-black text-primary tabular-nums">
                  {(orderData.servicePrice || orderData.total || 0).toLocaleString()} ل.س
                </span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  المبلغ الإجمالي
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground/60" />
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-rose-400">
              فشل تحميل تفاصيل الطلب، يرجى المحاولة مرة أخرى أو مراجعة قائمة الطلبات.
            </div>
          )}

          <DialogFooter className="flex flex-row-reverse gap-2.5 mt-2 justify-start">
            <Button
              disabled={loadingOrder || isPendingAction || !orderData}
              onClick={handleAccept}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 rounded-xl gap-1.5 shadow-md shadow-emerald-500/10"
            >
              <Check className="w-4 h-4" />
              قبول الطلب
            </Button>
            <Button
              variant="outline"
              disabled={loadingOrder || isPendingAction || !orderData}
              onClick={handleDecline}
              className="flex-1 border-rose-500/20 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-bold h-9 rounded-xl gap-1.5"
            >
              <X className="w-4 h-4" />
              رفض الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RealTimeNotificationContext.Provider>
  );
}

export const useRealTimeNotification = () => {
  const ctx = useContext(RealTimeNotificationContext);
  if (!ctx) throw new Error("useRealTimeNotification must be used within RealTimeNotificationProvider");
  return ctx;
};
