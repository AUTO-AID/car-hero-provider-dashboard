export interface RevenueTrendPoint {
  date: string;
  amount: number;
  count: number;
}

export interface TransactionBreakdown {
  kind: string;
  count: number;
  amount: number;
}

export interface ProviderFinancialSummary {
  transactionCount: number;
  totalEarnings: number;
  monthlyEarnings: number;
  completedWithdrawals: number;
  pendingPayouts: number;
  openingBalance: number;
  minimumPayout: number;
  revenueTrend: RevenueTrendPoint[];
  breakdown: TransactionBreakdown[];
}

export interface ProviderWallet {
  balance: number;
  pendingBalance: number;
  currency: string;
  isActive: boolean;
  summary: ProviderFinancialSummary;
}

export interface Transaction {
  _id: string;
  id?: string;
  transactionNumber: string;
  type: string;
  amount: number;
  status: string;
  referenceType?: string;
  referenceId?: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: string;
  createdAt: string | number | Date;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  referenceType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TransactionPage {
  data: Transaction[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    pages: number;
  };
}
