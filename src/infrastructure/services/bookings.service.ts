import { Booking, BookingFacets, BookingPagination } from "@/domain/entities/booking.types";
import { normalizeBooking, BookingDto } from "@/infrastructure/adapters/booking.adapter";
import { api } from "../api/client";
import { isRecord } from "../api/types";
import { unwrapApiData } from "../api/unwrap";

/**
 * مجموعات الطلبات كما يفكّر بها صاحب الورشة — لا كما تُسمّى في قاعدة البيانات.
 *
 * كانت الشاشة تقسّم الطلبات إلى ثلاثة «عروض» (`current`/`appointments`/`history`)
 * موزّعة على نقطتَي نهاية مختلفتين، وفوقها قائمة حالات من تسعة خيارات — فكان
 * على المزوّد أن يعرف الفرق بين «تم التعيين» و«في الطريق» ليجد طلباً.
 * المجموعات الخمس تغطّي المعنى كلّه بنقرة واحدة، ونقطة النهاية صارت واحدة.
 */
export type OrderGroup = "all" | "active" | "scheduled" | "completed" | "cancelled";

export type OrderSortKey = "newest" | "oldest" | "soonest" | "latest" | "amount";

export interface OrderQuery {
  group?: OrderGroup;
  page?: number;
  limit?: number;
  search?: string;
  /** ISO — يُطابَق على `createdAt` في الخادم */
  dateFrom?: string;
  dateTo?: string;
  sort?: OrderSortKey;
}

/** الطلبات التي ما تزال على الطاولة: وصلت ولم تُغلق بعد. */
export const ACTIVE_STATUSES = [
  "pending",
  "accepted",
  "provider_assigned",
  "provider_en_route",
  "provider_arrived",
  "in_progress",
] as const;

export const CANCELLED_STATUSES = ["cancelled", "rejected"] as const;

const SORTS: Record<OrderSortKey, { sortBy: string; sortOrder: "asc" | "desc" }> = {
  newest: { sortBy: "createdAt", sortOrder: "desc" },
  oldest: { sortBy: "createdAt", sortOrder: "asc" },
  soonest: { sortBy: "scheduledAt", sortOrder: "asc" },
  latest: { sortBy: "scheduledAt", sortOrder: "desc" },
  amount: { sortBy: "amount", sortOrder: "desc" },
};

/** ترجمة المجموعة إلى الوسائط التي يفهمها `GET /orders`. */
function groupParams(group: OrderGroup) {
  switch (group) {
    case "active":
      return { statuses: ACTIVE_STATUSES.join(",") };
    case "scheduled":
      // `isScheduled=true` على `/orders` يعطي ما تعطيه `/bookings` بالضبط،
      // فسقطت الحاجة إلى نقطة نهاية ثانية ومسار شيفرة ثانٍ معها.
      return { isScheduled: "true" };
    case "completed":
      return { statuses: "completed" };
    case "cancelled":
      return { statuses: CANCELLED_STATUSES.join(",") };
    default:
      return {};
  }
}

export interface OrdersPage {
  data: Booking[];
  pagination?: BookingPagination;
  facets?: BookingFacets;
}

export async function getProviderOrders(query: OrderQuery = {}): Promise<OrdersPage> {
  const { group = "all", sort = "newest", page = 1, limit = 15, search, dateFrom, dateTo } = query;

  const response = await api.get("/orders", {
    params: {
      page,
      limit,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      ...SORTS[sort],
      ...groupParams(group),
    },
  });

  const payload = unwrapApiData<unknown>(response.data);

  return {
    data: getOrdersFromPayload(payload).map(normalizeBooking),
    pagination: getPayloadValue<BookingPagination>(payload, "pagination"),
    facets: getPayloadValue<BookingFacets>(payload, "facets"),
  };
}

export interface OrdersSummary {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  /** إيراد الطلبات المكتملة وحدها — لا مجموع كل ما مرّ في القائمة */
  completedRevenue: number;
}

export const EMPTY_ORDERS_SUMMARY: OrdersSummary = {
  total: 0,
  active: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
  completedRevenue: 0,
};

/**
 * عدّادات المجموعات الخمس ضمن نطاق البحث والفترة الحاليَّين.
 *
 * تُطلب بلا فلتر حالة وبـ `limit=1`: مراحل `$facet` في الخادم تُحسب على
 * المطابقة كاملةً لا على الصفحة، فرقاقة «مكتملة ٣١» تبقى صحيحة بينما
 * المعروض أمامك هو مجموعة «جارية». ولو حُسبت من الصفحة نفسها لتغيّر كل
 * عدّاد كلّما نقر المزوّد رقاقةً أخرى — وهو ما يجعل الأرقام تبدو معطوبة.
 */
export async function getProviderOrdersSummary(
  query: Pick<OrderQuery, "search" | "dateFrom" | "dateTo"> = {},
): Promise<OrdersSummary> {
  const { facets, pagination } = await getProviderOrders({ ...query, group: "all", page: 1, limit: 1 });
  if (!facets) return { ...EMPTY_ORDERS_SUMMARY, total: pagination?.total ?? 0 };

  const countOf = (statuses: readonly string[]) =>
    facets.statusCounts
      .filter((entry) => statuses.includes(entry._id))
      .reduce((sum, entry) => sum + (entry.count ?? 0), 0);

  const completedFacet = facets.statusCounts.find((entry) => entry._id === "completed");

  return {
    total: pagination?.total ?? 0,
    active: countOf(ACTIVE_STATUSES),
    scheduled: facets.totals?.scheduled ?? 0,
    completed: completedFacet?.count ?? 0,
    cancelled: countOf(CANCELLED_STATUSES),
    completedRevenue: completedFacet?.revenue ?? 0,
  };
}

export const getBookingDetails = (bookingId: string) =>
  api.get(`/orders/${bookingId}`).then((response) => normalizeBooking(unwrapApiData<BookingDto>(response.data)));

export const updateBookingStatus = (bookingId: string, status: string) =>
  api.patch(`/orders/${bookingId}/status`, { status }).then((response) => unwrapApiData(response.data));

export const cancelBooking = (bookingId: string, reason: string) =>
  api.post(`/orders/${bookingId}/cancel`, { reason, cancelledBy: "provider" }).then((response) => unwrapApiData(response.data));

function getOrdersFromPayload(payload: unknown): BookingDto[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload) && Array.isArray(payload.orders)) return payload.orders.filter(isRecord);
  return [];
}

function getPayloadValue<T>(payload: unknown, key: string): T | undefined {
  return isRecord(payload) && key in payload ? (payload[key] as T) : undefined;
}
