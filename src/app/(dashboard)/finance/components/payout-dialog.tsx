"use client";

import { useState } from "react";
import { Building, CreditCard, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  minimumPayout: number;
  currency: string;
  onSubmit: (payload: { amount: number; bankAccount: string; bankName: string }) => void;
  isPending: boolean;
}

export function PayoutDialog({ open, onOpenChange, balance, minimumPayout, currency, onSubmit, isPending }: PayoutDialogProps) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const close = () => {
    setAmount("");
    setBankName("");
    setBankAccount("");
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return toast.error("يرجى إدخال مبلغ صحيح.");
    if (parsedAmount < minimumPayout) return toast.error(`الحد الأدنى للسحب هو ${minimumPayout.toLocaleString("ar-SY")} ${currency}.`);
    if (parsedAmount > balance) return toast.error("الرصيد المتاح لا يكفي لإتمام الطلب.");
    if (bankAccount.trim().length < 4) return toast.error("يرجى إدخال رقم الحساب أو IBAN بصورة صحيحة.");
    onSubmit({ amount: parsedAmount, bankAccount: bankAccount.trim(), bankName: bankName.trim() || "غير محدد" });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : close()}>
      <DialogContent className="max-w-md bg-card border-border/50 text-right" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2"><Wallet className="size-5 text-primary" /> طلب سحب رصيد</DialogTitle>
          <DialogDescription>سيتم حجز المبلغ من الرصيد المتاح حتى يراجع فريق الإدارة الطلب.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payout-amount">المبلغ ({currency})</Label>
            <Input id="payout-amount" type="number" min={minimumPayout} max={balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            <p className="text-[10px] text-muted-foreground">المتاح: {balance.toLocaleString("ar-SY")} {currency}، الحد الأدنى: {minimumPayout.toLocaleString("ar-SY")} {currency}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-name">اسم البنك أو جهة التحويل</Label>
            <div className="relative"><Building className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="bank-name" value={bankName} onChange={(event) => setBankName(event.target.value)} className="pr-9" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-account">رقم الحساب أو IBAN</Label>
            <div className="relative"><CreditCard className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="bank-account" value={bankAccount} onChange={(event) => setBankAccount(event.target.value)} className="pr-9" required /></div>
          </div>
          <DialogFooter className="flex-row gap-2 justify-start">
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="animate-spin" />} إرسال الطلب</Button>
            <Button type="button" variant="outline" onClick={close}>إلغاء</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
