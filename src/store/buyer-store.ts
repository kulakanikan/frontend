import { create } from "zustand";
import { buyersApi, type ApiBuyer } from "../services/api";

interface BuyerState {
  buyers: ApiBuyer[];
  isLoading: boolean;
  fetchBuyers: () => Promise<void>;
  addBuyer: (data: { nama: string; telepon?: string; tipe_pembeli?: string }) => Promise<ApiBuyer>;
  updateBuyer: (id: string, data: { nama?: string; telepon?: string | null; tipe_pembeli?: string }) => Promise<void>;
}

export const useBuyerStore = create<BuyerState>((set) => ({
  buyers: [],
  isLoading: false,

  fetchBuyers: async () => {
    set({ isLoading: true });
    try {
      const res = await buyersApi.list();
      set({ buyers: res.buyers, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch buyers:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  addBuyer: async (data) => {
    set({ isLoading: true });
    try {
      const res = await buyersApi.create(data);
      set((state) => ({
        buyers: [res.buyer, ...state.buyers],
        isLoading: false,
      }));
      return res.buyer;
    } catch (err) {
      console.error("Failed to add buyer:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  updateBuyer: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await buyersApi.update(id, data);
      set((state) => ({
        buyers: state.buyers.map((b) => (b.id === id ? res.buyer : b)),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to update buyer:", err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
