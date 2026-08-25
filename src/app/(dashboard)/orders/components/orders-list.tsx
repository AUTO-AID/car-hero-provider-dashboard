"use client";

import { useMemo } from "react";
import type { Booking, DateLike } from "@/domain/entities/booking.types";
import { formatDate, formatNumber } from "@/lib/format";
import { OrderRow } from "./order-row";

interface OrdersListProps {
  orders: Booking[];
  onOpen: (orderId: string) => void;
  /** يُطفأ حين يكون الفرز بالمبلغ: عناوين أيام فوق قائمة غير مرتّبة زمنياً كذبة بصرية */
  groupByDay: boolean;
  useScheduledDate: boolean;
}

function startOfDay(value: DateLike) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

/** «اليوم» و«أمس» و«غداً» تُقرأ أسرع من تاريخ كامل، والباقي يحتاج اسم يومه. */
function dayHeading(day: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return { title: "اليوم", subtitle: formatDate(day, "medium") };
  if (diffDays === -1) return { title: "أمس", subtitle: formatDate(day, "medium") };
  if (diffDays === 1) return { title: "غداً", subtitle: formatDate(day, "medium") };
  return { title: formatDate(day, "weekday"), subtitle: undefined };
}

export function OrdersList({ orders, onOpen, groupByDay, useScheduledDate }: OrdersListProps) {
  const sections = useMemo(() => {
    if (!groupByDay) return null;

    const buckets = new Map<number, { day: Date; orders: Booking[] }>();
    for (const order of orders) {
      const stamp = useScheduledDate && order.scheduledAt ? order.scheduledAt : order.createdAt;
      const day = startOfDay(stamp);
      // طلب بتاريخ تالف لا يُسقَط من القائمة: يُجمَع تحت يوم إنشائه بدل أن
      // يختفي بصمت — الاختفاء الصامت هو أسوأ ما قد تفعله شاشة سجلّ.
      const key = (day ?? startOfDay(order.createdAt) ?? new Date(0)).getTime();
      const bucket = buckets.get(key);
      if (bucket) bucket.orders.push(order);
      else buckets.set(key, { day: new Date(key), orders: [order] });
    }
    return [...buckets.values()];
  }, [groupByDay, orders, useScheduledDate]);

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
                {formatNumber(section.orders.length)} طلب
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {section.orders.map((order) => (
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
