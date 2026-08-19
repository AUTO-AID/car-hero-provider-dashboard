"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** التسمية المرئية غائبة في أشرطة الفلاتر، فهذه إلزامية عملياً لقارئ الشاشة */
  "aria-label"?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
}

/**
 * قائمة منسدلة موحّدة تستبدل `<select>` الأصلية في أشرطة الفلاتر.
 *
 * العنصر الأصلي كان يرسم قائمة خياراته بمحرّك النظام: لا يقبل خطّ الواجهة،
 * ولا حالة تحديد مرئية، ولا ارتفاع صفّ مناسب للعربية — وكان يحتاج فئة
 * `.dark-input` بـ `!important` لمجرد أن يبدو داكناً.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "اختر…",
  id,
  name,
  disabled,
  className,
  size = "default",
  ...props
}: SelectProps) {
  const items = React.useMemo(
    () => options.map((option) => ({ value: option.value, label: option.label })),
    [options]
  );

  return (
    <SelectPrimitive.Root
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(String(next ?? ""))}
      name={name}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={props["aria-label"]}
        className={cn(
          "relative flex w-full items-center justify-between gap-2 rounded-md border border-input bg-input/30 text-start text-sm text-foreground outline-none transition-colors",
          "hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-disabled:cursor-not-allowed data-disabled:opacity-50",
          size === "sm" ? "h-8 px-2.5" : "h-9 px-3",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="truncate" />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform duration-200 data-popup-open:rotate-180">
          <ChevronDown className="size-4" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-[70] outline-none"
        >
          <SelectPrimitive.Popup
            className={cn(
              "max-h-[min(22rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-elev-3 outline-none",
              "origin-[var(--transform-origin)] transition-[transform,opacity] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95"
            )}
          >
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "flex cursor-default items-center justify-between gap-3 rounded-md px-2.5 py-2 leading-6 outline-none select-none",
                  "data-highlighted:bg-secondary data-highlighted:text-foreground",
                  "data-selected:font-semibold data-selected:text-primary",
                  "data-disabled:pointer-events-none data-disabled:opacity-50"
                )}
              >
                <SelectPrimitive.ItemText className="truncate">{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="shrink-0 text-primary">
                  <Check className="size-4" aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** مساعد لبناء الخيارات من خريطة `{ قيمة: تسمية }` مع خيار "الكل" في المقدّمة. */
export function optionsFromMap(
  map: Record<string, string>,
  allLabel?: string,
  allValue = "all"
): SelectOption[] {
  const entries = Object.entries(map).map(([value, label]) => ({ value, label }));
  return allLabel ? [{ value: allValue, label: allLabel }, ...entries] : entries;
}
