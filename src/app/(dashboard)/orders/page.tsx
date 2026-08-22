"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CalendarClock, CheckCircle2, History, Package, XCircle } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Booking } from "@/domain/entities/booking.types";
import {
  BookingFilters,
  BookingView,
  cancelBooking,
  getBookingDetails,
  getProviderBookings,
  getProviderWeeklyActivity,
  updateBookingStatus,
} from "@/infrastructure/services/bookings.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataToolbar, type ActiveFilterChip } from "@/components/ui/data-toolbar";
import { Input } from "@/components/ui/input";
import { Money, RelativeTime } from "@/components/ui/money";
import { Pagination } from "@/components/ui/pagination";
import { Select, optionsFromMap } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatWeekdayShort } from "@/lib/format";
import { BookingCard } from "./components/booking-card";
import { LocationBroadcastCard } from "./components/location-broadcast-card";
import { StatusBadge, STATUS_MAP } from "./components/status-badge";
import { TabButton } from "./components/tab-button";
import { WeeklyPerformanceChart } from "./components/weekly-performance-chart";

const PAGE_SIZE = 9;
const TABS: Array<{ value: Exclude<BookingView, "all">; label: string }> = [
  { value: "current", label: "الطلبات الحالية" },
  { value: "appointments", label: "المواعيد" },
  { value: "history", label: "السجل التاريخي" },
];

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الدفع",
  completed: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
};

/** الطرق الفعّالة — وهي وحدها ما يظهر في الفلتر */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدي",
  points: "نقاط الولاء",
  cham_cash: "شام كاش",
};

/**
 * تسميات القراءة تشمل المتقاعد أيضاً: طلبات قديمة تحمل `wallet` و`card`،
 * وعرضها بقيمتها الخام في جدول عربي يبدو كعطل.
 */
const PAYMENT_METHOD_READ_LABELS: Record<string, string> = {
  ...PAYMENT_METHOD_LABELS,
  wallet: "المحفظة (متقاعد)",
  card: "بطاقة (متقاعد)",
  online: "دفع إلكتروني (متقاعد)",
};

const SORT_LABELS: Record<string, string> = {
  createdAt: "تاريخ الإنشاء",
  scheduledAt: "الموعد",
  amount: "المبلغ",
  status: "الحالة",
};

const ORDER_LABELS: Record<string, string> = {
  desc: "الأحدث أولاً",
  asc: "الأقدم أولاً",
};

const STATUS_OPTIONS = optionsFromMap(
  Object.fromEntries(Object.entries(STATUS_MAP).map(([value, config]) => [value, config.label])),
  "كل الحالات"
);
const PAYMENT_STATUS_OPTIONS = optionsFromMap(PAYMENT_STATUS_LABELS, "كل حالات الدفع");
const PAYMENT_METHOD_OPTIONS = optionsFromMap(PAYMENT_METHOD_LABELS, "كل طرق الدفع");
const SORT_OPTIONS = optionsFromMap(SORT_LABELS);
const ORDER_OPTIONS = optionsFromMap(ORDER_LABELS);

function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.";
}



