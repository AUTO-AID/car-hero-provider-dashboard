import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { getProviderTransactions, getProviderWallet } from "./wallet.service";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

describe("wallet.service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("rewrites the legacy SAR default to the platform currency", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          balance: 16_382.78,
          pendingBalance: 488.54,
          currency: "SAR",
          isActive: true,
          summary: { totalEarnings: 2_119.5, monthlyEarnings: 86.7, openingBalance: 14_263.28, revenueTrend: [] },
        },
      },
    });

    // المحافظ المُنشأة قبل إصلاح `wallet.schema.ts` تحمل `SAR` في قاعدة
    // البيانات بينما المبالغ فيها ليرات سورية — تُصحَّح عند القراءة.
    await expect(getProviderWallet()).resolves.toMatchObject({
      balance: 16_382.78,
      currency: "SYP",
      summary: { openingBalance: 14_263.28 },
    });
    expect(mockedGet).toHaveBeenCalledWith("/provider/wallet/me");
  });

  it("leaves any other stored currency untouched", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: { balance: 10, pendingBalance: 0, currency: "USD", isActive: true, summary: {} } },
    });

    await expect(getProviderWallet()).resolves.toMatchObject({ currency: "USD" });
  });

  it("loads provider transactions with filters", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [],
          total: 0,
          pagination: { page: 1, limit: 15, pages: 0 },
        },
      },
    });

    // `type` هو ما تفلتر به الصفحة الآن: الخادم يطابق `referenceType` بقيمة
    // واحدة، فـ«ما خرج» كانت ستحتاج طلبين بينما `debit` يجمعهما بدقّة.
    await expect(getProviderTransactions({ page: 1, limit: 15, type: "debit" })).resolves.toMatchObject({ total: 0 });
    expect(mockedGet).toHaveBeenCalledWith("/provider/wallet/transactions", {
      params: { page: 1, limit: 15, type: "debit" },
    });
  });
});
