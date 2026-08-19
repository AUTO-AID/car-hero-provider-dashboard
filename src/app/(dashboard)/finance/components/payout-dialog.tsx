"use client";

import { useState } from "react";
import { Building, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";

interface PayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  minimumPayout: number;
  currency?: string;
  onSubmit: (payload: { amount: number; bankAccount: string; bankName: string }) => void;
  isPending: boolean;
}

export function PayoutDialog({ open, onOpenChange, balance, minimumPayout, currency, onSubmit, isPending }: PayoutDialogProps) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [touched, setTouched] = useState(false);

  const parsedAmount = Number(amount);

  /**
   * التحقّق داخل الحقل بدل toast بعد الإرسال.
   * الشكل السابق كان يقبل الإدخال ثم يرمي إحدى أربع رسائل toast، فيضطر
   * المستخدم لتخمين أي حقل رُفض بعد أن تختفي الرسالة.
   */
  const amountError = !amount
    ? undefined
    : !Number.isFinite(parsedAmount) || parsedAmount <= 0
      ? "أدخل مبلغاً صحيحاً أكبر من صفر."
      : parsedAmount < minimumPayout
        ? "المبلغ أقل من الحد الأدنى للسحب."
        : parsedAmount > balance
          ? "المبلغ يتجاوز رصيدك المتاح."
          : undefined;

  const accountError =
    !bankAccount && !touched
      ? undefined
      : bankAccount.trim().length < 4
        ? "أدخل رقم حساب أو IBAN صحيحاً (4 خانات على الأقل)."
        : undefined;

  const canSubmit = Boolean(amount) && !amountError && bankAccount.trim().length >= 4;

  const close = () => {
    setAmount("");
    setBankName("");
    setBankAccount("");
    setTouched(false);
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ amount: parsedAmount, bankAccount: bankAccount.trim(), bankName: bankName.trim() || "غير محدد" });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden /> طلب سحب رصيد
          </DialogTitle>
          <DialogDescription>
            يُحجز المبلغ من رصيدك المتاح حتى تراجع الإدارة الطلب.
          </DialogDescription>
        </DialogHeader>

        {/* الرصيد والحد الأدنى معروضان قبل الإدخال، لا بعد رفضه */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-secondary/30 p-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">المتاح للسحب</p>
            <Money value={balance} currency={currency} className="mt-1 block text-sm font-bold text-foreground" />
          </div>
          <div className="border-s border-border ps-3">
            <p className="text-xs text-muted-foreground">الحد الأدنى</p>
            <Money value={minimumPayout} currency={currency} className="mt-1 block text-sm font-bold text-foreground" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="المبلغ" required error={amountError} htmlFor="payout-amount">
            <Input
              id="payout-amount"
              type="number"
              inputMode="decimal"
              min={minimumPayout}
              max={balance}
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>

          <Field label="اسم البنك أو جهة التحويل" icon={Building} htmlFor="bank-name">
            <Input id="bank-name" value={bankName} onChange={(event) => setBankName(event.target.value)} />
          </Field>

          <Field label="رقم الحساب أو IBAN" icon={CreditCard} required error={accountError} htmlFor="bank-account">
            <Input
              id="bank-account"
              dir="ltr"
              value={bankAccount}
              onBlur={() => setTouched(true)}
              onChange={(event) => setBankAccount(event.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={isPending}>
              إلغاء
            </Button>
            <Button type="submit" loading={isPending} disabled={!canSubmit}>
              إرسال الطلب
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
