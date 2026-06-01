"use client";

import { useDeferredValue, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ChevronLeft, ChevronRight, Clock3, Download, FilterX, History, Landmark, RefreshCw, Search, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { TransactionFilters } from "@/domain/entities/wallet.types";
import { exportProviderTransactions, getProviderTransactions, getProviderWallet, requestPayout } from "@/infrastructure/services/wallet.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BalanceCard } from "./components/balance-card";
import { FinanceCharts } from "./components/finance-charts";
import { PayoutDialog } from "./components/payout-dialog";
import { TxRow } from "./components/tx-row";

const PAGE_SIZE = 10;

function errorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.";
}

export default function ProviderFinancePage() {
  const queryClient = useQueryClient();
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [referenceType, setReferenceType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filters: TransactionFilters = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch || undefined,
    type: type !== "all" ? type : undefined,
    status: status !== "all" ? status : undefined,
    referenceType: referenceType !== "all" ? referenceType : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  };

  const walletQuery = useQuery({ queryKey: providerQueryKeys.wallet, queryFn: getProviderWallet });
  const transactionsQuery = useQuery({
    queryKey: ["provider-transactions", filters],
    queryFn: () => getProviderTransactions(filters),
    placeholderData: keepPreviousData,
  });

  const payoutMutation = useMutation({
    mutationFn: requestPayout,
    onSuccess: () => {
      toast.success("تم إرسال طلب السحب للمراجعة.");
      setIsPayoutOpen(false);
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: ["provider-transactions"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportProviderTransactions(filters),
    onSuccess: () => toast.success("تم تجهيز ملف المعاملات."),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const refresh = () => {
    void walletQuery.refetch();
    void transactionsQuery.refetch();
  };

  const resetFilters = () => {
    setSearch("");
    setType("all");
    setStatus("all");
    setReferenceType("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const wallet = walletQuery.data;
  const summary = wallet?.summary;
  const currency = wallet?.currency || "SAR";
  const transactions = transactionsQuery.data?.data ?? [];
  const pagination = transactionsQuery.data?.pagination;
  const hasFilters = Boolean(search || type !== "all" || status !== "all" || referenceType !== "all" || dateFrom || dateTo || sortBy !== "createdAt" || sortOrder !== "desc");

  if (walletQuery.isLoading) {
    return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card key={index} className="h-28 animate-pulse bg-card/50 border-border/20 rounded-xl" />)}</div>;
  }

  if (walletQuery.isError || !wallet || !summary) {
    return (
      <Card className="p-8 text-center border-destructive/30 bg-destructive/5 rounded-xl">
        <p className="text-sm text-destructive">تعذر تحميل بيانات المحفظة.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => walletQuery.refetch()}><RefreshCw /> إعادة المحاولة</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Wallet className="size-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-black text-gradient">الأرباح والمحفظة</h1>
            <p className="mt-1 text-sm text-muted-foreground">الرصيد، الأرباح المثبتة، طلبات السحب، وسجل المعاملات</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={walletQuery.isFetching || transactionsQuery.isFetching}><RefreshCw className={walletQuery.isFetching || transactionsQuery.isFetching ? "animate-spin" : ""} /> تحديث</Button>
          <Button type="button" variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}><Download /> تصدير CSV</Button>
          <Button type="button" onClick={() => setIsPayoutOpen(true)} disabled={wallet.balance < summary.minimumPayout}><Landmark /> طلب سحب</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceCard label="الرصيد المتاح للسحب" value={wallet.balance} currency={currency} accent="primary" />
        <BalanceCard label="الأرباح المثبتة" value={summary.totalEarnings} currency={currency} icon={TrendingUp} accent="success" />
        <BalanceCard label="طلبات السحب المعلقة" value={summary.pendingPayouts} currency={currency} icon={Clock3} accent="warning" />
        <BalanceCard label="الرصيد المعلق" value={wallet.pendingBalance} currency={currency} icon={History} />
      </div>

      {summary.openingBalance !== 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 rounded-xl">
          <CardContent className="p-4 text-xs text-amber-100/80">
            تحتوي المحفظة على رصيد افتتاحي قدره <strong>{summary.openingBalance.toLocaleString("ar-SY", { maximumFractionDigits: 2 })} {currency}</strong> غير مرتبط بمعاملات تاريخية. لا يتم احتسابه ضمن الأرباح المثبتة.
          </CardContent>
        </Card>
      )}

      <FinanceCharts summary={summary} currency={currency} />

      <Card className="border-border/30 bg-card/50 p-4 rounded-xl">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="ابحث برقم المعاملة أو الوصف أو المرجع" className="pr-10" />
          </label>
          <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">كل أنواع الحركة</option><option value="credit">إضافة رصيد</option><option value="debit">خصم رصيد</option><option value="refund">استرداد</option>
          </select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">كل الحالات</option><option value="completed">مكتمل</option><option value="pending">قيد المراجعة</option><option value="failed">مرفوض</option><option value="reversed">معكوس</option>
          </select>
          <select value={referenceType} onChange={(event) => { setReferenceType(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">كل المصادر</option><option value="order">أرباح الطلبات</option><option value="payout">طلبات السحب</option><option value="withdrawal">السحوبات</option><option value="payout_reversal">إعادة مبلغ سحب</option>
          </select>
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="createdAt">الفرز حسب التاريخ</option><option value="amount">الفرز حسب المبلغ</option><option value="status">الفرز حسب الحالة</option><option value="type">الفرز حسب النوع</option>
          </select>
          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as "asc" | "desc"); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="desc">تنازلي</option><option value="asc">تصاعدي</option>
          </select>
          <div className="flex gap-2"><Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="من تاريخ" /><Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="إلى تاريخ" /></div>
        </div>
        {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="mt-3 text-muted-foreground"><FilterX /> مسح الفلاتر</Button>}
      </Card>

      <Card className="glass-v2 border-border/30 rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-secondary/15">
          <CardTitle className="flex items-center gap-2 text-base"><History className="size-4 text-primary" /> سجل المعاملات <span className="text-xs text-muted-foreground">({transactionsQuery.data?.total ?? 0})</span></CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactionsQuery.isError ? (
            <div className="p-8 text-center"><p className="text-sm text-destructive">تعذر تحميل المعاملات.</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => transactionsQuery.refetch()}>إعادة المحاولة</Button></div>
          ) : transactionsQuery.isLoading ? (
            <div className="space-y-1 p-4">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-secondary/30" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center"><History className="mx-auto size-8 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">لا توجد معاملات مطابقة.</p>{hasFilters && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={resetFilters}><FilterX /> مسح الفلاتر</Button>}</div>
          ) : (
            <div className="divide-y divide-border/20">{transactions.map((transaction) => <TxRow key={transaction._id} tx={transaction} currency={currency} />)}</div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">صفحة {pagination?.page ?? 1} من {Math.max(pagination?.pages ?? 1, 1)}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={(pagination?.page ?? 1) <= 1} onClick={() => setPage((current) => current - 1)}><ChevronRight /> السابق</Button>
          <Button type="button" variant="outline" size="sm" disabled={(pagination?.page ?? 1) >= (pagination?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}>التالي <ChevronLeft /></Button>
        </div>
      </div>

      <PayoutDialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen} balance={wallet.balance} minimumPayout={summary.minimumPayout} currency={currency} onSubmit={(payload) => payoutMutation.mutate(payload)} isPending={payoutMutation.isPending} />
    </div>
  );
}
