import { create } from "zustand";
import { deliverySchedulesApi, type ApiDeliverySchedule } from "../services/api";

interface DeliveryState {
  schedules: ApiDeliverySchedule[];
  isLoading: boolean;
  fetchSchedules: () => Promise<void>;
  addSchedule: (
    saleId: string,
    data: { scheduled_at: string; catatan?: string }
  ) => Promise<ApiDeliverySchedule>;
  deleteSchedule: (id: string) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  schedules: [],
  isLoading: false,

  fetchSchedules: async () => {
    set({ isLoading: true });
    try {
      const res = await deliverySchedulesApi.list();
      set({ schedules: res.schedules, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  addSchedule: async (saleId, data) => {
    set({ isLoading: true });
    try {
      const res = await deliverySchedulesApi.create(saleId, data);
      set((state) => ({
        schedules: [res.schedule, ...state.schedules],
        isLoading: false,
      }));
      return res.schedule;
    } catch (err) {
      console.error("Failed to add schedule:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  deleteSchedule: async (id) => {
    set({ isLoading: true });
    try {
      await deliverySchedulesApi.delete(id);
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
