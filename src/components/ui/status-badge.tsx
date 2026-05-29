"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  // Orders / Bookings
  pending:    { label: "قيد الانتظار", className: "badge-warning" },
  accepted:   { label: "مقبول",        className: "badge-info" },
  active:     { label: "نشط",          className: "badge-info" },
  in_progress:{ label: "جاري التنفيذ", className: "badge-info" },
  completed:  { label: "مكتمل",        className: "badge-success" },
  cancelled:  { label: "ملغي",         className: "badge-danger" },
  rejected:   { label: "مرفوض",        className: "badge-danger" },
  // Providers
  approved:   { label: "معتمد",        className: "badge-success" },
  offline:    { label: "غير متصل",     className: "badge-neutral" },
  online:     { label: "متصل",         className: "badge-success" },
  busy:       { label: "مشغول",        className: "badge-warning" },
  // Payments
  paid:       { label: "مدفوع",        className: "badge-success" },
  unpaid:     { label: "غير مدفوع",    className: "badge-warning" },
  refunded:   { label: "مسترد",        className: "badge-info" },
  // Users
  true:       { label: "نشط",          className: "badge-success" },
  false:      { label: "محظور",        className: "badge-danger" },
  // Subscriptions
  expired:    { label: "منتهي",        className: "badge-danger" },
  // Transactions
  credit:     { label: "إيداع",        className: "badge-success" },
  debit:      { label: "سحب",          className: "badge-danger" },
};

interface StatusBadgeProps {
  status: string | boolean;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = String(status).toLowerCase();
  const config = statusMap[key] || { label: key, className: "badge-neutral" };
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md border", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
