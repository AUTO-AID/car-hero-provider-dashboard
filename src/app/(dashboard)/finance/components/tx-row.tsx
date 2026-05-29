"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Transaction } from "@/domain/entities/wallet.types";

const isCredit = (type: string) => type === "deposit" || type === "earning";

const TX_LABEL: Record<string, string> = {
  earning: "أرباح طلب",
  deposit: "إيداع رصيد",
  withdrawal: "سحب رصيد",
};

interface TxRowProps {
  tx: Transaction;
}

export function TxRow({ tx }: TxRowProps) {
  const credit = isCredit(tx.type);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors group">
      {/* Icon + label */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
            credit
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          )}
        >
          {credit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">
            {TX_LABEL[tx.type] ?? "عملية مالية"}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {mounted
              ? formatDistanceToNow(new Date(tx.createdAt), {
                  addSuffix: true,
                  locale: ar,
                })
              : "..."}
          </p>
        </div>
      </div>

      {/* Amount + status */}
      <div className="text-end">
        <p
          className={cn(
            "font-black tabular-nums text-base",
            credit ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {credit ? "+" : "−"}
          {(tx.amount || 0).toLocaleString()} ل.س
        </p>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block",
            tx.status === "completed"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          )}
        >
          {tx.status === "completed" ? "مكتمل" : "معلّق"}
        </span>
      </div>
    </div>
  );
}
