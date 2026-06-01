"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilterX,
  History,
  Package,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookingCard } from "./components/booking-card";
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدي",
  wallet: "المحفظة",
  card: "بطاقة",
  points: "نقاط",
};

function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.";
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Package }) {
  return (
    <Card className="border-border/30 bg-card/60 p-4 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-lg font-black text-white tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
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
    queryKey: ["provider-bookings", filters],
    queryFn: () => getProviderBookings(filters),
    placeholderData: keepPreviousData,
  });

  const weeklyQuery = useQuery({
    queryKey: ["provider-bookings-weekly"],
    queryFn: getProviderWeeklyActivity,
  });

  const detailsQuery = useQuery({
    queryKey: ["provider-booking-details", selectedBookingId],
    queryFn: () => getBookingDetails(selectedBookingId!),
    enabled: Boolean(selectedBookingId),
  });

  const refreshBookings = () => {
    void queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["provider-bookings-weekly"] });
    if (selectedBookingId) void queryClient.invalidateQueries({ queryKey: ["provider-booking-details", selectedBookingId] });
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
        day: date.toLocaleDateString("ar-SY", { weekday: "short" }),
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
  const hasFilters = Boolean(search || status !== "all" || paymentStatus !== "all" || paymentMethod !== "all" || dateFrom || dateTo || sortBy !== "createdAt" || sortOrder !== "desc");
  const details = detailsQuery.data;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Calendar className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gradient">الطلبات والمواعيد</h1>
            <p className="text-sm text-muted-foreground mt-0.5">إدارة طلبات العملاء ومواعيد الخدمة ومتابعة التنفيذ</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={refreshBookings} disabled={bookingsQuery.isFetching}>
          <RefreshCw className={bookingsQuery.isFetching ? "animate-spin" : ""} /> تحديث
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="إجمالي النتائج" value={pagination?.total ?? 0} icon={Package} />
        <MetricCard label="الطلبات المكتملة" value={completedCount} icon={CheckCircle2} />
        <MetricCard label="المواعيد المجدولة" value={facets?.totals.scheduled ?? 0} icon={CalendarClock} />
        <MetricCard label="الملغاة والمرفوضة" value={cancelledCount} icon={XCircle} />
      </div>

      <div className="flex gap-6 border-b border-border/30 overflow-x-auto">
        {TABS.map((tab) => (
          <TabButton key={tab.value} label={tab.label} active={view === tab.value} onClick={() => changeView(tab.value)} />
        ))}
      </div>

      <Card className="border-border/30 bg-card/50 p-4 rounded-xl">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="ابحث برقم الطلب أو العميل أو الخدمة أو العنوان" className="pr-10" />
          </label>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
            <option value="all">كل الحالات</option>
            {Object.entries(STATUS_MAP).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
          </select>
          <select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
            <option value="all">كل حالات الدفع</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
            <option value="all">كل طرق الدفع</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
            <option value="createdAt">الفرز حسب تاريخ الإنشاء</option>
            <option value="scheduledAt">الفرز حسب الموعد</option>
            <option value="amount">الفرز حسب المبلغ</option>
            <option value="status">الفرز حسب الحالة</option>
          </select>
          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as "asc" | "desc"); setPage(1); }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
            <option value="desc">الأحدث أولاً</option>
            <option value="asc">الأقدم أولاً</option>
          </select>
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="من تاريخ" />
            <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="إلى تاريخ" />
          </div>
        </div>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="mt-3 text-muted-foreground">
            <FilterX /> مسح الفلاتر
          </Button>
        )}
      </Card>

      <WeeklyPerformanceChart data={weeklyPerformance} />

      {bookingsQuery.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center rounded-xl">
          <p className="text-sm text-destructive">تعذر تحميل الطلبات من الخادم.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => bookingsQuery.refetch()}><RefreshCw /> إعادة المحاولة</Button>
        </Card>
      ) : bookingsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }, (_, index) => <Card key={index} className="h-64 animate-pulse bg-card/50 border-border/20 rounded-xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-3 border-dashed border-border/40 bg-secondary/10 rounded-xl">
          {view === "appointments" ? <CalendarClock className="size-8 text-muted-foreground/40" /> : view === "history" ? <History className="size-8 text-muted-foreground/40" /> : <Package className="size-8 text-muted-foreground/40" />}
          <p className="text-sm font-semibold text-muted-foreground">لا توجد نتائج مطابقة.</p>
          {hasFilters && <Button type="button" variant="outline" size="sm" onClick={resetFilters}><FilterX /> مسح الفلاتر</Button>}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onViewDetails={() => setSelectedBookingId(booking._id)}
                onAccept={() => runStatusAction(booking, "accept", "accepted")}
                onStart={() => runStatusAction(booking, "start", "in_progress")}
                onComplete={() => runStatusAction(booking, "complete", "completed")}
                onCancel={() => setCancelTarget(booking)}
                pendingAction={pendingAction?.id === booking._id ? pendingAction.action : undefined}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">صفحة {pagination?.page ?? 1} من {Math.max(pagination?.pages ?? 1, 1)}، بإجمالي {pagination?.total ?? 0} نتيجة</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={(pagination?.page ?? 1) <= 1} onClick={() => setPage((current) => current - 1)}><ChevronRight /> السابق</Button>
              <Button type="button" variant="outline" size="sm" disabled={(pagination?.page ?? 1) >= (pagination?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}>التالي <ChevronLeft /></Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={Boolean(selectedBookingId)} onOpenChange={(open) => !open && setSelectedBookingId(null)}>
        <DialogContent className="max-w-lg bg-card border-border/50 text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>بيانات الطلب المسجلة في قاعدة البيانات</DialogDescription>
          </DialogHeader>
          {detailsQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-lg bg-secondary/40" />
          ) : detailsQuery.isError || !details ? (
            <p className="text-sm text-destructive">تعذر تحميل تفاصيل الطلب.</p>
          ) : (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">رقم الطلب</span><span dir="ltr">{details.orderNumber}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">الحالة</span><StatusBadge status={details.status} /></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">الخدمة</span><span>{details.service?.name}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">العميل</span><span>{details.user?.fullName}</span></div>
              {details.user?.phoneNumber && <div className="flex items-center justify-between"><span className="text-muted-foreground">الهاتف</span><span dir="ltr">{details.user.phoneNumber}</span></div>}
              <div className="flex items-center justify-between"><span className="text-muted-foreground">المبلغ</span><span>{(details.payableAmount ?? 0).toLocaleString("ar-SY")} ل.س</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">الدفع</span><span>{PAYMENT_STATUS_LABELS[details.paymentStatus ?? ""] || details.paymentStatus || "-"}</span></div>
              {details.isScheduled && details.scheduledAt && <div className="flex items-center justify-between"><span className="text-muted-foreground">الموعد</span><span>{new Date(details.scheduledAt).toLocaleString("ar-SY")}</span></div>}
              {details.userNotes && <div><p className="text-muted-foreground mb-1">ملاحظات العميل</p><p className="rounded-lg bg-secondary/30 p-3">{details.userNotes}</p></div>}
              {details.cancellationReason && <div><p className="text-muted-foreground mb-1">سبب الإلغاء</p><p className="rounded-lg bg-destructive/10 p-3 text-destructive">{details.cancellationReason}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md bg-card border-border/50 text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>إلغاء الطلب</DialogTitle>
            <DialogDescription>سيتم حفظ السبب في سجل الطلب وإبلاغ العميل.</DialogDescription>
          </DialogHeader>
          <Textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="اكتب سبب الإلغاء..." rows={4} />
          <DialogFooter className="flex-row gap-2 justify-start">
            <Button type="button" variant="destructive" onClick={submitCancellation} disabled={cancelMutation.isPending}>تأكيد الإلغاء</Button>
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>تراجع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
