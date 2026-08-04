/**
 * API Service Layer — connects frontend to Hono backend.
 * Includes automatic Mock Fallback for standalone/decoupled frontend development.
 */
import apiClient from "../lib/api-client";
import {
  mockUser,
  mockProfile,
  mockDashboardSummary,
  mockSuppliers,
  mockBuyers,
  mockBatches,
  mockSales,
  mockMarkets,
  mockDeliverySchedules,
} from "./mockData";

const isMockMode = () => process.env.EXPO_PUBLIC_USE_MOCK === "true";

async function callOrMock<T>(apiCall: () => Promise<T>, fallbackData: T): Promise<T> {
  if (isMockMode()) {
    return Promise.resolve(fallbackData);
  }
  try {
    return await apiCall();
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response || err?.message?.includes("Network")) {
      console.warn("[MOCK FALLBACK] Backend offline, using mock data.");
      return fallbackData;
    }
    throw err;
  }
}

// ─── Helper: unwrap backend response { success, data } ───────────────────
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const authApi = {
  /** Login via Google OAuth id_token */
  googleLogin: async (idToken: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.post("/auth/google", { id_token: idToken });
        return unwrap<{ token: string; user: ApiUser }>(res);
      },
      { token: "mock-jwt-token-12345", user: mockUser }
    );
  },

  /** DEV login — uses google_sub directly (no OAuth required) */
  devLogin: async (googleSub: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.post("/auth/dev-login", { google_sub: googleSub });
        return unwrap<{ token: string; user: ApiUser }>(res);
      },
      { token: "mock-jwt-token-12345", user: mockUser }
    );
  },

  /** Get current user info (requires auth) */
  me: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/auth/me");
        return unwrap<{ user: ApiUser }>(res);
      },
      { user: mockUser }
    );
  },
};

// ─── PROFILE ──────────────────────────────────────────────────────────────
export const profileApi = {
  get: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/profile");
        return unwrap<ProfileData>(res);
      },
      mockProfile
    );
  },

  update: async (data: { nama_usaha?: string | null; telepon_usaha?: string | null }) => {
    return callOrMock(
      async () => {
        const res = await apiClient.patch("/profile", data);
        return unwrap<{ nama_usaha: string | null; telepon_usaha: string | null }>(res);
      },
      {
        nama_usaha: data.nama_usaha !== undefined ? data.nama_usaha : mockProfile.nama_usaha,
        telepon_usaha: data.telepon_usaha !== undefined ? data.telepon_usaha : mockProfile.telepon_usaha,
      }
    );
  },
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/dashboard/summary");
        return unwrap<DashboardSummary>(res);
      },
      mockDashboardSummary
    );
  },
  aiSummary: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/dashboard/ai-summary");
        return unwrap<{ summary: string }>(res);
      },
      { summary: "Insight AI Demo: Stok Bandeng & Tongkol berjalan lancar minggu ini! Penjualan naik 12%." }
    );
  },
};

