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
          "absolute bottom-0 right-0 left-0 h-[2px] bg-primary rounded-full transition-all duration-300 transform scale-x-0 origin-center",
          active && "scale-x-100"
        )}
      />
    </button>
  );
}
