"use client";

import { Popover } from "@base-ui/react/popover";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { formatRelative } from "@/lib/format";
import { useRealTimeNotification } from "@/components/providers/notification-alert-provider";
import { useClientReady } from "@/application/hooks/use-client-ready";
import { formatNumber } from "@/lib/format";

/**
 * مركز الإشعارات.
 *
 * كان الجرس زرّاً بلا سلوك، وعدّاده ثابت على الصفر خلف تعليق
 * `// TODO: Connect to real-time notification store` — بينما كانت أحداث السوكِت
 * تصل فعلاً وتُعرض في toast يختفي بعد عشر ثوانٍ ولا يترك أثراً.
 */
export function NotificationsMenu() {
  const { notifications, unreadCount, markAllRead, clearNotifications } = useRealTimeNotification();
  const mounted = useClientReady();

  const label = unreadCount > 0 ? `الإشعارات (${formatNumber(unreadCount)} غير مقروء)` : "الإشعارات";

  return (
    <Popover.Root onOpenChange={(open) => { if (open && unreadCount > 0) markAllRead(); }}>
      <Popover.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label={label} title={label} className="relative" />
        }
      >
        <Bell aria-hidden />
        {mounted && unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
            aria-hidden
          >
            {formatNumber(unreadCount)}
          </span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="z-[var(--z-overlay)]">
          <Popover.Popup className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-elev-3 outline-none">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <h2 className="text-sm font-bold">الإشعارات</h2>
              {notifications.length > 0 && (
                <Button variant="ghost" size="xs" onClick={clearNotifications} className="text-muted-foreground">
                  <CheckCheck aria-hidden /> مسح الكل
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <EmptyState
                compact
                icon={BellOff}
                title="لا توجد إشعارات"
                description="ستظهر هنا الطلبات الجديدة وتحديثات الحالة فور وصولها."
              />
            ) : (
              <ul className="max-h-[22rem] divide-y divide-border/60 overflow-y-auto">
                {notifications.map((item) => (
                  <li key={item.id}>
                    <Link
                      href="/orders"
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? "bg-border" : "bg-primary"}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                        {item.body && (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.body}</span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted-foreground" suppressHydrationWarning>
                          {mounted ? formatRelative(item.receivedAt) : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
