"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CheckCircle2, ClipboardList, SearchX, Wallet, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ORDERS_PAGE_SIZE, providerQueryKeys } from "@/application/services/prefetch";
import type { Booking } from "@/domain/entities/booking.types";
import {
  EMPTY_ORDERS_SUMMARY,
  cancelBooking,
  getProviderOrders,
  getProviderOrdersSummary,
  updateBookingStatus,
  type OrderGroup,
  type OrderSortKey,
} from "@/infrastructure/services/bookings.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Money } from "@/components/ui/money";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Textarea } from "@/components/ui/textarea";
import { LocationBroadcastCard } from "./components/location-broadcast-card";
import { OrderDetailsDialog } from "./components/order-details-dialog";
import { OrdersList } from "./components/orders-list";
import {
  GROUPS,
  OrdersToolbar,
  defaultSortFor,
  periodStart,
  sortOptionsFor,
  type PeriodKey,
} from "./components/orders-toolbar";

function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.";
}

/**
 * سجلّ الطلبات والمواعيد.
 *
 * الشاشة السابقة كانت تسأل المزوّد سبعة أسئلة قبل أن تريه طلباً واحداً:
 * أيّ عرض من ثلاثة، وأيّ حالة من تسع، وأيّ حالة دفع، وأيّ وسيلة دفع،
 * وبأيّ حقل يُفرز، وبأيّ اتجاه، وبين أيّ تاريخين — فوق مخطّط أعمدة أسبوعي
 * يكرّر ما في لوحة القيادة. وجمهورها ورشات لا مشغّلو أنظمة.
 *
 * البديل: **سجلّ يُقرأ من أعلى إلى أسفل**. رقاقة واحدة تختار المجموعة،
 * وحقل بحث واحد، وفترة، وترتيب. الطلبات مصفوفة بأيّامها كما يُقلَّب دفتر،
 * والنقر على أيّ طلب يفتح كلّ ما فيه — وفيه وحده تُتَّخذ القرارات.
 */