export default function ProviderOrdersPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<Exclude<BookingView, "all">>("current");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: string; action: string } | null>(null);

  const filters: BookingFilters = {
    view,
    page,
    limit: PAGE_SIZE,
    search: deferredSearch || undefined,
    status: status !== "all" ? status : undefined,
    paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
    sortBy,
    sortOrder,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const bookingsQuery = useQuery({
    queryKey: providerQueryKeys.bookings(filters),
    queryFn: () => getProviderBookings(filters),
    placeholderData: keepPreviousData,
  });

  const weeklyQuery = useQuery({
    queryKey: providerQueryKeys.weeklyBookings,
    queryFn: getProviderWeeklyActivity,
  });

  const detailsQuery = useQuery({
    queryKey: providerQueryKeys.bookingDetails(selectedBookingId ?? ""),
    queryFn: () => getBookingDetails(selectedBookingId!),
    enabled: Boolean(selectedBookingId),
  });

  const refreshBookings = () => {
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingsRoot });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.weeklyBookings });
    void queryClient.invalidateQueries({ queryKey: providerQueryKeys.dashboardAllStats });
    if (selectedBookingId) void queryClient.invalidateQueries({ queryKey: providerQueryKeys.bookingDetails(selectedBookingId) });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status: nextStatus }: { id: string; status: string }) => updateBookingStatus(id, nextStatus),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      refreshBookings();
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
      refreshBookings();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingAction(null),
  });

  const runStatusAction = (booking: Booking, action: string, nextStatus: string) => {
    setPendingAction({ id: booking._id, action });
    statusMutation.mutate({ id: booking._id, status: nextStatus });
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

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentStatus("all");
    setPaymentMethod("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const changeView = (nextView: Exclude<BookingView, "all">) => {
    setView(nextView);
    setStatus("all");
    setPage(1);
  };

  const weeklyPerformance = useMemo(() => {
    const weeklyBookings = weeklyQuery.data ?? [];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dayBookings = weeklyBookings.filter((booking) => {
        const createdAt = new Date(booking.createdAt);
        return createdAt >= date && createdAt < nextDate;
      });
      return {
        day: formatWeekdayShort(date),
        orders: dayBookings.length,
        revenue: dayBookings.filter((booking) => booking.status === "completed").reduce((sum, booking) => sum + (booking.payableAmount ?? 0), 0),
      };
    });
  }, [weeklyQuery.data]);

  const bookings = bookingsQuery.data?.data ?? [];
  const pagination = bookingsQuery.data?.pagination;
  const facets = bookingsQuery.data?.facets;
  const completedCount = facets?.statusCounts.find((item) => item._id === "completed")?.count ?? 0;
  const cancelledCount = (facets?.statusCounts.find((item) => item._id === "cancelled")?.count ?? 0) + (facets?.statusCounts.find((item) => item._id === "rejected")?.count ?? 0);
  const details = detailsQuery.data;

  // كل فلتر فعّال يصبح رقاقة مرئية قابلة للإزالة. بدونها كان المزوّد يترك
  // نطاق تاريخ مفعّلاً دون أن يراه ثم يظنّ أن طلباته اختفت.
  const chips: ActiveFilterChip[] = [
    search && { key: "search", label: `بحث: ${search}`, onRemove: () => { setSearch(""); setPage(1); } },
    status !== "all" && { key: "status", label: `الحالة: ${STATUS_MAP[status]?.label ?? status}`, onRemove: () => { setStatus("all"); setPage(1); } },
    paymentStatus !== "all" && { key: "paymentStatus", label: `الدفع: ${PAYMENT_STATUS_LABELS[paymentStatus]}`, onRemove: () => { setPaymentStatus("all"); setPage(1); } },
    paymentMethod !== "all" && { key: "paymentMethod", label: `الوسيلة: ${PAYMENT_METHOD_READ_LABELS[paymentMethod] ?? paymentMethod}`, onRemove: () => { setPaymentMethod("all"); setPage(1); } },
    dateFrom && { key: "dateFrom", label: `من: ${dateFrom}`, onRemove: () => { setDateFrom(""); setPage(1); } },
    dateTo && { key: "dateTo", label: `إلى: ${dateTo}`, onRemove: () => { setDateTo(""); setPage(1); } },
    sortBy !== "createdAt" && { key: "sortBy", label: `الفرز: ${SORT_LABELS[sortBy]}`, onRemove: () => { setSortBy("createdAt"); setPage(1); } },
    sortOrder !== "desc" && { key: "sortOrder", label: ORDER_LABELS.asc, onRemove: () => { setSortOrder("desc"); setPage(1); } },
  ].filter(Boolean) as ActiveFilterChip[];
  const hasFilters = chips.length > 0;
  const emptyIcon = view === "appointments" ? CalendarClock : view === "history" ? History : Package;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="إجمالي النتائج" value={pagination?.total ?? 0} icon={Package} />
        <StatCard title="الطلبات المكتملة" value={completedCount} icon={CheckCircle2} tone="success" />
        <StatCard title="المواعيد المجدولة" value={facets?.totals.scheduled ?? 0} icon={CalendarClock} tone="info" />
        <StatCard title="الملغاة والمرفوضة" value={cancelledCount} icon={XCircle} tone="danger" />
      </div>

      {/* بثّ الموقع: يظهر فقط حين توجد طلبات نشطة تستقبله */}
      <LocationBroadcastCard bookings={bookings} />

      <div role="tablist" aria-label="عروض الطلبات" className="flex gap-6 border-b border-border/60 overflow-x-auto">
        {TABS.map((tab) => (
          <TabButton key={tab.value} label={tab.label} active={view === tab.value} onClick={() => changeView(tab.value)} />
        ))}
      </div>

      <DataToolbar
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="ابحث برقم الطلب أو العميل أو الخدمة أو العنوان"
        searchLabel="بحث في الطلبات"
        chips={chips}
        onReset={resetFilters}
        resultCount={pagination?.total}
      >
        <Select aria-label="حالة الطلب" value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={STATUS_OPTIONS} />
        <Select aria-label="حالة الدفع" value={paymentStatus} onValueChange={(value) => { setPaymentStatus(value); setPage(1); }} options={PAYMENT_STATUS_OPTIONS} />
        <Select aria-label="طريقة الدفع" value={paymentMethod} onValueChange={(value) => { setPaymentMethod(value); setPage(1); }} options={PAYMENT_METHOD_OPTIONS} />
        <Select aria-label="الفرز حسب" value={sortBy} onValueChange={(value) => { setSortBy(value); setPage(1); }} options={SORT_OPTIONS} />
        <Select aria-label="اتجاه الفرز" value={sortOrder} onValueChange={(value) => { setSortOrder(value as "asc" | "desc"); setPage(1); }} options={ORDER_OPTIONS} />
        <div className="col-span-2 flex gap-2 md:col-span-1">
          <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="من تاريخ" />
          <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="إلى تاريخ" />
        </div>
      </DataToolbar>

      <WeeklyPerformanceChart data={weeklyPerformance} />

      {bookingsQuery.isError ? (
        <ErrorState
          title="تعذّر تحميل الطلبات"
          description="لم يستجب الخادم لطلب قائمة الحجوزات."
          onRetry={() => void bookingsQuery.refetch()}
          isRetrying={bookingsQuery.isFetching}
        />
      ) : bookingsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={emptyIcon}
            title={hasFilters ? "لا توجد نتائج مطابقة للفلاتر" : "لا توجد طلبات في هذا العرض"}
            description={hasFilters ? "جرّب توسيع نطاق البحث أو إزالة بعض الفلاتر." : "ستظهر هنا طلبات العملاء فور وصولها."}
            action={
              hasFilters ? (
                <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                  مسح الفلاتر
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onViewDetails={() => setSelectedBookingId(booking._id)}
                onStart={() => runStatusAction(booking, "start", "in_progress")}
                onComplete={() => runStatusAction(booking, "complete", "completed")}
                onCancel={() => setCancelTarget(booking)}
                pendingAction={pendingAction?.id === booking._id ? pendingAction.action : undefined}
              />
            ))}
          </div>
          <Pagination
            page={pagination?.page ?? 1}
            pages={pagination?.pages ?? 1}
            total={pagination?.total}
            onPageChange={setPage}
            disabled={bookingsQuery.isFetching}
          />
        </>
      )}

      <Dialog open={Boolean(selectedBookingId)} onOpenChange={(open) => !open && setSelectedBookingId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>بيانات الطلب كما هي مسجّلة في النظام</DialogDescription>
          </DialogHeader>
          {detailsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-6 w-full" />)}
            </div>
          ) : detailsQuery.isError || !details ? (
            <ErrorState compact description="تعذّر جلب تفاصيل هذا الطلب." onRetry={() => void detailsQuery.refetch()} />
          ) : (
            <dl className="grid gap-3 text-sm">
              <DetailRow label="رقم الطلب"><span dir="ltr" className="font-mono text-xs">{details.orderNumber}</span></DetailRow>
              <DetailRow label="الحالة"><StatusBadge status={details.status} /></DetailRow>
              <DetailRow label="الخدمة">{details.service?.name ?? "—"}</DetailRow>
              <DetailRow label="العميل">{details.user?.fullName ?? "—"}</DetailRow>
              {details.user?.phoneNumber && (
                <DetailRow label="الهاتف"><a href={`tel:${details.user.phoneNumber}`} dir="ltr" className="text-primary hover:underline">{details.user.phoneNumber}</a></DetailRow>
              )}
              <DetailRow label="المبلغ"><Money value={details.payableAmount} className="font-bold" /></DetailRow>
              <DetailRow label="الدفع">{PAYMENT_STATUS_LABELS[details.paymentStatus ?? ""] || details.paymentStatus || "—"}</DetailRow>
              <DetailRow label="أُنشئ"><RelativeTime value={details.createdAt} /></DetailRow>
              {details.isScheduled && details.scheduledAt && (
                <DetailRow label="الموعد">{formatDateTime(details.scheduledAt)}</DetailRow>
              )}
              {details.userNotes && (
                <div className="pt-1">
                  <dt className="mb-1 text-muted-foreground">ملاحظات العميل</dt>
                  <dd className="rounded-lg bg-secondary/40 p-3 leading-relaxed">{details.userNotes}</dd>
                </div>
              )}
              {details.cancellationReason && (
                <div className="pt-1">
                  <dt className="mb-1 text-muted-foreground">سبب الإلغاء</dt>
                  <dd className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-danger-soft">{details.cancellationReason}</dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => { if (!open) { setCancelTarget(null); setCancelReason(""); } }}
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

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end">{children}</dd>
    </div>
  );
}
