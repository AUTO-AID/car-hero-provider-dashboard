"use client";

import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { Transaction } from "@/domain/entities/wallet.types";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * مصدر الحركة — لا «أرباح طلب».
 *
 * كان العنوان الأبرز في الصفّ هو «أرباح طلب»، وهو يكرّر على كل سطر ما تقوله
 * الصفحة كلّها: السجلّ أرباح. فيسرق أعرض خطّ في الصفّ من الرقم الذي يفتح
 * المزوّد الصفحة لأجله. العنوان الآن سطر ثانوي يقول **من أين** جاء المبلغ،
 * والرقم هو البطل.
 */
const SOURCE_LABELS: Record<string, string> = {
  order: "من طلب مكتمل",
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
  const source = SOURCE_LABELS[tx.referenceType ?? ""] ?? (isCredit ? "إضافة إلى رصيدك" : "خصم من رصيدك");

  return (
    <li
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-border/60 bg-card p-4 transition-colors",
        "hover:border-border sm:gap-4 sm:p-5"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl border",
          isCredit
            ? "border-success/25 bg-success/10 text-success-soft"
            : "border-danger/25 bg-danger/10 text-danger-soft"
        )}
      >
        <Icon className="size-6" />
      </span>

      {/* المبلغ أوّلاً وبأكبر خطّ في الصفّ: هو السؤال الوحيد الذي يُطرح على
          هذا السطر — «كم ربحت من هذا الطلب؟» */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Money
          value={isCredit ? amount : -amount}
          currency={currency}
          signed={!isCredit}
          className={cn(
            "text-2xl leading-none font-bold",
            isCredit ? "text-success-soft" : "text-danger-soft"
          )}
        />
        <span className="truncate text-sm font-semibold text-muted-foreground">{source}</span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 text-end">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatTime(tx.createdAt)}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground/70" dir="ltr">
          {tx.transactionNumber}
        </span>
        {attention && (
          <Badge variant={attention.variant} className="h-6 rounded-full border px-2.5 font-semibold">
            {attention.label}
          </Badge>
        )}
      </div>
    </li>
  );
}