export default function ProviderOrdersPage() {
  const queryClient = useQueryClient();

  const [group, setGroup] = useState<OrderGroup>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [sort, setSort] = useState<OrderSortKey>("newest");
  const [page, setPage] = useState(1);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: string; action: string } | null>(null);

  const deferredSearch = useDeferredValue(search.trim());
  const dateFrom = periodStart(period);
  const scope = { search: deferredSearch || undefined, dateFrom };

  const ordersQuery = useQuery({
    queryKey: providerQueryKeys.orders({ ...scope, group, sort, page, limit: ORDERS_PAGE_SIZE }),
    queryFn: () => getProviderOrders({ ...scope, group, sort, page, limit: ORDERS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  // عدّادات الرقاقات وبطاقات المؤشّرات تُحسب على النطاق (بحث + فترة) بلا
  // فلتر مجموعة، فتبقى ثابتة بينما يتنقّل المزوّد بين المجموعات.
  const summaryQuery = useQuery({
    queryKey: providerQueryKeys.ordersSummary(scope),
    queryFn: () => getProviderOrdersSummary(scope),
    placeholderData: keepPreviousData,
  });

  /**
   * الطلبات النشطة تُطلب على حدة لا تُقرأ من القائمة المعروضة.
   *
   * بثّ الموقع كان يتغذّى من `bookings` الصفحة، وذلك مقبول حين كان العرض
   * الافتراضي هو «الطلبات الحالية» وحدها. مع سجلٍّ يبدأ بـ«كل الطلبات»
   * ويُفلتَر بحرّية، كان فلترُ المزوّد إلى «مكتملة» — أو تصفّحه إلى الصفحة
   * الثانية — يُطفئ البثّ في منتصف مهمّة جارية بلا أيّ أثر مرئي، فيتجمّد
   * موقع الفنّي على خريطة العميل.
   */
  const activeOrdersQuery = useQuery({
    queryKey: providerQueryKeys.orders({ group: "active", page: 1, limit: 50 }),
    queryFn: () => getProviderOrders({ group: "active", page: 1, limit: 50 }),
  });

  const summary = summaryQuery.data ?? EMPTY_ORDERS_SUMMARY;
  const orders = ordersQuery.data?.data ?? [];
  const pagination = ordersQuery.data?.pagination;

  const refreshOrders = () => {
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingsRoot });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.dashboardAllStats });
    if (selectedOrderId) {
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingDetails(selectedOrderId) });
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      refreshOrders();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingAction(null),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBooking(id, reason),
    onSuccess: () => {
      toast.success("تم إلغاء الطلب");
      setCancelTarget(null);
      setCancelReason("");
      refreshOrders();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingAction(null),
  });

  const changeGroup = (nextGroup: OrderGroup) => {
    setGroup(nextGroup);
    setPage(1);
    // مفاتيح الفرز ليست واحدة في كل المجموعات: «الموعد الأقرب» لا معنى له
    // خارج المواعيد، و«الأحدث» لا معنى له داخلها.
    const allowed = sortOptionsFor(nextGroup).map((option) => option.value);
    if (!allowed.includes(sort)) setSort(defaultSortFor(nextGroup));
  };

  const runStatusAction = (order: Booking, actionKey: string, nextStatus: string) => {
    setPendingAction({ id: order._id, action: actionKey });
    statusMutation.mutate({ id: order._id, status: nextStatus });
  };

  const requestCancel = (order: Booking) => {
    // نافذة التفاصيل تُغلق قبل فتح نافذة التأكيد: حواران متراكبان يتنازعان
    // حبس التركيز، ويترك ذلك لوحة المفاتيح عالقةً خلف الطبقة العليا.
    setSelectedOrderId(null);
    setCancelTarget(order);
  };

  const submitCancellation = () => {
    const reason = cancelReason.trim();
    if (!cancelTarget || reason.length < 5) {
      toast.error("يرجى كتابة سبب واضح للإلغاء");
      return;
    }
    setPendingAction({ id: cancelTarget._id, action: "cancel" });
    cancelMutation.mutate({ id: cancelTarget._id, reason });
  };

  const resetView = () => {
    setSearch("");
    setPeriod("all");
    setGroup("all");
    setSort("newest");
    setPage(1);
  };

  const isFiltered = Boolean(deferredSearch) || period !== "all" || group !== "all";
  const groupLabel = useMemo(
    () => GROUPS.find((item) => item.value === group)?.label ?? "الطلبات",
    [group]
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="grid grid-cols-2 gap-3 min-[1366px]:grid-cols-4">
        <StatCard
          title="كل الطلبات"
          value={summary.total}
          icon={ClipboardList}
          tone="info"
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="قيد التنفيذ"
          value={summary.active}
          icon={Wrench}
          tone="warning"
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="مكتملة"
          value={summary.completed}
          icon={CheckCircle2}
          tone="success"
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="دخل الطلبات المكتملة"
          value={<Money value={summary.completedRevenue} />}
          icon={Wallet}
          tone="primary"
          loading={summaryQuery.isLoading}
        />
      </div>

      {/* بثّ الموقع: يظهر فقط حين توجد طلبات نشطة تستقبله */}
      <LocationBroadcastCard bookings={activeOrdersQuery.data?.data ?? []} />

      <OrdersToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        group={group}
        onGroupChange={changeGroup}
        period={period}
        onPeriodChange={(value) => {
          setPeriod(value);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
        summary={summary}
        loadingCounts={summaryQuery.isLoading}
      />

      {ordersQuery.isError ? (
        <ErrorState
          title="تعذّر تحميل الطلبات"
          description="لم يستجب الخادم لطلب قائمة الطلبات."
          onRetry={() => void ordersQuery.refetch()}
          isRetrying={ordersQuery.isFetching}
        />
      ) : ordersQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[4.75rem] rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={isFiltered ? SearchX : ClipboardList}
            title={isFiltered ? "لا يوجد طلب يطابق بحثك" : "لا توجد طلبات بعد"}
            description={
              isFiltered
                ? `لا طلبات ضمن «${groupLabel}» في هذه الفترة. جرّب فترة أوسع أو امسح البحث.`
                : "ستظهر هنا كل طلبات العملاء ومواعيدهم فور وصولها، مرتّبة بأيّامها."
            }
            action={
              isFiltered ? (
                <Button type="button" variant="outline" size="sm" onClick={resetView}>
                  عرض كل الطلبات
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div aria-busy={ordersQuery.isFetching}>
            <OrdersList
              orders={orders}
              onOpen={setSelectedOrderId}
              // الفرز بالمبلغ يكسر التسلسل الزمني، وعناوين الأيام فوقه تكذب
              groupByDay={sort !== "amount"}
              useScheduledDate={group === "scheduled"}
            />
          </div>

          <Pagination
            page={pagination?.page ?? 1}
            pages={pagination?.pages ?? 1}
            total={pagination?.total}
            onPageChange={setPage}
            disabled={ordersQuery.isFetching}
          />
        </>
      )}

      <OrderDetailsDialog
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusChange={runStatusAction}
        onRequestCancel={requestCancel}
        pendingAction={
          pendingAction && pendingAction.id === selectedOrderId ? pendingAction.action : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
        title="إلغاء الطلب"
        description="يُحفظ السبب في سجل الطلب ويُبلَّغ به العميل. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="تأكيد الإلغاء"
        danger
        isPending={cancelMutation.isPending}
        confirmDisabled={cancelReason.trim().length < 5}
        onConfirm={submitCancellation}
      >
        <div className="space-y-2">
          <label htmlFor="cancel-reason" className="text-[13px] font-semibold text-muted-foreground">
            سبب الإلغاء
          </label>
          <Textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="مثال: المركبة تحتاج قطعة غير متوفرة حالياً"
            rows={4}
            aria-describedby="cancel-reason-hint"
          />
          <p id="cancel-reason-hint" className="text-xs text-muted-foreground">
            خمسة أحرف على الأقل. يظهر هذا النص للعميل.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
