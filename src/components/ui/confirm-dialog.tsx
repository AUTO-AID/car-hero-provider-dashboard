"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  /** يجعل زرّ التأكيد مصمتاً بلون الخطر — للأفعال التي لا رجعة فيها */
  danger?: boolean;
  /** حقل إضافي داخل الحوار (مثل سبب الإلغاء) */
  children?: React.ReactNode;
  /** تعطيل التأكيد حتى يكتمل الحقل الإضافي */
  confirmDisabled?: boolean;
}

/**
 * حوار تأكيد واحد لكل الأفعال الخطرة.
 *
 * كانت اللوحة تحوي أربعة حوارات تأكيد مكتوبة يدوياً بترتيب أزرار مختلف بين
 * واحدٍ وآخر (التأكيد أولاً هنا، والتراجع أولاً هناك) — وهو بالضبط الوضع الذي
 * يجعل المزوّد ينقر الزرّ الخطأ بحكم العادة.
 * القاعدة المعتمدة: **التراجع أولاً في ترتيب القراءة، والتأكيد في النهاية.**
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "تراجع",
  onConfirm,
  isPending,
  danger,
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "destructive" : "default"}
            loading={isPending}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
