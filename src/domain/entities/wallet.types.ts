export interface ProviderWallet {
  balance: number;
  totalEarnings: number;
  pendingPayouts?: number;
}

export interface Transaction {
  _id: string;
  type: string;
  amount?: number;
  status?: string;
  createdAt: string | number | Date;
}
