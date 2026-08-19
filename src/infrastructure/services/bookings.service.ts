import { Booking, BookingFacets, BookingPagination } from "@/domain/entities/booking.types";
import { normalizeBooking, BookingDto } from "@/infrastructure/adapters/booking.adapter";
import { api } from "../api/client";
import { isRecord } from "../api/types";
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

  const payload = unwrapApiData<unknown>(response.data);
  const orders = getOrdersFromPayload(payload);

  return {
    data: orders.map(normalizeBooking),
    pagination: getPayloadValue<BookingPagination>(payload, "pagination"),
    facets: getPayloadValue<BookingFacets>(payload, "facets"),
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

