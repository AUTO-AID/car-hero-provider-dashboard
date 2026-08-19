import { ProviderWallet, TransactionFilters, TransactionPage } from "@/domain/entities/wallet.types";
import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";

export const getProviderWallet = () =>
  api.get("/provider/wallet/me").then((response) => unwrapApiData<ProviderWallet>(response.data));

export const getProviderTransactions = (filters: TransactionFilters = {}) =>
  api.get("/provider/wallet/transactions", { params: filters }).then((response) => unwrapApiData<TransactionPage>(response.data));

export const exportProviderTransactions = (filters: TransactionFilters = {}) =>
  api.get("/provider/wallet/transactions/export", { params: filters, responseType: "blob" }).then((response) => {
    if (typeof window === "undefined") return;
    const url = window.URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `provider-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  });

export const requestPayout = (payload: { amount: number; bankAccount: string; bankName: string }) =>
  api.post("/provider/wallet/payout", payload).then((response) => unwrapApiData(response.data));
