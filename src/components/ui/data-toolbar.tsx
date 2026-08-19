"use client";

import * as React from "react";
import { FilterX, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";

export interface ActiveFilterChip {
  key: string;
  /** ما يظهر للمستخدم: "الحالة: مكتمل" */
  label: string;
  onRemove: () => void;
}

interface DataToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  /** عناصر الفلترة (قوائم منسدلة، حقول تاريخ) */
  children?: React.ReactNode;
  chips?: ActiveFilterChip[];
  onReset?: () => void;
  resultCount?: number;
  className?: string;
}

/**
 * شريط أدوات الجداول: بحث + فلاتر + **رقائق الفلاتر النشطة**.
 *
 * الرقائق هي الإضافة الجوهرية: سابقاً كان بإمكان المزوّد أن يترك فلتر تاريخ
 * أو حالة دفع مفعّلاً دون أن يراه، فيظنّ أن الطلبات اختفت. الآن كل فلتر
 * فعّال يظهر كرقاقة قابلة للإزالة بنقرة واحدة.
 */
export function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "ابحث…",
  searchLabel = "بحث",
  children,
  chips = [],
  onReset,
  resultCount,
  className,
}: DataToolbarProps) {
  const hasChips = chips.length > 0;

  return (
    <Card className={cn("gap-4 p-4 sm:p-5", className)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <div className="relative col-span-2">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            className="ps-10"
          />
        </div>
        {children}
      </div>

      {(hasChips || typeof resultCount === "number") && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          {typeof resultCount === "number" && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {formatNumber(resultCount)} نتيجة
            </span>
          )}

          {hasChips && (
            <>
              <span className="h-4 w-px bg-border" aria-hidden />
              <ul className="flex flex-wrap items-center gap-1.5">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      className="group inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 py-1.5 ps-3 pe-2 text-xs font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/20"
                    >
                      {chip.label}
                      <X className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
                      <span className="sr-only">إزالة الفلتر</span>
                    </button>
                  </li>
                ))}
              </ul>

              {onReset && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="ms-auto text-muted-foreground"
                >
                  <FilterX aria-hidden /> مسح الكل
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
