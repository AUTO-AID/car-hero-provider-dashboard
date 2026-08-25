import { ProviderWallet, TransactionFilters, TransactionPage } from "@/domain/entities/wallet.types";
import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";

export const getProviderWallet = () =>
  api.get("/provider/wallet/me").then((response) => unwrapApiData<ProviderWallet>(response.data));

export const getProviderTransactions = (filters: TransactionFilters = {}) =>
  api.get("/provider/wallet/transactions", { params: filters }).then((response) => unwrapApiData<TransactionPage>(response.data));
