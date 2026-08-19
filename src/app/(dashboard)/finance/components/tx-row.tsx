"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Transaction } from "@/domain/entities/wallet.types";
import { Badge } from "@/components/ui/badge";
import { Money, RelativeTime } from "@/components/ui/money";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<string, string> = {
  order: "أرباح طلب",
  payout: "طلب سحب",
  withdrawal: "سحب رصيد",
  payout_reversal: "إعادة مبلغ سحب",
  topup: "إيداع رصيد",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  completed: { label: "مكتمل", variant: "success" },
  pending: { label: "قيد المراجعة", variant: "warning" },
  failed: { label: "مرفوض", variant: "danger" },
  reversed: { label: "معكوس", variant: "neutral" },
};

export function TxRow({ tx, currency }: { tx: Transaction; currency?: string }) {
  const isCredit = tx.type === "credit";
  const status = STATUS_CONFIG[tx.status] ?? { label: tx.status, variant: "neutral" as const };

  return (
    <div className="grid gap-3 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            isCredit
              ? "border-success/20 bg-success/10 text-success-soft"
              : "border-danger/20 bg-danger/10 text-danger-soft"
          )}
          aria-hidden
        >
          {isCredit ? <ArrowDownRight className="size-5" /> : <ArrowUpRight className="size-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {KIND_LABELS[tx.referenceType ?? ""] || (isCredit ? "إضافة رصيد" : "خصم رصيد")}
          </p>
          <p className="truncate text-xs text-muted-foreground">{tx.description}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground" dir="ltr">
            {tx.transactionNumber}
          </p>
        </div>
      </div>

      <RelativeTime value={tx.createdAt} className="text-xs text-muted-foreground" />

      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-1.5">
        <Money
          value={isCredit ? Math.abs(tx.amount ?? 0) : -Math.abs(tx.amount ?? 0)}
          currency={currency}
          signed
          className={cn(
            "text-base font-bold",
            isCredit ? "text-success-soft" : "text-danger-soft"
          )}
        />
        <Badge variant={status.variant} className="h-6 rounded-full border px-2.5">
          {status.label}
        </Badge>
      </div>
    </div>
  );
}
