import { api } from "../api/client";

export const getProviderWallet = () =>
  api.get("/provider/wallet/me").then((res) => res.data);

export const getProviderTransactions = () =>
  api.get("/provider/wallet/transactions?limit=20").then((res) => res.data);

export const requestPayout = (payload: { amount: number; bankAccount: string; bankName: string }) =>
  api.post("/provider/wallet/payout", payload).then((res) => res.data);
