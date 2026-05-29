"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, Loader2, DollarSign, Building, CreditCard } from "lucide-react";

interface PayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  onSubmit: (payload: { amount: number; bankAccount: string; bankName: string }) => void;
  isPending: boolean;
}

export function PayoutDialog({ open, onOpenChange, balance, onSubmit, isPending }: PayoutDialogProps) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    if (amt > balance) {
      toast.error("الرصيد المتاح لا يكفي لإتمام هذه العملية");
      return;
    }
    if (!bankAccount.trim()) {
      toast.error("يرجى إدخال الحساب المصرفي (IBAN)");
      return;
    }
    onSubmit({
      amount: amt,
      bankAccount: bankAccount.trim(),
      bankName: bankName.trim() || "غير محدد",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 border-border/50 rounded-2xl max-w-md backdrop-blur-xl text-right">
        <DialogHeader className="text-right">
          <DialogTitle className="text-white text-base font-bold flex items-center gap-2 justify-end">
            <span>تقديم طلب سحب رصيد</span>
            <Wallet className="w-5 h-5 text-primary" />
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            سيتم مراجعة طلبك وإيداع المبلغ في حسابك المصرفي فور الاعتماد.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold text-muted-foreground">
              المبلغ المطلوب سحبه (ل.س)
            </Label>
            <div className="relative">
              <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="amount"
                type="number"
                placeholder="مثال: 100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-10 dark-input"
                required
              />
            </div>
            <span className="text-[10px] text-muted-foreground/60 block text-left">
              الرصيد المتاح: {(balance || 0).toLocaleString()} ل.س
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName" className="text-xs font-bold text-muted-foreground">
              اسم البنك / جهة التحويل
            </Label>
            <div className="relative">
              <Building className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="bankName"
                placeholder="مثال: بنك بيمو السعودي الفرنسي"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="pr-10 dark-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccount" className="text-xs font-bold text-muted-foreground">
              رقم الحساب أو الـ IBAN
            </Label>
            <div className="relative">
              <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="bankAccount"
                placeholder="SY**********************"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="pr-10 dark-input"
                required
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row-reverse gap-2.5 mt-4 justify-start">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary hover:bg-primary/85 text-primary-foreground font-bold h-9 rounded-xl gap-1.5 shadow-md shadow-primary/10"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>تقديم الطلب</span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border/40 hover:bg-secondary/40 font-bold h-9 rounded-xl"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
