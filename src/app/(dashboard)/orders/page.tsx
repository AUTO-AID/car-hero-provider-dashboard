"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
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
  periodStart,
  resolveSort,
  type PeriodKey,
} from "./components/orders-toolbar";

/**
 * البيانات المُسخَّنة تُعتبر طازجة خمس دقائق — نفس `staleTime` العام في
 * `providers.tsx`. الحدث الحقيقي (تغيّر حالة طلب) يصل عبر السوكِت ويُبطل
 * الجذر كلّه فوراً، فلا حاجة لإعادة جلبٍ دوريّ فوق ذلك.
 */
const GROUP_WARM_STALE_TIME = 5 * 60 * 1000;

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

  /**
   * البحث مُمهَل ٣٥٠ms.
   *
   * `useDeferredValue` كان يؤجّل **التصيير** لا الشبكة: كل توقّف قصير أثناء
   * الكتابة كان يُطلق نداءً كاملاً إلى خادمٍ يبعد ٦٠٠ms في أحسن حال، فتتكدّس
   * أربعة أو خمسة نداءات لكلمة واحدة ويصل آخرها بعد أن تكون العين انتقلت.
   */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const dateFrom = periodStart(period);
  const scope = useMemo(
    () => ({ search: debouncedSearch || undefined, dateFrom }),
    [debouncedSearch, dateFrom]
  );

  /**
   * الفرز الذي ستطلبه المجموعة فعلاً لو نُقرت الآن. تُستعمل في مكانين —
   * عند النقر وعند التسخين المسبق — ولو اختلفا لاختلف مفتاح الذاكرة عن
   * مفتاح الطلب، فيذهب التسخين هدراً ويعود الانتظار كما كان.
   */
  const sortForGroup = useCallback(
    (target: OrderGroup) => resolveSort(target, sort),
    [sort]
  );

  const queryForGroup = useCallback(
    (target: OrderGroup) => ({
      ...scope,
      group: target,
      sort: sortForGroup(target),
      page: 1,
      limit: ORDERS_PAGE_SIZE,
    }),
    [scope, sortForGroup]
  );

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

  /**
   * تسخين المجموعات: نقرة الرقاقة يجب أن تقرأ من الذاكرة لا من الشبكة.
   *
   * كل مجموعة استعلامٌ مستقلّ، فكانت كل نقرة تدفع دورة كاملة إلى Render
   * (٦٠٠ms–١s مقيسة، وأكثر مع تجميعة `$facet`) والقائمة تبقى على محتواها
   * القديم بلا إشارة — فتبدو الرقاقة كأنها لم تعمل. الآن تُجلب المجموعات
   * الأربع الأخرى في وقت الفراغ، ويُسخَّن ما تمرّ فوقه فوراً، فتصل النقرة
   * إلى بيانات جاهزة.
   */
  const warmGroup = useCallback(
    (target: OrderGroup) => {
      const query = queryForGroup(target);
      void queryClient.prefetchQuery({
        queryKey: providerQueryKeys.orders(query),
        queryFn: () => getProviderOrders(query),
        staleTime: GROUP_WARM_STALE_TIME,
      });
    },
    [queryClient, queryForGroup]
  );

  useEffect(() => {
    // لا تسخين شامل أثناء البحث: كل مصطلح مستقرّ كان سيُطلق خمسة نداءات
    // إضافية على خادمٍ مجّاني، والباحث يبقى عادةً داخل مجموعة واحدة.
    // التسخين عند المرور فوق الرقاقة يغطّي هذه الحالة بنداء واحد عند الحاجة.
    if (debouncedSearch) return undefined;

    // في وقت الفراغ لا فوراً: التحميل الأوّل يحتاج نطاقه للقائمة والملخّص
    // والطلبات النشطة، وإقحام أربعة نداءات فوقها يؤخّر ما يُنتظر فعلاً.
    const warmAll = () => GROUPS.forEach((item) => warmGroup(item.value));

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warmAll, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(warmAll, 800);
    return () => window.clearTimeout(id);
  }, [debouncedSearch, warmGroup]);

  /**
   * الصفحة التالية تُجلب فور استقرار الحالية، فزرّ «التالي» يعمل من الذاكرة.
   * هو النداء نفسه الذي كان سيحدث بعد النقر — لكنه يقع في وقت لا ينتظر فيه
   * أحد.
   */
  const totalPages = ordersQuery.data?.pagination?.pages ?? 1;
  useEffect(() => {
    if (ordersQuery.isPlaceholderData || page >= totalPages) return;
    const next = { ...scope, group, sort, page: page + 1, limit: ORDERS_PAGE_SIZE };
    void queryClient.prefetchQuery({
      queryKey: providerQueryKeys.orders(next),
      queryFn: () => getProviderOrders(next),
      staleTime: GROUP_WARM_STALE_TIME,
    });
  }, [group, ordersQuery.isPlaceholderData, page, queryClient, scope, sort, totalPages]);

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
    setSort(sortForGroup(nextGroup));
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

  const isFiltered = Boolean(debouncedSearch) || period !== "all" || group !== "all";
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
        onWarmGroup={warmGroup}
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
          {/* الإشارة تظهر فقط حين تكون الصفوف المعروضة تخصّ فلتراً آخر
              (`isPlaceholderData`) — لا عند كل إعادة جلب في الخلفية، وإلا
              وميض المحتوى بعد كل حدث سوكِت بلا سبب مرئي. */}
          <div
            aria-busy={ordersQuery.isPlaceholderData}
            className={cn(
              "transition-opacity duration-150",
              ordersQuery.isPlaceholderData && "pointer-events-none opacity-45"
            )}
          >
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