// ─── BATCHES (Stok Gudang) ────────────────────────────────────────────────
export const batchesApi = {
  list: async (params?: { status?: string; supplier_id?: string; jenis_ikan?: string }) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/batches", { params });
        return unwrap<{ batches: ApiBatch[] }>(res);
      },
      { batches: mockBatches }
    );
  },

  get: async (id: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/batches/${id}`);
        return unwrap<{ batch: ApiBatch & { expenses: ApiBatchExpense[] } }>(res);
      },
      { batch: { ...(mockBatches.find((b) => b.id === id) || mockBatches[0]), expenses: [] } }
    );
  },

  create: async (data: {
    supplier_id: string;
    jenis_ikan: string;
    berat: number;
    harga_beli_per_kg: number;
    kondisi_kualitas?: string;
    sumber_input: "voice" | "manual";
    diterima_at: string;
  }) => {
    const newBatch: ApiBatch = {
      id: `b-${Date.now()}`,
      userId: "u-demo-123",
      supplierId: data.supplier_id,
      jenisIkan: data.jenis_ikan,
      berat: String(data.berat),
      hargaBeliPerKg: String(data.harga_beli_per_kg),
      kondisiKualitas: data.kondisi_kualitas || null,
      sumberInput: data.sumber_input,
      status: "aktif",
      diterimaAt: data.diterima_at,
      createdAt: new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post("/batches", data);
        return unwrap<{ batch: ApiBatch }>(res);
      },
      { batch: newBatch }
    );
  },

  update: async (id: string, data: { kondisi_kualitas?: string; status?: "aktif" | "habis" }) => {
    const updated = { ...(mockBatches[0]), ...data };
    return callOrMock(
      async () => {
        const res = await apiClient.patch(`/batches/${id}`, data);
        return unwrap<{ batch: ApiBatch }>(res);
      },
      { batch: updated }
    );
  },

  delete: async (id: string) => {
    if (isMockMode()) return;
    try {
      await apiClient.delete(`/batches/${id}`);
    } catch (_) {}
  },

  recordShrinkage: async (id: string, data: { berat_susut: number; catatan?: string }) => {
    const mockExpense: ApiBatchExpense = {
      id: `exp-${Date.now()}`,
      batchId: id,
      jenisBiaya: "susut",
      jumlah: String(data.berat_susut),
      catatan: data.catatan || null,
      createdAt: new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post(`/batches/${id}/susut`, data);
        return unwrap<{ batch: ApiBatch; expense: ApiBatchExpense }>(res);
      },
      { batch: mockBatches[0], expense: mockExpense }
    );
  },
};

// ─── BATCH EXPENSES ───────────────────────────────────────────────────────
export const batchExpensesApi = {
  list: async (batchId: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/batches/${batchId}/expenses`);
        return unwrap<{ expenses: ApiBatchExpense[] }>(res);
      },
      { expenses: [] }
    );
  },

  create: async (batchId: string, data: { jenis_biaya: string; jumlah: number; catatan?: string }) => {
    const mockExp: ApiBatchExpense = {
      id: `exp-${Date.now()}`,
      batchId,
      jenisBiaya: data.jenis_biaya,
      jumlah: String(data.jumlah),
      catatan: data.catatan || null,
      createdAt: new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post(`/batches/${batchId}/expenses`, data);
        return unwrap<{ expense: ApiBatchExpense }>(res);
      },
      { expense: mockExp }
    );
  },

  delete: async (expenseId: string) => {
    if (isMockMode()) return;
    try {
      await apiClient.delete(`/batch-expenses/${expenseId}`);
    } catch (_) {}
  },
};

// ─── BUYERS (Pembeli) ─────────────────────────────────────────────────────
export const buyersApi = {
  list: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/buyers");
        return unwrap<{ buyers: ApiBuyer[] }>(res);
      },
      { buyers: mockBuyers }
    );
  },

  get: async (id: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/buyers/${id}`);
        return unwrap<{ buyer: ApiBuyer }>(res);
      },
      { buyer: mockBuyers.find((b) => b.id === id) || mockBuyers[0] }
    );
  },

  create: async (data: { nama: string; telepon?: string; tipe_pembeli?: string; market_id?: string | null }) => {
    const newBuyer: ApiBuyer = {
      id: `buy-${Date.now()}`,
      userId: "u-demo-123",
      nama: data.nama,
      telepon: data.telepon || null,
      tipePembeli: data.tipe_pembeli || null,
      marketId: data.market_id || null,
      createdAt: new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post("/buyers", data);
        return unwrap<{ buyer: ApiBuyer }>(res);
      },
      { buyer: newBuyer }
    );
  },

  update: async (id: string, data: { nama?: string; telepon?: string | null; tipe_pembeli?: string }) => {
    const updated: ApiBuyer = {
      ...(mockBuyers.find((b) => b.id === id) || mockBuyers[0]),
      nama: data.nama || mockBuyers[0].nama,
      telepon: data.telepon !== undefined ? data.telepon : mockBuyers[0].telepon,
      tipePembeli: data.tipe_pembeli !== undefined ? data.tipe_pembeli : mockBuyers[0].tipePembeli,
    };
    return callOrMock(
      async () => {
        const res = await apiClient.patch(`/buyers/${id}`, data);
        return unwrap<{ buyer: ApiBuyer }>(res);
      },
      { buyer: updated }
    );
  },
};

// ─── SUPPLIERS (Nelayan) ──────────────────────────────────────────────────
export const suppliersApi = {
  list: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/suppliers");
        return unwrap<{ suppliers: ApiSupplier[] }>(res);
      },
      { suppliers: mockSuppliers }
    );
  },

  get: async (id: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/suppliers/${id}`);
        return unwrap<{ supplier: ApiSupplier }>(res);
      },
      { supplier: mockSuppliers.find((s) => s.id === id) || mockSuppliers[0] }
    );
  },

  create: async (data: { nama_nelayan: string; telepon?: string; alamat?: string }) => {
    const newSup: ApiSupplier = {
      id: `sup-${Date.now()}`,
      userId: "u-demo-123",
      namaNelayan: data.nama_nelayan,
      telepon: data.telepon || null,
      alamat: data.alamat || null,
      createdAt: new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post("/suppliers", data);
        return unwrap<{ supplier: ApiSupplier }>(res);
      },
      { supplier: newSup }
    );
  },

  update: async (id: string, data: { nama_nelayan?: string; telepon?: string | null; alamat?: string | null }) => {
    const updated: ApiSupplier = {
      ...(mockSuppliers.find((s) => s.id === id) || mockSuppliers[0]),
      namaNelayan: data.nama_nelayan || mockSuppliers[0].namaNelayan,
      telepon: data.telepon !== undefined ? data.telepon : mockSuppliers[0].telepon,
      alamat: data.alamat !== undefined ? data.alamat : mockSuppliers[0].alamat,
    };
    return callOrMock(
      async () => {
        const res = await apiClient.patch(`/suppliers/${id}`, data);
        return unwrap<{ supplier: ApiSupplier }>(res);
      },
      { supplier: updated }
    );
  },

  delete: async (id: string) => {
    if (isMockMode()) return;
    try {
      await apiClient.delete(`/suppliers/${id}`);
    } catch (_) {}
  },
};

