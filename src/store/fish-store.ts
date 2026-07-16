import { create } from "zustand";
import { FishStock, Customer, Transaction, FishType } from "../types";

interface FishState {
  fishStocks: FishStock[];
  customers: Customer[];
  transactions: Transaction[];
  addStock: (stock: Omit<FishStock, "id">) => FishStock;
  editStock: (id: string, updated: Partial<Omit<FishStock, "id">>) => void;
  deleteStock: (id: string) => void;
  addAddonToStock: (stockId: string, name: string, price: number) => void;
  addCustomer: (customer: Omit<Customer, "id" | "total_debt" | "created_at">) => Customer;
  addTransaction: (transaction: Omit<Transaction, "id" | "invoice_number" | "created_at">) => void;
}

const mockFishTypes: FishType[] = [
  { id: "ft-1", name: "Ikan Kembung", category: "laut", unit: "kg" },
  { id: "ft-2", name: "Ikan Tongkol", category: "laut", unit: "kg" },
  { id: "ft-3", name: "Ikan Tuna", category: "laut", unit: "kg" },
  { id: "ft-4", name: "Ikan Bandeng", category: "tambak", unit: "kg" },
  { id: "ft-5", name: "Ikan Mas", category: "tawar", unit: "kg" },
];

const initialStocks: FishStock[] = [
  {
    id: "fs-1",
    fish_type: mockFishTypes[0],
    quantity: 120,
    buy_price: 25000,
    sell_price: 32000,
    supplier_id: "sup-1",
    batch_date: new Date().toISOString().split("T")[0],
  },
  {
    id: "fs-2",
    fish_type: mockFishTypes[1],
    quantity: 85,
    buy_price: 30000,
    sell_price: 38000,
    supplier_id: "sup-2",
    batch_date: new Date().toISOString().split("T")[0],
  },
  {
    id: "fs-3",
    fish_type: mockFishTypes[2],
    quantity: 45,
    buy_price: 65000,
    sell_price: 80000,
    supplier_id: "sup-3",
    batch_date: new Date().toISOString().split("T")[0],
  },
];

const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Toko Kelontong Pak Budi",
    phone: "081234567890",
    address: "Jl. Raya Muara Baru No. 12",
    total_debt: 150000,
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-2",
    name: "Warung Seafood Bu Siti",
    phone: "089876543210",
    address: "Kawasan Kuliner Muara Angke",
    total_debt: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-3",
    name: "Resto Segara Indah",
    phone: "085522334455",
    address: "Pantai Indah Kapuk Ruko No. 5",
    total_debt: 450000,
    created_at: new Date().toISOString(),
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "tx-1",
    invoice_number: "INV-20260716-001",
    customer_id: "cust-1",
    customer_name: "Toko Kelontong Pak Budi",
    items: [
      {
        id: "txi-1",
        fish_stock_id: "fs-1",
        fish_name: "Ikan Kembung",
        quantity: 10,
        unit_price: 32000,
        subtotal: 320000,
      },
    ],
    total_amount: 320000,
    paid_amount: 320000,
    payment_status: "paid",
    payment_method: "cash",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "tx-2",
    invoice_number: "INV-20260716-002",
    customer_id: "cust-3",
    customer_name: "Resto Segara Indah",
    items: [
      {
        id: "txi-2",
        fish_stock_id: "fs-3",
        fish_name: "Ikan Tuna",
        quantity: 5,
        unit_price: 80000,
        subtotal: 400000,
      },
    ],
    total_amount: 400000,
    paid_amount: 0,
    payment_status: "unpaid",
    payment_method: "transfer",
    notes: "Pembayaran tempo 1 minggu",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const useFishStore = create<FishState>((set, get) => ({
  fishStocks: initialStocks,
  customers: initialCustomers,
  transactions: initialTransactions,

  addStock: (stock) => {
    const newStock: FishStock = {
      ...stock,
      id: `fs-${Date.now()}`,
      addons: [],
    };
    set((state) => ({
      fishStocks: [newStock, ...state.fishStocks],
    }));
    return newStock;
  },

  editStock: (id, updated) => {
    set((state) => ({
      fishStocks: state.fishStocks.map((fs) =>
        fs.id === id ? { ...fs, ...updated } : fs
      ),
    }));
  },

  deleteStock: (id) => {
    set((state) => ({
      fishStocks: state.fishStocks.filter((fs) => fs.id !== id),
    }));
  },

  addAddonToStock: (stockId, name, price) => {
    set((state) => ({
      fishStocks: state.fishStocks.map((fs) => {
        if (fs.id === stockId) {
          const currentAddons = fs.addons || [];
          return {
            ...fs,
            addons: [...currentAddons, { id: `add-${Date.now()}`, name, price }],
          };
        }
        return fs;
      }),
    }));
  },

  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      total_debt: 0,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      customers: [newCustomer, ...state.customers],
    }));
    return newCustomer;
  },

  addTransaction: (txData) => {
    const nextNum = get().transactions.length + 1;
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const invoice_number = `INV-${dateStr}-${String(nextNum).padStart(3, "0")}`;

    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      invoice_number,
      created_at: new Date().toISOString(),
    };

    // Deduct quantities from stocks and update customer total_debt if tempo
    set((state) => {
      // Deduct quantities
      const updatedStocks = state.fishStocks.map((stock) => {
        const item = txData.items.find((it) => it.fish_stock_id === stock.id);
        if (item) {
          return {
            ...stock,
            quantity: Math.max(0, stock.quantity - item.quantity),
          };
        }
        return stock;
      });

      // Update customer total_debt if unpaid or partially paid
      const debt = newTx.total_amount - newTx.paid_amount;
      const updatedCustomers = state.customers.map((c) => {
        if (c.id === txData.customer_id && debt > 0) {
          return {
            ...c,
            total_debt: c.total_debt + debt,
          };
        }
        return c;
      });

      return {
        transactions: [newTx, ...state.transactions],
        fishStocks: updatedStocks,
        customers: updatedCustomers,
      };
    });
  },
}));
