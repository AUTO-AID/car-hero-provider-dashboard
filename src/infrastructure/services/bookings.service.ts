import { api } from "../api/client";

export const getProviderBookings = (tab: "current" | "history") =>
  api.get("/orders", { params: { limit: 100 } }).then((res) => {
    const payload = res.data?.data ?? res.data;
    const orders = payload?.orders ?? (Array.isArray(payload) ? payload : []);
    if (tab === "current") {
      return {
        data: orders.filter((o: any) =>
          ["pending", "accepted", "in_progress"].includes(o.status)
        ),
      };
    } else {
      return {
        data: orders.filter((o: any) =>
          ["completed", "cancelled"].includes(o.status)
        ),
      };
    }
  });

export const updateBookingStatus = (bookingId: string, status: string) =>
  api.patch(`/orders/${bookingId}/status`, { status }).then((res) => res.data);
