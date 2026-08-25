"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Receipt, Search, TrendingUp, Wallet, X } from "lucide-react";
import { providerQueryKeys } from "@/application/services/prefetch";
import type { TransactionFilters } from "@/domain/entities/wallet.types";
import { getProviderTransactions, getProviderWallet } from "@/infrastructure/services/wallet.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { dayHeading, groupByDay } from "@/lib/day-groups";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EarningsChart } from "./components/earnings-chart";
import { TransactionRow } from "./components/transaction-row";

const PAGE_SIZE = 15;

type MoneyFilter = "all" | "in" | "out";

/**
 * ثلاث رقاقات بلغة صاحب الورشة: كل شيء، ما دخل، ما خرج.
 *
 * حلّت محلّ خمس قوائم منسدلة (نوع الحركة، الحالة، المصدر، الفرز، الاتجاه)
 * وحقلَي تاريخ. الفلترة على `type` لا على `referenceType` عمداً: الخادم
 * يطابق `referenceType` بقيمة واحدة، فـ«السحوبات» كانت ستحتاج طلبين
 * (`payout` و`withdrawal`) — بينما `debit` يجمعهما بدقّة.
 */
const FILTERS: Array<{ value: MoneyFilter; label: string; icon: typeof Receipt; type?: string }> = [
  { value: "all", label: "كل الحركات", icon: Receipt },
  { value: "in", label: "أرباح دخلت", icon: ArrowDownLeft, type: "credit" },
  { value: "out", label: "مبالغ خرجت", icon: ArrowUpRight, type: "debit" },
];

/**
 * صفحة الأرباح.
 *
 * كانت تفتح على زرّين (تصدير CSV، طلب سحب) وأربع بطاقات بمصطلحات محاسبية
 * («الرصيد المتاح للسحب»، «الأرباح المثبّتة»، «طلبات السحب المعلّقة»،
 * «الرصيد المعلّق») ولافتة تحذير، ثمّ مخطّطَي ECharts، ثمّ سبعة عناصر فلترة
 * فوق سجلّ كل سطر فيه وصفٌ إنجليزي خام:
 * «Earnings from order #6a3ef9… (15% commission deducted: 15.299999999999999 SAR)».
 *
 * البديل يجيب على سؤال واحد بالترتيب: كم عندي؟ كم ربحت؟ ومن أين جاء؟
 */
