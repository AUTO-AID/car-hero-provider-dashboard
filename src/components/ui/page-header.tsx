"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface PageToolbarProps {
  /** سطر سياق قصير خاص بالصفحة (حالة، ملخّص) — ليس عنواناً */
  status?: React.ReactNode;
  /** أزرار الإجراءات على الجانب الانتهائي */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * شريط إجراءات الصفحة — **بلا عنوان**.
 *
 * كان هذا المكوّن يرسم عنوان الصفحة ووصفها، فيتكرّر العنوان نفسه في الهيدر
 * الثابت وفي جسم الصفحة: `<h1>` مرّتان في المستند، ونحو 120px من الطية الأولى
 * تذهب لتكرار ما هو معروض فوقه مباشرةً. العنوان الآن للهيدر وحده
 * (`lib/routes.ts`)، وما بقي للصفحة هو أزرارها وسطر حالتها.
 */
export function PageToolbar({ status, actions, className }: PageToolbarProps) {
  if (!status && !actions) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 text-sm text-muted-foreground">{status}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
