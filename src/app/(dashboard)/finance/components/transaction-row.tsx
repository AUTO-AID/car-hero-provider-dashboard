"use client";

import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { Transaction } from "@/domain/entities/wallet.types";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** عناوين عربية للحركة. الوصف الخام من الخادم إنجليزي ولا يُعرض. */
const KIND_LABELS: Record<string, string> = {
  order: "أرباح طلب",
  payout: "سحب إلى حسابك",
  withdrawal: "سحب رصيد",
  payout_reversal: "إرجاع مبلغ سحب",
  topup: "إيداع رصيد",
};

/**
 * الحالات التي **تستدعي انتباهاً**. «مكتمل» هو الحال الطبيعي لكل سطر تقريباً،
 * وشارةٌ خضراء على كل صفّ تصنع ضجيجاً يُخفي السطر الوحيد المعلّق بينها.
 */
const ATTENTION_STATUS: Record<string, { label: string; variant: "warning" | "danger" | "neutral" }> = {
  pending: { label: "قيد المراجعة", variant: "warning" },
  failed: { label: "مرفوض", variant: "danger" },
  reversed: { label: "معكوس", variant: "neutral" },
};

export function TransactionRow({ tx, currency }: { tx: Transaction; currency?: string }) {
  const isCredit = tx.type === "credit";
  const amount = Math.abs(tx.amount ?? 0);
  const attention = ATTENTION_STATUS[tx.status];
  const Icon: LucideIcon = isCredit ? ArrowDownLeft : ArrowUpRight;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 sm:gap-4 sm:p-4">
      <span
        aria-hidden
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl border",
          isCredit
            ? "border-success/25 bg-success/10 text-success-soft"
            : "border-danger/25 bg-danger/10 text-danger-soft"
        )}
      >
        <Icon className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[0.95rem] font-bold text-foreground">
          {KIND_LABELS[tx.referenceType ?? ""] ?? (isCredit ? "إضافة رصيد" : "خصم رصيد")}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="tabular-nums">{formatTime(tx.createdAt)}</span>
          <span aria-hidden>·</span>
          <span className="truncate font-mono text-[11px]" dir="ltr">
            {tx.transactionNumber}
          </span>
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Money
          value={isCredit ? amount : -amount}
          currency={currency}
          signed
          className={cn("text-sm font-bold", isCredit ? "text-success-soft" : "text-danger-soft")}
        />
        {attention && (
          <Badge variant={attention.variant} className="h-6 rounded-full border px-2.5 font-semibold">
            {attention.label}
          </Badge>
        )}
      </div>
    </li>
  );
}
