"use client";

import { cn } from "@/lib/utils";

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function TabButton({ label, active, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        "relative pb-3 px-1 text-sm font-bold transition-all duration-300",
        active
          ? "text-primary"
          : "text-muted-foreground/50 hover:text-muted-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute bottom-0 inset-x-0 h-[3px] bg-primary rounded-t-full transition-all duration-300 transform scale-x-0 origin-center shadow-[0_0_10px_rgba(165,126,216,0.6)]",
          active && "scale-x-100"
        )}
      />
    </button>
  );
}
