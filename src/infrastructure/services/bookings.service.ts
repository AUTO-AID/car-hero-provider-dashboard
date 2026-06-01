import { Booking, BookingFacets, BookingPagination } from "@/domain/entities/booking.types";
import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";

export type BookingView = "current" | "history" | "appointments" | "all";

export interface BookingFilters {
  view?: BookingView;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const CURRENT_STATUSES = [
  "pending",
  "accepted",
  "provider_assigned",
  "provider_en_route",
  "provider_arrived",
  "in_progress",
];

const HISTORY_STATUSES = ["completed", "cancelled", "rejected"];

// Orders arrive from a compatibility API that serves both historical and current shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBooking(order: any): Booking {
  const amount =
    order.payableAmount ??
    order.total ??
    order.totalAmount ??
    order.servicePrice ??
    0;

  return {
    ...order,
    _id: order._id ?? order.id,
    payableAmount: amount,
    total: amount,
    location: order.location ?? order.userLocation,
    service: order.service ?? {
      name: order.serviceName ?? order.serviceId ?? "خدمة غير معروفة",
    },
    user: order.user ?? {
      fullName: order.userName ?? order.userId ?? "عميل غير معروف",
    },
    vehicle: order.vehicle,
  };
}

function statusesForView(view: BookingView, status?: string) {
  if (status && status !== "all") return status;
  if (view === "current") return CURRENT_STATUSES.join(",");
  if (view === "history") return HISTORY_STATUSES.join(",");
  return undefined;
}

export async function getProviderBookings(filters: BookingFilters = {}): Promise<{
  data: Booking[];
  pagination?: BookingPagination;
  facets?: BookingFacets;
}> {
  const { view = "current", status, ...rest } = filters;
  const endpoint = view === "appointments" ? "/bookings" : "/orders";
  const response = await api.get(endpoint, {
    params: {
      ...rest,
      statuses: statusesForView(view, status),
      status: status && status !== "all" ? status : undefined,
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = unwrapApiData<any>(response.data);
  const orders = payload?.orders ?? (Array.isArray(payload) ? payload : []);

  return {
    data: orders.map(normalizeBooking),
    pagination: payload?.pagination as BookingPagination | undefined,
    facets: payload?.facets as BookingFacets | undefined,
  };
}

export async function getProviderWeeklyActivity() {
  const dateFrom = new Date();
  dateFrom.setHours(0, 0, 0, 0);
  dateFrom.setDate(dateFrom.getDate() - 6);
  const dateTo = new Date();
  const limit = 100;
  const firstPage = await getProviderBookings({
    view: "all",
    page: 1,
    limit,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  });
  const pages = firstPage.pagination?.pages ?? 1;

  if (pages <= 1) return firstPage.data;

  const remainingPages = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      getProviderBookings({
        view: "all",
        page: index + 2,
        limit,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.data);
}

export const getBookingDetails = (bookingId: string) =>
  api.get(`/orders/${bookingId}`).then((response) => normalizeBooking(unwrapApiData(response.data)));

export const updateBookingStatus = (bookingId: string, status: string) =>
  api.patch(`/orders/${bookingId}/status`, { status }).then((response) => unwrapApiData(response.data));

export const cancelBooking = (bookingId: string, reason: string) =>
  api.post(`/orders/${bookingId}/cancel`, { reason, cancelledBy: "provider" }).then((response) => unwrapApiData(response.data));
