import { api } from "./api";

export interface WalletResponse {
  balance: number;
  userId: string;
  userRole: string;
}

export interface TransactionResponse {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserId: string;
  toUserEmail: string;
  amount: number;
  bookingId: string;
  createdAt: string;
  type: "debit" | "credit";
}

export const walletService = {
  getBalance: async () => {
    const response = await api.get<WalletResponse>("/api/v1/wallet/balance");
    return response.data;
  },

  getTransactions: async (limit = 50) => {
    const response = await api.get<TransactionResponse[]>("/api/v1/wallet/transactions", {
      params: { limit },
    });
    return response.data;
  },

  getReceivedTransactions: async (limit = 50) => {
    const response = await api.get<TransactionResponse[]>("/api/v1/wallet/transactions/received", {
      params: { limit },
    });
    return response.data;
  },

  getSentTransactions: async (limit = 50) => {
    const response = await api.get<TransactionResponse[]>("/api/v1/wallet/transactions/sent", {
      params: { limit },
    });
    return response.data;
  },
};
