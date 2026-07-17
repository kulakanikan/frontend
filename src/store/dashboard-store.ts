import { create } from "zustand";
import { dashboardApi, type DashboardSummary } from "../services/api";

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  lastFetchedAt: Date | null;
  fetchSummary: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
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
}));
