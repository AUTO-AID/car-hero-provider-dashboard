import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { getProviderTransactions, requestPayout } from "./wallet.service";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

describe("wallet.service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it("requests a provider payout through the payout endpoint", async () => {
    const payload = { amount: 25000, bankAccount: "SY123", bankName: "Main Bank" };
    mockedPost.mockResolvedValueOnce({ data: { success: true, data: { message: "Payout request submitted" } } });

    await expect(requestPayout(payload)).resolves.toEqual({ message: "Payout request submitted" });
    expect(mockedPost).toHaveBeenCalledWith("/provider/wallet/payout", payload);
  });

  it("loads provider transactions with filters", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [],
          total: 0,
          pagination: { page: 1, limit: 10, pages: 0 },
        },
      },
    });

    await expect(getProviderTransactions({ page: 1, limit: 10, status: "completed" })).resolves.toMatchObject({ total: 0 });
    expect(mockedGet).toHaveBeenCalledWith("/provider/wallet/transactions", {
      params: { page: 1, limit: 10, status: "completed" },
    });
  });
});

