import { create } from "zustand";
import { marketsApi, type ApiMarket } from "../services/api";

type CreateMarketData = {
  nama_pasar: string;
  alamat: string;
  latitude: number;
  longitude: number;
  kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran";
};

interface MarketsState {
  markets: ApiMarket[];
  isLoading: boolean;
  fetchMarkets: () => Promise<void>;
  addMarket: (data: CreateMarketData) => Promise<ApiMarket>;
  updateMarket: (id: string, data: Partial<CreateMarketData>) => Promise<void>;
  deleteMarket: (id: string) => Promise<void>;
}

export const useMarketsStore = create<MarketsState>((set) => ({
  markets: [],
  isLoading: false,

  fetchMarkets: async () => {
    set({ isLoading: true });
    try {
      const res = await marketsApi.list();
      set({ markets: res.markets, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch markets:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  addMarket: async (data) => {
    set({ isLoading: true });
    try {
      const res = await marketsApi.create(data);
      set((state) => ({
        markets: [res.market, ...state.markets],
        isLoading: false,
      }));
      return res.market;
    } catch (err) {
      console.error("Failed to add market:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  updateMarket: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await marketsApi.update(id, data);
      set((state) => ({
        markets: state.markets.map((m) => (m.id === id ? res.market : m)),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to update market:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  deleteMarket: async (id) => {
    set({ isLoading: true });
    try {
      await marketsApi.delete(id);
      set((state) => ({
        markets: state.markets.filter((m) => m.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to delete market:", err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
