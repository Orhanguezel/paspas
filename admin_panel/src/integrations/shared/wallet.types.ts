// =============================================================
// FILE: src/integrations/shared/wallet.types.ts
// =============================================================

export type WalletStatus = 'active' | 'suspended' | 'closed';
export type WalletTxType = 'credit' | 'debit';
export type WalletTxStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface WalletAdminView {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  balance: string;
  total_earnings: string;
  total_withdrawn: string;
  currency: string;
  status: WalletStatus;
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionView {
  id: string;
  wallet_id: string;
  user_id: string;
  type: WalletTxType;
  amount: string;
  currency: string;
  purpose: string;
  description: string | null;
  payment_status: WalletTxStatus;
  transaction_ref: string | null;
  is_admin_created: number;
  created_at: string;
}

export interface WalletListResponse {
  data: WalletAdminView[];
  page: number;
  limit: number;
  total: number;
}

export interface WalletTransactionListResponse {
  data: WalletTransactionView[];
  page: number;
  limit: number;
  total: number;
}

export interface WalletAdjustPayload {
  user_id: string;
  type: WalletTxType;
  amount: number;
  purpose: string;
  description?: string;
  payment_status?: WalletTxStatus;
}

export interface WalletStatusPayload {
  status: WalletStatus;
}

export interface WalletTxStatusPayload {
  payment_status: WalletTxStatus;
}
