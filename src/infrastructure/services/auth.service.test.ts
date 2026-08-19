import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { providerLogin, providerLogout, refreshProviderToken } from "./auth.service";

vi.mock("../api/client", () => ({
  api: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(api.post);

describe("auth.service", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it("logs in with phone number and password and unwraps enveloped auth data", async () => {
    const authPayload = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { _id: "user-1", fullName: "Provider", phoneNumber: "+9639", accountType: "provider" },
    };
    mockedPost.mockResolvedValueOnce({ data: { success: true, data: authPayload } });

    await expect(providerLogin("+9639", "secret")).resolves.toEqual(authPayload);
    expect(mockedPost).toHaveBeenCalledWith("/auth/login", { phoneNumber: "+9639", password: "secret" });
  });

  it("refreshes the provider token with the backend refresh-token contract", async () => {
    const authPayload = {
      accessToken: "new-access",
      refreshToken: "new-refresh",
      user: { _id: "user-1", fullName: "Provider", phoneNumber: "+9639", accountType: "provider" },
    };
    mockedPost.mockResolvedValueOnce({ data: authPayload });

    await expect(refreshProviderToken("old-refresh")).resolves.toEqual(authPayload);
    expect(mockedPost).toHaveBeenCalledWith("/auth/refresh-token", { refreshToken: "old-refresh" });
  });

  it("calls logout through the authenticated API client", async () => {
    mockedPost.mockResolvedValueOnce({ data: { message: "Logged out" } });

    await expect(providerLogout()).resolves.toEqual({ message: "Logged out" });
    expect(mockedPost).toHaveBeenCalledWith("/auth/logout");
  });
});

