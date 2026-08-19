"use client";

import { BadgeCheck, Clock } from "lucide-react";

interface OverviewHeaderProps {
  businessName: string;
  ownerName: string;
  isApproved: boolean;
}

/**
 * سطر ترحيب وحالة اعتماد — بلا `<h1>`.
 * عنوان الصفحة يملكه الهيدر وحده الآن، فما بقي هنا هو ما لا يعرفه الهيدر:
 * اسم النشاط وحالة اعتماده.
 */
export function OverviewHeader({ businessName, ownerName, isApproved }: OverviewHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        مرحباً،{" "}
        <span className="font-semibold text-foreground">
          {businessName || ownerName || "مزوّد الخدمة"}
        </span>
      </p>

      <span
        className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold sm:self-center ${
          isApproved
            ? "border-success/25 bg-success/10 text-success-soft"
            : "border-warning/25 bg-warning/10 text-warning-soft"
        }`}
      >
        {isApproved ? <BadgeCheck className="size-4" aria-hidden /> : <Clock className="size-4" aria-hidden />}
        {isApproved ? "حساب معتمد ومفعّل" : "طلب قيد الدراسة"}
      </span>
    </div>
  );
}
