import { create } from "zustand";
import { salesApi, paymentsApi, type ApiSale, type ApiSaleDetail } from "../services/api";

interface CreateSalePayload {
  batch_id: string;
  buyer_id: string;
  berat_jual: number;
  harga_satuan: number;
  status_bayar: "lunas" | "tempo";
  tanggal: string;
  extras?: Array<{ nama_item: string; jumlah: number; harga_satuan: number }>;
}

interface AddPaymentPayload {
  jumlah_bayar: number;
  metode_bayar: string;
  dibayar_at?: string;
}

interface TransactionState {
  sales: ApiSale[];
  isLoading: boolean;
  fetchSales: (params?: { status_bayar?: string; buyer_id?: string; batch_id?: string }) => Promise<void>;
  fetchSaleDetail: (id: string) => Promise<ApiSaleDetail>;
  createSale: (data: CreateSalePayload) => Promise<ApiSale>;
  addPayment: (saleId: string, data: AddPaymentPayload) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  sales: [],
  isLoading: false,

  fetchSales: async (params) => {
    set({ isLoading: true });
    try {
      const res = await salesApi.list(params);
      set({ sales: res.sales, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  fetchSaleDetail: async (id) => {
    set({ isLoading: true });
    try {
      const res = await salesApi.get(id);
      set({ isLoading: false });
      return res.sale;
    } catch (err) {
      console.error("Failed to fetch sale detail:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  createSale: async (data) => {
    set({ isLoading: true });
    try {
      const res = await salesApi.create(data);
      set((state) => ({
        sales: [res.sale, ...state.sales],
        isLoading: false,
      }));
      return res.sale;
    } catch (err) {
      console.error("Failed to create sale:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  addPayment: async (saleId, data) => {
    set({ isLoading: true });
    try {
      const res = await paymentsApi.create(saleId, data);
      
      // If the backend indicates that the status has updated to lunas
      if (res.sale_status_updated) {
        set((state) => ({
          sales: state.sales.map((s) =>
            s.id === saleId ? { ...s, statusBayar: "lunas" } : s
          ),
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Failed to add payment:", err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
