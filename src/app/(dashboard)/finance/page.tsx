"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  getProviderTransactions,
  getProviderWallet,
  requestPayout,
} from "@/infrastructure/services/wallet.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { BalanceCard } from "./components/balance-card";
import { TxRow } from "./components/tx-row";
import { PayoutDialog } from "./components/payout-dialog";
import { FinanceCharts } from "./components/finance-charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, History, Loader2, DollarSign } from "lucide-react";
import { Transaction } from "@/domain/entities/wallet.types";

export default function ProviderFinancePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: providerQueryKeys.wallet,
    queryFn: getProviderWallet,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: providerQueryKeys.transactions,
    queryFn: getProviderTransactions,
  });

  const wallet = walletData?.data;
  const transactionsRaw = transactionsData?.data ?? transactionsData;
  const transactions: Transaction[] = Array.isArray(transactionsRaw)
    ? transactionsRaw
    : transactionsRaw?.transactions ?? [];

  const requestPayoutMut = useMutation({
    mutationFn: (payload: { amount: number; bankAccount: string; bankName: string }) =>
      requestPayout(payload),
    onSuccess: () => {
      toast.success("تم تقديم طلب سحب الرصيد بنجاح");
      queryClient.invalidateQueries({ queryKey: providerQueryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: providerQueryKeys.transactions });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("فشل تقديم الطلب. يرجى التأكد من توفر الرصيد الكافي وكتابة البيانات بشكل صحيح");
    },
  });

  const handleRequestPayout = (payload: { amount: number; bankAccount: string; bankName: string }) => {
    requestPayoutMut.mutate(payload);
  };

  if (walletLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border/20" />
          <div className="space-y-2">
            <div className="h-7 w-32 bg-card rounded-md" />
            <div className="h-4 w-48 bg-card/60 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-36 bg-card/40 border border-border/20 rounded-3xl" />
          <div className="h-36 bg-card/40 border border-border/20 rounded-3xl" />
        </div>
        <Card className="bg-card/40 border border-border/20 rounded-2xl p-6 h-56" />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gradient tracking-tight">الأرباح والمحفظة</h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              متابعة رصيدك وسجل المعاملات المالية
            </p>
          </div>
        </div>

        {balance > 0 && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all gap-2 self-start sm:self-center"
          >
            <DollarSign className="w-4 h-4" />
            طلب سحب رصيد
          </Button>
        )}
      </div>

      {/* ─── Balance Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
        <BalanceCard label="الرصيد المتاح للسحب" value={balance} accent />
        <BalanceCard label="إجمالي الأرباح" value={wallet?.totalEarnings ?? 0} />
      </div>

      {/* ─── Finance Charts Row ─── */}
      <FinanceCharts transactions={transactions} totalEarnings={wallet?.totalEarnings ?? 0} />

      {/* ─── Transactions ─── */}
      <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/20 bg-secondary/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="w-3.5 h-3.5 text-primary" />
            </span>
            سجل العمليات
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {transactionsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 animate-pulse">
              <Loader2 className="w-6 h-6 text-primary/50 animate-spin" />
              <p className="text-sm text-muted-foreground/50 font-medium">جاري تحميل سجل العمليات...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
                <History className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground/60">لا توجد حركات مالية بعد</p>
              <p className="text-[11px] text-muted-foreground/40">
                ستظهر هنا معاملاتك المالية بعد أول طلب مكتمل.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {transactions.map((tx) => (
                <TxRow key={tx._id} tx={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Modal Popup Dialog */}
      <PayoutDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        balance={balance}
        onSubmit={handleRequestPayout}
        isPending={requestPayoutMut.isPending}
      />
    </div>
  );
}
