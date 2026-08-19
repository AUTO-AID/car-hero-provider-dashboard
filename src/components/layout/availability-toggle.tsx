"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { providerQueryKeys } from "@/application/services/prefetch";
import {
  getProviderProfile,
  updateProviderStatus,
  type ProviderAvailability,
} from "@/infrastructure/services/profile.service";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{
  value: ProviderAvailability;
  label: string;
  hint: string;
  dot: string;
  text: string;
}> = [
  {
    value: "online",
    label: "متاح",
    hint: "يظهر نشاطك للعملاء ويستقبل طلبات جديدة.",
    dot: "bg-success",
    text: "text-success-soft",
  },
  {
    value: "busy",
    label: "مشغول",
    hint: "تبقى الطلبات الحالية قائمة دون استقبال طلبات جديدة.",
    dot: "bg-warning",
    text: "text-warning-soft",
  },
  {
    value: "offline",
    label: "غير متاح",
    hint: "لا يظهر نشاطك في نتائج البحث لدى العملاء.",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
];

/**
 * مبدّل حالة التوفّر.
 *
 * `GET /providers/nearby` في الخادم لا يُرجع إلا المزوّدين بحالة `online`،
 * أي أن ظهور النشاط للعملاء يتوقّف على هذه القيمة — ولم تكن اللوحة تعرضها ولا
 * تسمح بتغييرها إطلاقاً، فيبقى المزوّد مخفياً دون أن يعرف السبب.
 * تُحدَّث عبر `PUT /providers/me/status` الموجود مسبقاً في الـ API.
 */
export function AvailabilityToggle({ collapsed = false }: { collapsed?: boolean }) {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: providerQueryKeys.profile,
    queryFn: getProviderProfile,
  });

  const current =
    OPTIONS.find((option) => option.value === profile?.status) ?? OPTIONS[2];

  const mutation = useMutation({
    mutationFn: updateProviderStatus,
    onSuccess: async (_data, status) => {
      const option = OPTIONS.find((item) => item.value === status);
      toast.success(`حالتك الآن: ${option?.label ?? status}`);
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("تعذّر تحديث حالة التوفّر."),
  });

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={mutation.isPending}
        aria-label={`حالة التوفّر: ${current.label}. اضغط للتغيير`}
        title={collapsed ? `حالة التوفّر: ${current.label}` : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/40 text-xs font-semibold outline-none transition-colors",
          "hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-disabled:cursor-not-allowed data-disabled:opacity-60",
          collapsed ? "h-9 justify-center px-0" : "h-9 px-2.5",
          current.text
        )}
      >
        <span className={cn("size-2 shrink-0 rounded-full", current.dot)} aria-hidden />
        {!collapsed && (
          <>
            <span className="flex-1 text-start">{current.label}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
          </>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="start" className="z-[var(--z-overlay)]">
          <Menu.Popup className="w-64 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-elev-3 outline-none">
            {OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                onClick={() => mutation.mutate(option.value)}
                className="flex cursor-default items-start gap-2.5 rounded-lg px-2.5 py-2 outline-none select-none data-highlighted:bg-secondary"
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", option.dot)} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
                {option.value === current.value && (
                  <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                )}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
