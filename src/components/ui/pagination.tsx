"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

interface PaginationProps {
  page: number;
  pages: number;
  total?: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** يُعطَّل التنقّل أثناء جلب صفحة جديدة */
  disabled?: boolean;
}

/** يبني قائمة الصفحات مع اختصار "…" بحيث لا يتجاوز العرض سبعة أزرار. */
function pageWindow(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", pages];
  if (page >= pages - 3) return [1, "gap", pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, "gap", page - 1, page, page + 1, "gap", pages];
}

/**
 * ترقيم صفحات كامل بأرقام قابلة للنقر.
 *
 * كان الموجود زرَّي "السابق/التالي" فقط، مكرّرين حرفياً في الطلبات والمالية:
 * للوصول إلى الصفحة العاشرة كان على المزوّد النقر تسع مرات.
 * ملاحظة اتجاه: في RTL يشير "السابق" إلى اليمين و"التالي" إلى اليسار.
 */
export function Pagination({ page, pages, total, onPageChange, className, disabled }: PaginationProps) {
  const lastPage = Math.max(pages, 1);
  if (lastPage <= 1 && !total) return null;

  return (
    <nav
      aria-label="تنقّل بين الصفحات"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <p className="text-xs text-muted-foreground">
        صفحة {formatNumber(page)} من {formatNumber(lastPage)}
        {typeof total === "number" && <> · {formatNumber(total)} نتيجة</>}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight aria-hidden /> السابق
        </Button>

        <ul className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, lastPage).map((entry, index) =>
            entry === "gap" ? (
              <li key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden>
                …
              </li>
            ) : (
              <li key={entry}>
                <Button
                  type="button"
                  variant={entry === page ? "default" : "ghost"}
                  size="icon-sm"
                  aria-label={`الصفحة ${formatNumber(entry)}`}
                  aria-current={entry === page ? "page" : undefined}
                  disabled={disabled}
                  onClick={() => onPageChange(entry)}
                  className="tabular-nums"
                >
                  {formatNumber(entry)}
                </Button>
              </li>
            )
          )}
        </ul>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          التالي <ChevronLeft aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
