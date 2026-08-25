"use client";

import { useMemo } from "react";
import type { Booking } from "@/domain/entities/booking.types";
import { dayHeading, groupByDay } from "@/lib/day-groups";
import { formatNumber } from "@/lib/format";
import { OrderRow } from "./order-row";

interface OrdersListProps {
  orders: Booking[];
  onOpen: (orderId: string) => void;
  /** يُطفأ حين يكون الفرز بالمبلغ: عناوين أيام فوق قائمة غير مرتّبة زمنياً كذبة بصرية */
  groupByDay: boolean;
  useScheduledDate: boolean;
}

export function OrdersList({
  orders,
  onOpen,
  groupByDay: shouldGroup,
  useScheduledDate,
}: OrdersListProps) {
  const sections = useMemo(() => {
    if (!shouldGroup) return null;
    return groupByDay(orders, (order) =>
      useScheduledDate && order.scheduledAt ? order.scheduledAt : order.createdAt
    );
  }, [orders, shouldGroup, useScheduledDate]);

  if (!sections) {
    return (
      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <OrderRow
            key={order._id}
            order={order}
            onOpen={() => onOpen(order._id)}
            showFullDate
            useScheduledDate={useScheduledDate}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => {
        const heading = dayHeading(section.day);
        return (
          <section key={section.day.getTime()} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2 px-1">
              <h2 className="text-sm font-bold text-foreground">{heading.title}</h2>
              {heading.subtitle && (
                <span className="text-xs text-muted-foreground">{heading.subtitle}</span>
              )}
              <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                {formatNumber(section.items.length)} طلب
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {section.items.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  onOpen={() => onOpen(order._id)}
                  useScheduledDate={useScheduledDate}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
