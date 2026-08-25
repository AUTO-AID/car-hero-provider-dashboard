"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { providerQueryKeys } from "@/application/services/prefetch";
import { useSocket } from "@/application/hooks/use-socket";

interface OrderNotification {
  type: string;
  title?: string;
  body?: string;
  data?: {
    orderId?: string;
    event?: string;
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
  "order.cancelled": "أُلغي طلب",
  order_cancelled: "أُلغي طلب",
  "order.updated": "تحديث على طلب",
  order_updated: "تحديث على طلب",
};

/**
 * عروض الطلبات الجديدة **لا تظهر في اللوحة**.
 *
 * العرض سباقٌ بنافذة خمس عشرة ثانية، ومكانه الوحيد هو تطبيق الفنّي: هو من
 * يوقظ الهاتف المُقفَل، ويعرف موقع الفنّي، ويرافقه إلى مكان العطل. تكرار
 * العرض هنا كان يفتح باباً ثانياً للسباق نفسه — فنّي أمام حاسوبه يقبل طلباً
 * لا يستطيع الوصول إليه، أو نافذة تفتح على شاشة لا أحد أمامها فتنقضي المهلة
 * بلا ردّ ويخسر الطلب دوره.
 *
 * اللوحة تبقى **مرآةً للعمل** لا قناةَ إسناد: تُحدَّث قوائمها بصمت عند وصول
 * العرض، ولا تُصدر صوتاً ولا نافذة ولا سطراً في جرس الإشعارات.
 */
function isNewRequestOffer(notification: OrderNotification): boolean {
  const event = notification.data?.event;
  if (event === "provider_app.new_request" || event === "order.created") return true;

  // نوع الإشعار يصل بصيغ متعدّدة عبر تاريخ المشروع؛ الترشيح يغطّيها كلّها
  // لأن تسرّب واحدة منها يُعيد النافذة التي أُلغيت.
  const type = (notification.type || "").toLowerCase().replace(/\./g, "_");
  return type === "order_created";
}

const RealTimeNotificationContext = createContext<RealTimeNotificationContextType | null>(null);

export function RealTimeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

  const invalidateOrderData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingsRoot });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.dashboardAllStats });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.wallet });
  }, [queryClient]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: OrderNotification) => {
      // التحديث الصامت يسبق الترشيح: بقاء القوائم حديثة ليس إشعاراً، وهو
      // مطلوب حتى للأحداث التي لا نُظهرها.
      invalidateOrderData();

      if (isNewRequestOffer(notification)) return;

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
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [invalidateOrderData, socket]);

  const markAllRead = useCallback(
    () => setNotifications((current) => current.map((item) => ({ ...item, read: true }))),
    []
  );
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const unreadCount = notifications.reduce((total, item) => total + (item.read ? 0 : 1), 0);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      clearNotifications,
      isConnected,
    }),
    [notifications, unreadCount, markAllRead, clearNotifications, isConnected]
  );

  return (
    <RealTimeNotificationContext.Provider value={contextValue}>
      {children}
    </RealTimeNotificationContext.Provider>
  );
}

export const useRealTimeNotification = () => {
  const ctx = useContext(RealTimeNotificationContext);
  if (!ctx) throw new Error("useRealTimeNotification must be used within RealTimeNotificationProvider");
  return ctx;
};
