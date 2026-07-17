import { create } from "zustand";
import { FishStock, Customer, Transaction, FishType, AddOn } from "../types";
import { batchesApi, buyersApi, salesApi, batchExpensesApi, ApiBatch, ApiBuyer, ApiSale } from "../services/api";

interface FishState {
  fishStocks: FishStock[];
  customers: Customer[];
  transactions: Transaction[];
  isLoading: boolean;
  
  fetchStocks: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchAll: () => Promise<void>;
  
  addStock: (stock: Omit<FishStock, "id">) => Promise<FishStock>;
  editStock: (id: string, updated: Partial<Omit<FishStock, "id">>) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  addAddonToStock: (stockId: string, name: string, price: number) => Promise<void>;
  addCustomer: (customer: Omit<Customer, "id" | "total_debt" | "created_at">) => Promise<Customer>;
  addTransaction: (transaction: Omit<Transaction, "id" | "invoice_number" | "created_at">) => Promise<void>;
}

// Helpers to map API models to local types
const mapBatchToStock = (batch: ApiBatch): FishStock => ({
  id: batch.id,
  fish_type: {
    id: batch.jenisIkan,
    name: batch.jenisIkan,
    category: "laut",
    unit: "kg",
  },
  quantity: Number(batch.berat),
  buy_price: Number(batch.hargaBeliPerKg),
  sell_price: Number(batch.hargaBeliPerKg) * 1.2, // Default mock sell price, UI will overwrite
  supplier_id: batch.supplierId,
  batch_date: batch.diterimaAt.split("T")[0],
  notes: batch.kondisiKualitas || undefined,
  addons: [], // We need a way to fetch expenses or just keep it empty initially
});

const mapBuyerToCustomer = (buyer: ApiBuyer): Customer => ({
  id: buyer.id,
  name: buyer.nama,
  phone: buyer.telepon || "",
  address: "",
  total_debt: 0,
  created_at: buyer.createdAt,
});

const mapSaleToTransaction = (sale: ApiSale): Transaction => ({
  id: sale.id,
  invoice_number: sale.receipt?.nomorStruk || `INV-${sale.id.slice(0, 8)}`,
  customer_id: sale.buyerId,
  customer_name: sale.buyer?.nama || "Unknown",
  items: [
    {
      id: `${sale.id}-item`,
      fish_stock_id: sale.batchId,
      fish_name: sale.batch?.jenisIkan || "Unknown",
      quantity: Number(sale.beratJual),
      unit_price: Number(sale.hargaSatuan),
      subtotal: Number(sale.total),
    },
    ...(sale.saleExtras || []).map((extra) => ({
      id: extra.id,
      fish_stock_id: "extra",
      fish_name: extra.namaItem,
      quantity: Number(extra.jumlah),
      unit_price: Number(extra.hargaSatuan),
      subtotal: Number(extra.subtotal),
    })),
  ],
  total_amount: Number(sale.total),
  paid_amount: sale.statusBayar === "lunas" ? Number(sale.total) : 0, // Simplified
  payment_status: sale.statusBayar === "lunas" ? "paid" : "unpaid",
  payment_method: "cash",
  created_at: sale.createdAt,
});

export const useFishStore = create<FishState>((set, get) => ({
  fishStocks: [],
  customers: [],
  transactions: [],
  isLoading: false,

  fetchStocks: async () => {
    set({ isLoading: true });
    try {
      const res = await batchesApi.list();
      set({ fishStocks: res.batches.map(mapBatchToStock) });
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCustomers: async () => {
    set({ isLoading: true });
    try {
      const res = await buyersApi.list();
      set({ customers: res.buyers.map(mapBuyerToCustomer) });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const res = await salesApi.list();
      set({ transactions: res.sales.map(mapSaleToTransaction) });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAll: async () => {
    try {
      await Promise.all([
        get().fetchStocks(),
        get().fetchCustomers(),
        get().fetchTransactions(),
      ]);
    } catch (e) {
      console.error(e);
    }
  },

  addStock: async (stock) => {
    const res = await batchesApi.create({
      supplier_id: stock.supplier_id || "Supplier Umum",
      jenis_ikan: stock.fish_type.name,
      berat: stock.quantity,
      harga_beli_per_kg: stock.buy_price,
      kondisi_kualitas: stock.notes,
      sumber_input: "manual",
      diterima_at: stock.batch_date,
    });
    const newStock = mapBatchToStock(res.batch);
    set((state) => ({ fishStocks: [newStock, ...state.fishStocks] }));
    return newStock;
  },

  editStock: async (id, updated) => {
    const res = await batchesApi.update(id, {
      kondisi_kualitas: updated.notes,
    });
    set((state) => ({
      fishStocks: state.fishStocks.map((fs) =>
        fs.id === id ? { ...fs, ...updated } : fs
      ),
    }));
  },

  deleteStock: async (id) => {
    await batchesApi.delete(id);
    set((state) => ({
      fishStocks: state.fishStocks.filter((fs) => fs.id !== id),
    }));
  },

  addAddonToStock: async (stockId, name, price) => {
    const res = await batchExpensesApi.create(stockId, {
      jenis_biaya: name,
      jumlah: price,
    });
    set((state) => ({
      fishStocks: state.fishStocks.map((fs) => {
        if (fs.id === stockId) {
          return {
            ...fs,
            addons: [...(fs.addons || []), { id: res.expense.id, name, price }],
          };
        }
        return fs;
      }),
    }));
  },

  addCustomer: async (customerData) => {
    const res = await buyersApi.create({
      nama: customerData.name,
      telepon: customerData.phone,
    });
    const newCustomer = mapBuyerToCustomer(res.buyer);
    set((state) => ({ customers: [newCustomer, ...state.customers] }));
    return newCustomer;
  },

  addTransaction: async (txData) => {
    const mainItem = txData.items.find(i => i.fish_stock_id !== "extra");
    if (!mainItem) return;

    const extras = txData.items
      .filter(i => i.fish_stock_id === "extra")
      .map(e => ({
        nama_item: e.fish_name,
        jumlah: e.quantity,
        harga_satuan: e.unit_price,
      }));

    const res = await salesApi.create({
      batch_id: mainItem.fish_stock_id,
      buyer_id: txData.customer_id,
      berat_jual: mainItem.quantity,
      harga_satuan: mainItem.unit_price,
      status_bayar: txData.payment_status === "paid" ? "lunas" : "tempo",
      tanggal: new Date().toISOString(),
      extras,
    });

    const newTx = mapSaleToTransaction(res.sale);
    set((state) => ({
      transactions: [newTx, ...state.transactions],
      fishStocks: state.fishStocks.map(stock => {
        if (stock.id === mainItem.fish_stock_id) {
          return { ...stock, quantity: Math.max(0, stock.quantity - mainItem.quantity) };
        }
        return stock;
      })
    }));
  },
}));
