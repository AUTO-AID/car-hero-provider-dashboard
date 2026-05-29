"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  full?: boolean;
}

export function FormField({
  label,
  icon: Icon,
  children,
  full = false,
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${full ? "col-span-full" : ""}`}>
      <label className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary/60" aria-hidden />
        {label}
      </label>
      {children}
    </div>
  );
}