// ─── SALES (Transaksi) ───────────────────────────────────────────────────
export const salesApi = {
  list: async (params?: { status_bayar?: string; buyer_id?: string; batch_id?: string }) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/sales", { params });
        return unwrap<{ sales: ApiSale[] }>(res);
      },
      { sales: mockSales }
    );
  },

  get: async (id: string) => {
    const found = mockSales.find((s) => s.id === id) || mockSales[0];
    const mockDetail: ApiSaleDetail = { ...found, payments: [] };
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/sales/${id}`);
        return unwrap<{ sale: ApiSaleDetail }>(res);
      },
      { sale: mockDetail }
    );
  },

  create: async (data: {
    batch_id: string;
    buyer_id: string;
    berat_jual: number;
    harga_satuan: number;
    status_bayar: "lunas" | "tempo";
    tanggal: string;
    extras?: Array<{ nama_item: string; jumlah: number; harga_satuan: number }>;
    market_id?: string | null;
  }) => {
    const total = data.berat_jual * data.harga_satuan;
    const newSale: ApiSale = {
      id: `sale-${Date.now()}`,
      batchId: data.batch_id,
      buyerId: data.buyer_id,
      marketId: data.market_id || null,
      beratJual: String(data.berat_jual),
      hargaSatuan: String(data.harga_satuan),
      total: String(total),
      statusBayar: data.status_bayar,
      tanggal: data.tanggal,
      createdAt: new Date().toISOString(),
      batch: { userId: "u-demo-123", jenisIkan: "Ikan Tongkol" },
      buyer: { nama: "Pembeli Demo", tipePembeli: "Restoran" },
      market: null,
      saleExtras: [],
      receipt: { id: `rec-${Date.now()}`, nomorStruk: `INV/${Date.now()}` },
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post("/sales", data);
        return unwrap<{ sale: ApiSale; extras: any[]; receipt: any }>(res);
      },
      { sale: newSale, extras: [], receipt: newSale.receipt }
    );
  },
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: async (saleId: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/sales/${saleId}/payments`);
        return unwrap<{ payments: ApiPayment[] }>(res);
      },
      { payments: [] }
    );
  },

  create: async (saleId: string, data: { jumlah_bayar: number; metode_bayar: string; dibayar_at?: string }) => {
    const mockPay: ApiPayment = {
      id: `pay-${Date.now()}`,
      saleId,
      jumlahBayar: String(data.jumlah_bayar),
      metodeBayar: data.metode_bayar,
      dibayarAt: data.dibayar_at || new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post(`/sales/${saleId}/payments`, data);
        return unwrap<{ payment: ApiPayment; sale_status_updated: boolean; total_paid: number; remaining: number }>(res);
      },
      { payment: mockPay, sale_status_updated: true, total_paid: data.jumlah_bayar, remaining: 0 }
    );
  },
};

