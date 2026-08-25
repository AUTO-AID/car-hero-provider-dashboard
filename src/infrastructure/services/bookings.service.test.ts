import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import {
  cancelBooking,
  getProviderOrders,
  getProviderOrdersSummary,
  updateBookingStatus,
} from "./bookings.service";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPatch = vi.mocked(api.patch);
const mockedPost = vi.mocked(api.post);

describe("bookings.service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  it("translates the active group into the open-order status list", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          orders: [{ _id: "order-1", status: "pending", createdAt: "2026-06-19T00:00:00.000Z", serviceName: "Towing" }],
          pagination: { total: 1, page: 1, limit: 15, pages: 1 },
        },
      },
    });

    const result = await getProviderOrders({ group: "active", page: 1, limit: 15 });

    expect(mockedGet).toHaveBeenCalledWith("/orders", {
      params: expect.objectContaining({
        page: 1,
        limit: 15,
        sortBy: "createdAt",
        sortOrder: "desc",
        statuses: "pending,accepted,provider_assigned,provider_en_route,provider_arrived,in_progress",
      }),
    });
    expect(result.data[0]).toMatchObject({ _id: "order-1", status: "pending", service: { name: "Towing" } });
  });

  it("asks a single endpoint for scheduled appointments and sorts them by the appointment itself", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: { orders: [], pagination: { total: 0, page: 1, limit: 15, pages: 0 } } },
    });

    await getProviderOrders({ group: "scheduled", sort: "soonest" });

    expect(mockedGet).toHaveBeenCalledWith("/orders", {
      params: expect.objectContaining({
        isScheduled: "true",
        sortBy: "scheduledAt",
        sortOrder: "asc",
      }),
    });
  });

  it("builds group counters from the unfiltered facets rather than the current page", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          orders: [],
          pagination: { total: 40, page: 1, limit: 1, pages: 40 },
          facets: {
            statusCounts: [
              { _id: "pending", count: 2, revenue: 0 },
              { _id: "in_progress", count: 1, revenue: 0 },
              { _id: "completed", count: 33, revenue: 990_000 },
              { _id: "cancelled", count: 3, revenue: 0 },
              { _id: "rejected", count: 1, revenue: 0 },
            ],
            paymentCounts: [],
            paymentMethods: [],
            services: [],
            totals: { revenue: 1_000_000, avgAmount: 25_000, scheduled: 5 },
          },
        },
      },
    });

    await expect(getProviderOrdersSummary({})).resolves.toEqual({
      total: 40,
      active: 3,
      scheduled: 5,
      completed: 33,
      cancelled: 4,
      // إيراد المكتملة وحدها — لا `totals.revenue` الذي يجمع الملغاة معها
      completedRevenue: 990_000,
    });

    expect(mockedGet).toHaveBeenCalledWith("/orders", {
      params: expect.objectContaining({ limit: 1 }),
    });
    expect(mockedGet.mock.calls[0][1]?.params).not.toHaveProperty("statuses");
  });

  it("updates booking status through the status endpoint", async () => {
    mockedPatch.mockResolvedValueOnce({ data: { success: true, data: { status: "accepted" } } });

    await expect(updateBookingStatus("order-1", "accepted")).resolves.toEqual({ status: "accepted" });
    expect(mockedPatch).toHaveBeenCalledWith("/orders/order-1/status", { status: "accepted" });
  });

  it("cancels bookings through the cancel endpoint with provider ownership metadata", async () => {
    mockedPost.mockResolvedValueOnce({ data: { success: true, data: { status: "cancelled" } } });

    await expect(cancelBooking("order-1", "Provider is unavailable")).resolves.toEqual({ status: "cancelled" });
    expect(mockedPost).toHaveBeenCalledWith("/orders/order-1/cancel", {
      reason: "Provider is unavailable",
      cancelledBy: "provider",
    });
  });
});
