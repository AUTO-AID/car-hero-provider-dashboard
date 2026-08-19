"use client";

import { useDeferredValue, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Clock3, Download, History, Landmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { TransactionFilters } from "@/domain/entities/wallet.types";
import { exportProviderTransactions, getProviderTransactions, getProviderWallet, requestPayout } from "@/infrastructure/services/wallet.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataToolbar, type ActiveFilterChip } from "@/components/ui/data-toolbar";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { PageToolbar } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select, optionsFromMap } from "@/components/ui/select";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { currencyLabel, formatAmount } from "@/lib/format";
import { BalanceCard } from "./components/balance-card";
import { FinanceCharts } from "./components/finance-charts";
import { PayoutDialog } from "./components/payout-dialog";
import { TxRow } from "./components/tx-row";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<string, string> = { credit: "إضافة رصيد", debit: "خصم رصيد", refund: "استرداد" };
const TX_STATUS_LABELS: Record<string, string> = { completed: "مكتمل", pending: "قيد المراجعة", failed: "مرفوض", reversed: "معكوس" };
const REFERENCE_LABELS: Record<string, string> = { order: "أرباح الطلبات", payout: "طلبات السحب", withdrawal: "السحوبات", payout_reversal: "إعادة مبلغ سحب" };
const SORT_LABELS: Record<string, string> = { createdAt: "التاريخ", amount: "المبلغ", status: "الحالة", type: "النوع" };
const ORDER_LABELS: Record<string, string> = { desc: "تنازلي", asc: "تصاعدي" };

const TYPE_OPTIONS = optionsFromMap(TYPE_LABELS, "كل أنواع الحركة");
const TX_STATUS_OPTIONS = optionsFromMap(TX_STATUS_LABELS, "كل الحالات");
const REFERENCE_OPTIONS = optionsFromMap(REFERENCE_LABELS, "كل المصادر");
const SORT_OPTIONS = optionsFromMap(SORT_LABELS);
const ORDER_OPTIONS = optionsFromMap(ORDER_LABELS);

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
    queryKey: providerQueryKeys.transactions(filters),
    queryFn: () => getProviderTransactions(filters),
    placeholderData: keepPreviousData,
  });

  const payoutMutation = useMutation({
    mutationFn: requestPayout,
    onSuccess: () => {
      toast.success("تم إرسال طلب السحب للمراجعة.");
      setIsPayoutOpen(false);
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.transactionsRoot });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportProviderTransactions(filters),
    onSuccess: () => toast.success("تم تجهيز ملف المعاملات."),
    onError: (error) => toast.error(errorMessage(error)),
  });

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
  const currency = wallet?.currency ?? undefined;
  const transactions = transactionsQuery.data?.data ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const chips: ActiveFilterChip[] = [
    search && { key: "search", label: `بحث: ${search}`, onRemove: () => { setSearch(""); setPage(1); } },
    type !== "all" && { key: "type", label: `الحركة: ${TYPE_LABELS[type]}`, onRemove: () => { setType("all"); setPage(1); } },
    status !== "all" && { key: "status", label: `الحالة: ${TX_STATUS_LABELS[status]}`, onRemove: () => { setStatus("all"); setPage(1); } },
    referenceType !== "all" && { key: "referenceType", label: `المصدر: ${REFERENCE_LABELS[referenceType]}`, onRemove: () => { setReferenceType("all"); setPage(1); } },
    dateFrom && { key: "dateFrom", label: `من: ${dateFrom}`, onRemove: () => { setDateFrom(""); setPage(1); } },
    dateTo && { key: "dateTo", label: `إلى: ${dateTo}`, onRemove: () => { setDateTo(""); setPage(1); } },
    sortBy !== "createdAt" && { key: "sortBy", label: `الفرز: ${SORT_LABELS[sortBy]}`, onRemove: () => { setSortBy("createdAt"); setPage(1); } },
    sortOrder !== "desc" && { key: "sortOrder", label: ORDER_LABELS.asc, onRemove: () => { setSortOrder("desc"); setPage(1); } },
  ].filter(Boolean) as ActiveFilterChip[];
  const hasFilters = chips.length > 0;

  if (walletQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (walletQuery.isError || !wallet || !summary) {
    return (
      <ErrorState
        title="تعذّر تحميل بيانات المحفظة"
        description="لم يستجب الخادم لطلب رصيد المحفظة وملخّصها المالي."
        onRetry={() => void walletQuery.refetch()}
        isRetrying={walletQuery.isFetching}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageToolbar
        status={
          wallet.balance < summary.minimumPayout ? (
            <>
              يفتح طلب السحب عند بلوغ الرصيد{" "}
              <Money value={summary.minimumPayout} currency={currency} className="font-semibold text-foreground" />.
            </>
          ) : null
        }
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
              {!exportMutation.isPending && <Download aria-hidden />} تصدير CSV
            </Button>
            <Button
              type="button"
              onClick={() => setIsPayoutOpen(true)}
              disabled={wallet.balance < summary.minimumPayout}
              title={wallet.balance < summary.minimumPayout ? `الرصيد أقل من الحد الأدنى للسحب (${formatAmount(summary.minimumPayout)} ${currencyLabel(currency)})` : undefined}
            >
              <Landmark aria-hidden /> طلب سحب
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceCard label="الرصيد المتاح للسحب" value={wallet.balance} currency={currency} tone="primary" />
        <BalanceCard label="الأرباح المثبّتة" value={summary.totalEarnings} currency={currency} icon={TrendingUp} tone="success" />
        <BalanceCard label="طلبات السحب المعلّقة" value={summary.pendingPayouts} currency={currency} icon={Clock3} tone="warning" />
        <BalanceCard label="الرصيد المعلّق" value={wallet.pendingBalance} currency={currency} icon={History} />
      </div>

      {summary.openingBalance !== 0 && (
        <Card className="border-warning/25 bg-warning/5">
          <CardContent className="p-4 text-xs leading-relaxed text-warning-soft">
            تحتوي المحفظة على رصيد افتتاحي قدره{" "}
            <Money value={summary.openingBalance} currency={currency} className="font-bold" /> غير مرتبط
            بمعاملات تاريخية، ولا يُحتسب ضمن الأرباح المثبّتة.
          </CardContent>
        </Card>
      )}

      <FinanceCharts summary={summary} currency={currency} />

      <DataToolbar
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="ابحث برقم المعاملة أو الوصف أو المرجع"
        searchLabel="بحث في المعاملات"
        chips={chips}
        onReset={resetFilters}
        resultCount={transactionsQuery.data?.total}
      >
        <Select aria-label="نوع الحركة" value={type} onValueChange={(value) => { setType(value); setPage(1); }} options={TYPE_OPTIONS} />
        <Select aria-label="حالة المعاملة" value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={TX_STATUS_OPTIONS} />
        <Select aria-label="مصدر المعاملة" value={referenceType} onValueChange={(value) => { setReferenceType(value); setPage(1); }} options={REFERENCE_OPTIONS} />
        <Select aria-label="الفرز حسب" value={sortBy} onValueChange={(value) => { setSortBy(value); setPage(1); }} options={SORT_OPTIONS} />
        <Select aria-label="اتجاه الفرز" value={sortOrder} onValueChange={(value) => { setSortOrder(value as "asc" | "desc"); setPage(1); }} options={ORDER_OPTIONS} />
        <div className="col-span-2 flex gap-2 md:col-span-1">
          <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="من تاريخ" />
          <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="إلى تاريخ" />
        </div>
      </DataToolbar>

      <Card className="gap-0">
        <CardHeader className="border-b bg-secondary/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-primary" aria-hidden /> سجلّ المعاملات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactionsQuery.isError ? (
            <ErrorState compact className="m-4" description="تعذّر تحميل سجلّ المعاملات." onRetry={() => void transactionsQuery.refetch()} />
          ) : transactionsQuery.isLoading ? (
            <SkeletonList count={5} className="p-4" />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={History}
              title={hasFilters ? "لا توجد معاملات مطابقة" : "لا توجد معاملات بعد"}
              description={hasFilters ? "جرّب توسيع نطاق التاريخ أو إزالة بعض الفلاتر." : "ستظهر هنا كل حركة مالية على محفظتك."}
              action={hasFilters ? <Button type="button" variant="outline" size="sm" onClick={resetFilters}>مسح الفلاتر</Button> : undefined}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {transactions.map((transaction) => (
                <li key={transaction._id}>
                  <TxRow tx={transaction} currency={currency} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={pagination?.page ?? 1}
        pages={pagination?.pages ?? 1}
        total={transactionsQuery.data?.total}
        onPageChange={setPage}
        disabled={transactionsQuery.isFetching}
      />

      <PayoutDialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen} balance={wallet.balance} minimumPayout={summary.minimumPayout} currency={currency} onSubmit={(payload) => payoutMutation.mutate(payload)} isPending={payoutMutation.isPending} />
    </div>
  );
}