// ─── RECEIPTS ─────────────────────────────────────────────────────────────
export const receiptsApi = {
  get: async (id: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/receipts/${id}`);
        return unwrap<any>(res);
      },
      { id, nomorStruk: "INV/DEMO/0001", total: 1750000 }
    );
  },

  sendWa: async (id: string, phoneNumber: string) => {
    return callOrMock(
      async () => {
        const res = await apiClient.post(`/receipts/${id}/send-wa`, { phone_number: phoneNumber });
        return unwrap<{ wa_link: string }>(res);
      },
      { wa_link: `https://api.whatsapp.com/send?phone=${phoneNumber}&text=Struk+Pembayaran+Demo` }
    );
  },
};

// ─── VOICE (Gemini Parser) ────────────────────────────────────────────────
export const voiceApi = {
  parse: async (transcript: string, formType: "batch" | "supplier" | "buyer" | "sale" | "batch_expense") => {
    return callOrMock(
      async () => {
        const res = await apiClient.post("/voice/parse", {
          transcript,
          form_type: formType,
        });
        return unwrap<{ form_type: string; suggestion: any }>(res);
      },
      {
        form_type: formType,
        suggestion: { jenis_ikan: "Tongkol", berat: 50, harga_beli_per_kg: 30000 },
      }
    );
  },

  parseAudio: async (audioBase64: string, mimeType: string, formType: "batch" | "supplier" | "buyer" | "sale" | "batch_expense") => {
    return callOrMock(
      async () => {
        const res = await apiClient.post("/voice/parse", {
          audio: audioBase64,
          mime_type: mimeType,
          form_type: formType,
        });
        return unwrap<{ form_type: string; suggestion: any }>(res);
      },
      {
        form_type: formType,
        suggestion: { jenis_ikan: "Tongkol", berat: 50, harga_beli_per_kg: 30000 },
      }
    );
  },
};

// ─── MARKETS & MAP ────────────────────────────────────────────────────────
export const marketsApi = {
  list: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/markets");
        return unwrap<{ markets: ApiMarket[] }>(res);
      },
      { markets: mockMarkets }
    );
  },

  get: async (id: string) => {
    const found = mockMarkets.find((m) => m.id === id) || mockMarkets[0];
    return callOrMock(
      async () => {
        const res = await apiClient.get(`/markets/${id}`);
        return unwrap<{ market: ApiMarket }>(res);
      },
      { market: found }
    );
  },

  create: async (data: {
    nama_pasar: string;
    alamat: string;
    latitude: number;
    longitude: number;
    kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran";
  }) => {
    const newMarket: ApiMarket = {
      id: `mkt-${Date.now()}`,
      namaPasar: data.nama_pasar,
      nama_pasar: data.nama_pasar,
      alamat: data.alamat,
      latitude: data.latitude,
      longitude: data.longitude,
      kategori: data.kategori,
      totalBuyers: 0,
      totalPesanan: 0,
      buyers: [],
      pembeliList: [],
      createdAt: new Date().toISOString(),
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post("/markets", data);
        return unwrap<{ market: ApiMarket }>(res);
      },
      { market: newMarket }
    );
  },

  update: async (
    id: string,
    data: Partial<{
      nama_pasar: string;
      alamat: string;
      latitude: number;
      longitude: number;
      kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran";
    }>
  ) => {
    const existing = mockMarkets.find((m) => m.id === id) || mockMarkets[0];
    return callOrMock(
      async () => {
        const res = await apiClient.patch(`/markets/${id}`, data);
        return unwrap<{ market: ApiMarket }>(res);
      },
      { market: { ...existing, ...data, namaPasar: data.nama_pasar ?? existing.namaPasar } }
    );
  },

  delete: async (id: string) => {
    if (isMockMode()) return;
    await apiClient.delete(`/markets/${id}`);
  },
};

// ─── DELIVERY SCHEDULES ───────────────────────────────────────────────────
export const deliverySchedulesApi = {
  list: async () => {
    return callOrMock(
      async () => {
        const res = await apiClient.get("/delivery-schedules");
        return unwrap<{ schedules: ApiDeliverySchedule[] }>(res);
      },
      { schedules: mockDeliverySchedules }
    );
  },

  create: async (saleId: string, data: { scheduled_at: string; catatan?: string }) => {
    const newSchedule: ApiDeliverySchedule = {
      id: `sch-${Date.now()}`,
      saleId,
      sale_id: saleId,
      scheduledAt: data.scheduled_at,
      scheduled_at: data.scheduled_at,
      catatan: data.catatan || null,
      createdAt: new Date().toISOString(),
      sale: null,
      buyer: null,
      market: null,
    };
    return callOrMock(
      async () => {
        const res = await apiClient.post(`/sales/${saleId}/schedules`, data);
        return unwrap<{ schedule: ApiDeliverySchedule }>(res);
      },
      { schedule: newSchedule }
    );
  },

  delete: async (id: string) => {
    if (isMockMode()) return;
    await apiClient.delete(`/schedules/${id}`);
  },
};

