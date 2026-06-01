"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Transaction } from "@/domain/entities/wallet.types";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<string, string> = {
  order: "أرباح طلب",
  payout: "طلب سحب",
  withdrawal: "سحب رصيد",
  payout_reversal: "إعادة مبلغ سحب",
  topup: "إيداع رصيد",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "مكتمل",
  pending: "قيد المراجعة",
  failed: "مرفوض",
  reversed: "معكوس",
};

export function TxRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const isCredit = tx.type === "credit";
  return (
    <div className="grid gap-3 px-5 py-4 transition-colors hover:bg-secondary/25 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("size-9 rounded-lg border flex items-center justify-center shrink-0", isCredit ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400")}>
          {isCredit ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{KIND_LABELS[tx.referenceType ?? ""] || (isCredit ? "إضافة رصيد" : "خصم رصيد")}</p>
          <p className="truncate text-[11px] text-muted-foreground/70">{tx.description}</p>
          <p className="mt-1 text-[10px] font-mono text-muted-foreground/50" dir="ltr">{tx.transactionNumber}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>
        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true, locale: ar })}
      </p>
      <div className="text-left">
        <p className={cn("font-black tabular-nums", isCredit ? "text-emerald-400" : "text-rose-400")}>
          {isCredit ? "+" : "-"}{(tx.amount || 0).toLocaleString("ar-SY", { maximumFractionDigits: 2 })} {currency}
        </p>
        <span className={cn("inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", tx.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : tx.status === "pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-rose-500/10 border-rose-500/20 text-rose-400")}>
          {STATUS_LABELS[tx.status] || tx.status}
        </span>
      </div>
    </div>
  );
}
