import { create } from "zustand";
import { suppliersApi, type ApiSupplier } from "../services/api";

interface SupplierState {
  suppliers: ApiSupplier[];
  isLoading: boolean;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (data: { nama_nelayan: string; telepon?: string; alamat?: string }) => Promise<ApiSupplier>;
  updateSupplier: (id: string, data: Partial<{ nama_nelayan: string; telepon: string | null; alamat: string | null }>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  isLoading: false,

  fetchSuppliers: async () => {
    set({ isLoading: true });
    try {
      const res = await suppliersApi.list();
      set({ suppliers: res.suppliers, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  addSupplier: async (data) => {
    set({ isLoading: true });
    try {
      const res = await suppliersApi.create(data);
      set((state) => ({
        suppliers: [res.supplier, ...state.suppliers],
        isLoading: false,
      }));
      return res.supplier;
    } catch (err) {
      console.error("Failed to add supplier:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  updateSupplier: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await suppliersApi.update(id, data);
      set((state) => ({
        suppliers: state.suppliers.map((s) => (s.id === id ? res.supplier : s)),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to update supplier:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  deleteSupplier: async (id) => {
    set({ isLoading: true });
    try {
      await suppliersApi.delete(id);
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