// ─── API TYPES ────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  nama: string;
  email: string;
  avatarUrl: string | null;
  namaUsaha: string | null;
  teleponUsaha: string | null;
}

export interface ProfileData {
  nama_usaha: string | null;
  telepon_usaha: string | null;
  nama_google: string;
  email: string;
  avatar_url: string | null;
}

export interface DashboardSummary {
  omzet: number;
  laba_riil_total: number;
  stok_tersisa_kg: number;
  total_piutang: number;
  top_batch: Array<{
    id: string;
    jenis_ikan: string;
    diterima_at: string;
    total_penjualan: number;
    laba_riil: number;
  }>;
}

export interface ApiBatch {
  id: string;
  userId: string;
  supplierId: string;
  jenisIkan: string;
  berat: string;
  hargaBeliPerKg: string;
  kondisiKualitas: string | null;
  sumberInput: "voice" | "manual";
  status: "aktif" | "habis";
  diterimaAt: string;
  createdAt: string;
  suppliers?: { namaNelayan: string; telepon: string | null };
  batchExpenses?: ApiBatchExpense[];
}

export interface ApiBatchExpense {
  id: string;
  batchId: string;
  jenisBiaya: string;
  jumlah: string;
  catatan: string | null;
  createdAt: string;
}

export interface ApiBuyer {
  id: string;
  userId: string;
  nama: string;
  telepon: string | null;
  tipePembeli: string | null;
  marketId: string | null;
  createdAt: string;
}

export interface ApiSupplier {
  id: string;
  userId: string;
  namaNelayan: string;
  telepon: string | null;
  alamat: string | null;
  createdAt: string;
}

export interface ApiSale {
  id: string;
  batchId: string;
  buyerId: string;
  marketId: string | null;
  beratJual: string;
  hargaSatuan: string;
  total: string;
  statusBayar: "lunas" | "tempo";
  tanggal: string;
  createdAt: string;
  batch: { userId: string; jenisIkan: string } | null;
  buyer: { nama: string; tipePembeli: string | null } | null;
  market: { id: string; namaPasar: string; alamat: string; latitude: number; longitude: number; kategori: string } | null;
  saleExtras: ApiSaleExtra[];
  receipt: { id: string; nomorStruk: string } | null;
}

export interface ApiSaleDetail extends ApiSale {
  payments: ApiPayment[];
}

export interface ApiSaleExtra {
  id: string;
  saleId: string;
  namaItem: string;
  jumlah: string;
  hargaSatuan: string;
  subtotal: string;
}

export interface ApiPayment {
  id: string;
  saleId: string;
  jumlahBayar: string;
  metodeBayar: string;
  dibayarAt: string;
}

// ─── MARKETS ─────────────────────────────────────────────────────────────────

export interface ApiMarketBuyer {
  id: string;
  nama: string;
  namaPembeli: string;
  telepon: string | null;
  tipePembeli: string | null;
  marketId: string;
}

export interface ApiMarket {
  id: string;
  userId?: string;
  namaPasar: string;
  nama_pasar: string;
  alamat: string;
  latitude: number;
  longitude: number;
  kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran";
  totalBuyers: number;
  totalPesanan: number;
  buyers: ApiMarketBuyer[];
  pembeliList: ApiMarketBuyer[];
  createdAt: string;
  // dihitung di frontend via Haversine — tidak dari API:
  jarakKm?: number;
}

export interface ApiDeliverySchedule {
  id: string;
  saleId: string;
  sale_id: string;
  scheduledAt: string;
  scheduled_at: string;
  catatan: string | null;
  createdAt: string;
  created_at?: string;
  sale: {
    id: string;
    invoice_number: string;
    berat_jual: number;
    harga_satuan: number;
    total: number;
    status_bayar: "lunas" | "tempo";
    tanggal: string;
  } | null;
  buyer: {
    id: string;
    nama: string;
    telepon: string | null;
    tipe_pembeli: string | null;
  } | null;
  market: {
    id: string;
    namaPasar: string;
    nama_pasar: string;
    alamat: string;
    latitude: number;
    longitude: number;
    kategori: string;
  } | null;
}
