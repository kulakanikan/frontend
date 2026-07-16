/**
 * Global TypeScript type definitions for the Kulakan Ikan app.
 */

// === Auth Types ===
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "owner" | "staff" | "driver";
  avatar_url?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// === Fish & Inventory Types ===
export interface FishType {
  id: string;
  name: string;
  category: "laut" | "tawar" | "tambak" | "olahan";
  unit: "kg" | "ekor" | "pack";
  image_url?: string;
}

export interface FishStock {
  id: string;
  fish_type: FishType;
  quantity: number;
  buy_price: number;
  sell_price: number;
  supplier_id: string;
  batch_date: string;
  expiry_date?: string;
  notes?: string;
}

// === Transaction Types ===
export interface Transaction {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  items: TransactionItem[];
  total_amount: number;
  paid_amount: number;
  payment_status: "paid" | "partial" | "unpaid";
  payment_method: "cash" | "transfer" | "qris";
  notes?: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  fish_stock_id: string;
  fish_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// === Customer & Supplier Types ===
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  total_debt: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  total_payable: number;
  created_at: string;
}

// === API Response Types ===
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// === Navigation Types ===
export type RootStackParamList = {
  "(tabs)": undefined;
  "(auth)/login": undefined;
  "(auth)/register": undefined;
};
