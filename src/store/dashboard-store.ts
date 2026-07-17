import { create } from "zustand";
import { dashboardApi, type DashboardSummary } from "../services/api";

interface DashboardState {
  summary: DashboardSummary | null;
  aiSummary: string | null;
  isLoading: boolean;
  isLoadingAi: boolean;
  lastFetchedAt: Date | null;
  fetchSummary: () => Promise<void>;
  fetchAiSummary: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  aiSummary: null,
  isLoading: false,
  isLoadingAi: false,
  lastFetchedAt: null,

  fetchSummary: async () => {
    set({ isLoading: true });
    try {
      const summary = await dashboardApi.summary();
      set({
        summary,
        isLoading: false,
        lastFetchedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to fetch dashboard summary:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  fetchAiSummary: async () => {
    set({ isLoadingAi: true });
    try {
      const data = await dashboardApi.aiSummary();
      set({
        aiSummary: data.summary,
        isLoadingAi: false,
      });
    } catch (err) {
      console.error("Failed to fetch AI summary:", err);
      set({
        isLoadingAi: false,
        aiSummary: "Gagal memuat ringkasan bisnis AI saat ini. Silakan coba beberapa saat lagi.",
      });
    }
  },
}));