export default function ProviderFinancePage() {
  const [filter, setFilter] = useState<MoneyFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // مُمهَل كما في سجلّ الطلبات: النداء إلى الخادم يكلّف نحو ثانية،
  // فلا يُطلَق عند كل حرف.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters: TransactionFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      type: FILTERS.find((item) => item.value === filter)?.type,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    [debouncedSearch, filter, page]
  );

  const walletQuery = useQuery({ queryKey: providerQueryKeys.wallet, queryFn: getProviderWallet });
  const transactionsQuery = useQuery({
    queryKey: providerQueryKeys.transactions(filters),
    queryFn: () => getProviderTransactions(filters),
    placeholderData: keepPreviousData,
  });

  const wallet = walletQuery.data;
  const summary = wallet?.summary;
  const currency = wallet?.currency ?? undefined;
  const total = transactionsQuery.data?.total;
  const pagination = transactionsQuery.data?.pagination;

  // `?? []` داخل `useMemo` لا خارجه: مصفوفة جديدة في كل تصيير كانت تُبطل
  // الحفظ وتُعيد التجميع بلا سبب.
  const transactions = transactionsQuery.data?.data;
  const sections = useMemo(() => groupByDay(transactions ?? [], (tx) => tx.createdAt), [transactions]);
  const isFiltered = Boolean(debouncedSearch) || filter !== "all";

  if (walletQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-36 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (walletQuery.isError || !wallet || !summary) {
    return (
      <ErrorState
        title="تعذّر تحميل بيانات محفظتك"
        description="لم يستجب الخادم لطلب الرصيد وملخّص الأرباح."
        onRetry={() => void walletQuery.refetch()}
        isRetrying={walletQuery.isFetching}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* الرقم الوحيد الذي يفتح المزوّد الصفحة لأجله */}
      <Card className="gap-0 border-primary/25 bg-primary/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">رصيدك الآن</p>
            <Money
              value={wallet.balance}
              currency={currency}
              className="mt-1 block text-4xl leading-none font-bold text-foreground"
            />
          </div>
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"
          >
            <Wallet className="size-7" />
          </span>
        </div>

        {/* سطرا التوضيح بلغة عادية. بدونهما يرى المزوّد رصيداً أكبر من أرباحه
            ولا يجد تفسيراً — وهو أسوأ من مصطلح محاسبي. */}
        {(wallet.pendingBalance > 0 || summary.openingBalance !== 0) && (
          <div className="mt-4 flex flex-col gap-1.5 border-t border-primary/15 pt-3 text-xs leading-relaxed text-muted-foreground">
            {wallet.pendingBalance > 0 && (
              <p>
                ويوجد <Money value={wallet.pendingBalance} currency={currency} className="font-bold text-foreground" />{" "}
                بانتظار تأكيد العملاء، تُضاف إلى رصيدك بعد إغلاق طلباتها.
              </p>
            )}
            {summary.openingBalance !== 0 && (
              <p>
                يشمل رصيدك مبلغاً افتتاحياً قدره{" "}
                <Money value={summary.openingBalance} currency={currency} className="font-bold text-foreground" />{" "}
                أُضيف عند فتح حسابك، وليس من أرباح طلبات.
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryTile label="أرباح هذا الشهر" value={summary.monthlyEarnings} currency={currency} />
        <SummaryTile label="إجمالي أرباحك" value={summary.totalEarnings} currency={currency} />
      </div>

      <EarningsChart trend={summary.revenueTrend} currency={currency} />

      <Card className="gap-0 p-0">
        <div className="relative p-4">
          <Search
            className="pointer-events-none absolute start-7 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="ابحث في حركاتك…"
            aria-label="بحث في الحركات المالية"
            className="h-12 rounded-lg ps-12 pe-12 text-base"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              aria-label="مسح البحث"
              className="absolute end-7 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X aria-hidden />
            </Button>
          )}
        </div>

        <div
          role="group"
          aria-label="تصفية الحركات المالية"
          className="flex gap-2 overflow-x-auto border-t border-border/50 px-4 py-3"
        >
          {FILTERS.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setFilter(item.value);
                  setPage(1);
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-elev-1"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </Card>

      {transactionsQuery.isError ? (
        <ErrorState
          title="تعذّر تحميل سجلّ حركاتك"
          description="لم يستجب الخادم لطلب قائمة الحركات المالية."
          onRetry={() => void transactionsQuery.refetch()}
          isRetrying={transactionsQuery.isFetching}
        />
      ) : transactionsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[4.75rem] rounded-xl" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={Receipt}
            title={isFiltered ? "لا توجد حركة مطابقة" : "لا توجد حركات بعد"}
            description={
              isFiltered
                ? "جرّب مسح البحث أو اختيار «كل الحركات»."
                : "ستظهر هنا كل حركة على رصيدك: أرباح الطلبات والمبالغ المسحوبة."
            }
            action={
              isFiltered ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                    setPage(1);
                  }}
                >
                  عرض كل الحركات
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div
            aria-busy={transactionsQuery.isPlaceholderData}
            className={cn(
              "flex flex-col gap-6 transition-opacity duration-150",
              transactionsQuery.isPlaceholderData && "pointer-events-none opacity-45"
            )}
          >
            {sections.map((section) => {
              const heading = dayHeading(section.day);
              return (
                <section key={section.day.getTime()} className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2 px-1">
                    <h2 className="text-sm font-bold text-foreground">{heading.title}</h2>
                    {heading.subtitle && (
                      <span className="text-xs text-muted-foreground">{heading.subtitle}</span>
                    )}
                    <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                      {formatNumber(section.items.length)} حركة
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {section.items.map((tx) => (
                      <TransactionRow key={tx._id} tx={tx} currency={currency} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <Pagination
            page={pagination?.page ?? 1}
            pages={pagination?.pages ?? 1}
            total={total}
            onPageChange={setPage}
            disabled={transactionsQuery.isFetching}
          />
        </>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency?: string;
}) {
  return (
    <Card className="gap-2 p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 shrink-0 text-success-soft" aria-hidden />
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
      <Money value={value} currency={currency} className="text-2xl font-bold text-foreground" />
    </Card>
  );
}
