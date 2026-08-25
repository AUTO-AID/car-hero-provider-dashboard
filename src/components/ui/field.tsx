"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  /** أيقونة اختيارية بجانب التسمية */
  icon?: React.ElementType;
  /** نص إرشادي يظهر تحت الحقل ما لم يوجد خطأ */
  hint?: string;
  /** رسالة خطأ تُعرض تحت الحقل مباشرة */
  error?: string;
  required?: boolean;
  /** يمتد على عرض الشبكة كاملاً */
  full?: boolean;
  className?: string;
  htmlFor?: string;
}

/**
 * غلاف الحقل الموحّد: تسمية + عنصر إدخال + رسالة.
 *
 * الأهم فيه أن رسالة الخطأ تظهر **تحت الحقل** وتُربط به عبر `aria-describedby`.
 * قبل ذلك كانت كل أخطاء النماذج تُبلَّغ عبر toast يختفي بعد ثوانٍ، فلا يعرف
 * المستخدم أي حقل تحديداً هو المرفوض.
 */
export function Field({
  label,
  children,
  icon: Icon,
  hint,
  error,
  required,
  full,
  className,
  htmlFor,
}: FieldProps) {
  const reactId = React.useId();
  const controlId = htmlFor ?? reactId;
  const messageId = `${controlId}-message`;
  const message = error ?? hint;

  // حقن معرّف الحقل وحالته على عنصر الإدخال دون أن تكرّرها كل صفحة
  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: (children.props as { id?: string }).id ?? controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? messageId : undefined,
        "aria-required": required || undefined,
      })
    : children;

  return (
    <div className={cn("group space-y-2", full && "col-span-full", className)}>
      <label
        htmlFor={controlId}
        className="flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors group-focus-within:text-primary"
      >
        {Icon && (
          <Icon
            className="size-4 text-primary/70 transition-colors group-focus-within:text-primary"
            aria-hidden
          />
        )}
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </label>

      {control}

      {message && (
        <p
          id={messageId}
          className={cn(
            "flex items-start gap-1.5 text-xs",
            error ? "text-danger-soft" : "text-muted-foreground"
          )}
          role={error ? "alert" : undefined}
        >
          {error && <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
          {message}
        </p>
      )}
    </div>
  );
}
