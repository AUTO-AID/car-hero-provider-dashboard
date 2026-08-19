import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { cancelBooking, getProviderBookings, updateBookingStatus } from "./bookings.service";

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

  it("loads current provider bookings with the current status filter", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          orders: [{ _id: "order-1", status: "pending", createdAt: "2026-06-19T00:00:00.000Z", serviceName: "Towing" }],
          pagination: { total: 1, page: 1, limit: 9, pages: 1 },
        },
      },
    });

    const result = await getProviderBookings({ view: "current", page: 1, limit: 9 });

    expect(mockedGet).toHaveBeenCalledWith("/orders", {
      params: expect.objectContaining({
        page: 1,
        limit: 9,
        statuses: "pending,accepted,provider_assigned,provider_en_route,provider_arrived,in_progress",
      }),
    });
    expect(result.data[0]).toMatchObject({ _id: "order-1", status: "pending", service: { name: "Towing" } });
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

