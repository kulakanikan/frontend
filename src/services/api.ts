/**
 * API Service Layer — connects frontend to Hono backend.
 * All requests go through apiClient with auto-attached auth token.
 */
import apiClient from "../lib/api-client";

// ─── Helper: unwrap backend response { success, data } ───────────────────
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const authApi = {
  /** Login via Google OAuth id_token */
  googleLogin: async (idToken: string) => {
    const res = await apiClient.post("/auth/google", { id_token: idToken });
    return unwrap<{ token: string; user: ApiUser }>(res);
  },

  /** DEV login — uses google_sub directly (no OAuth required) */
  devLogin: async (googleSub: string) => {
    const res = await apiClient.post("/auth/dev-login", { google_sub: googleSub });
    return unwrap<{ token: string; user: ApiUser }>(res);
  },

  /** Get current user info (requires auth) */
  me: async () => {
    const res = await apiClient.get("/auth/me");
    return unwrap<{ user: ApiUser }>(res);
  },
};

// ─── PROFILE ──────────────────────────────────────────────────────────────
export const profileApi = {
  get: async () => {
    const res = await apiClient.get("/profile");
    return unwrap<ProfileData>(res);
  },

  update: async (data: { nama_usaha?: string | null; telepon_usaha?: string | null }) => {
    const res = await apiClient.patch("/profile", data);
    return unwrap<{ nama_usaha: string | null; telepon_usaha: string | null }>(res);
  },
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: async () => {
    const res = await apiClient.get("/dashboard/summary");
    return unwrap<DashboardSummary>(res);
  },
};

// ─── BATCHES (Stok Gudang) ────────────────────────────────────────────────
export const batchesApi = {
  list: async (params?: { status?: string; supplier_id?: string; jenis_ikan?: string }) => {
    const res = await apiClient.get("/batches", { params });
    return unwrap<{ batches: ApiBatch[] }>(res);
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/batches/${id}`);
    return unwrap<{ batch: ApiBatch & { expenses: ApiBatchExpense[] } }>(res);
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
    const res = await apiClient.post("/batches", data);
    return unwrap<{ batch: ApiBatch }>(res);
  },

  update: async (id: string, data: { kondisi_kualitas?: string; status?: "aktif" | "habis" }) => {
    const res = await apiClient.patch(`/batches/${id}`, data);
    return unwrap<{ batch: ApiBatch }>(res);
  },

  delete: async (id: string) => {
    await apiClient.delete(`/batches/${id}`);
  },

  recordShrinkage: async (id: string, data: { berat_susut: number; catatan?: string }) => {
    const res = await apiClient.post(`/batches/${id}/susut`, data);
    return unwrap<{ batch: ApiBatch; expense: ApiBatchExpense }>(res);
  },
};

// ─── BATCH EXPENSES ───────────────────────────────────────────────────────
export const batchExpensesApi = {
  list: async (batchId: string) => {
    const res = await apiClient.get(`/batches/${batchId}/expenses`);
    return unwrap<{ expenses: ApiBatchExpense[] }>(res);
  },

  create: async (batchId: string, data: { jenis_biaya: string; jumlah: number; catatan?: string }) => {
    const res = await apiClient.post(`/batches/${batchId}/expenses`, data);
    return unwrap<{ expense: ApiBatchExpense }>(res);
  },

  delete: async (expenseId: string) => {
    await apiClient.delete(`/batch-expenses/${expenseId}`);
  },
};

// ─── BUYERS (Pembeli) ─────────────────────────────────────────────────────
export const buyersApi = {
  list: async () => {
    const res = await apiClient.get("/buyers");
    return unwrap<{ buyers: ApiBuyer[] }>(res);
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/buyers/${id}`);
    return unwrap<{ buyer: ApiBuyer }>(res);
  },

  create: async (data: { nama: string; telepon?: string; tipe_pembeli?: string }) => {
    const res = await apiClient.post("/buyers", data);
    return unwrap<{ buyer: ApiBuyer }>(res);
  },

  update: async (id: string, data: { nama?: string; telepon?: string | null; tipe_pembeli?: string }) => {
    const res = await apiClient.patch(`/buyers/${id}`, data);
    return unwrap<{ buyer: ApiBuyer }>(res);
  },
};

// ─── SUPPLIERS (Nelayan) ──────────────────────────────────────────────────
export const suppliersApi = {
  list: async () => {
    const res = await apiClient.get("/suppliers");
    return unwrap<{ suppliers: ApiSupplier[] }>(res);
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/suppliers/${id}`);
    return unwrap<{ supplier: ApiSupplier }>(res);
  },

  create: async (data: { nama_nelayan: string; telepon?: string; alamat?: string }) => {
    const res = await apiClient.post("/suppliers", data);
    return unwrap<{ supplier: ApiSupplier }>(res);
  },

  update: async (id: string, data: { nama_nelayan?: string; telepon?: string | null; alamat?: string | null }) => {
    const res = await apiClient.patch(`/suppliers/${id}`, data);
    return unwrap<{ supplier: ApiSupplier }>(res);
  },

  delete: async (id: string) => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};

// ─── SALES (Transaksi) ───────────────────────────────────────────────────
export const salesApi = {
  list: async (params?: { status_bayar?: string; buyer_id?: string; batch_id?: string }) => {
    const res = await apiClient.get("/sales", { params });
    return unwrap<{ sales: ApiSale[] }>(res);
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/sales/${id}`);
    return unwrap<{ sale: ApiSaleDetail }>(res);
  },

  create: async (data: {
    batch_id: string;
    buyer_id: string;
    berat_jual: number;
    harga_satuan: number;
    status_bayar: "lunas" | "tempo";
    tanggal: string;
    extras?: Array<{ nama_item: string; jumlah: number; harga_satuan: number }>;
  }) => {
    const res = await apiClient.post("/sales", data);
    return unwrap<{ sale: ApiSale; extras: any[]; receipt: any }>(res);
  },
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: async (saleId: string) => {
    const res = await apiClient.get(`/sales/${saleId}/payments`);
    return unwrap<{ payments: ApiPayment[] }>(res);
  },

  create: async (saleId: string, data: { jumlah_bayar: number; metode_bayar: string; dibayar_at?: string }) => {
    const res = await apiClient.post(`/sales/${saleId}/payments`, data);
    return unwrap<{ payment: ApiPayment; sale_status_updated: boolean; total_paid: number; remaining: number }>(res);
  },
};

// ─── RECEIPTS ─────────────────────────────────────────────────────────────
export const receiptsApi = {
  get: async (id: string) => {
    const res = await apiClient.get(`/receipts/${id}`);
    return unwrap<any>(res);
  },

  sendWa: async (id: string, phoneNumber: string) => {
    const res = await apiClient.post(`/receipts/${id}/send-wa`, { phone_number: phoneNumber });
    return unwrap<{ wa_link: string }>(res);
  },
};

// ─── VOICE (Gemini Parser) ────────────────────────────────────────────────
export const voiceApi = {
  parse: async (transcript: string, formType: "batch" | "supplier" | "buyer" | "sale" | "batch_expense") => {
    const res = await apiClient.post("/voice/parse", {
      transcript,
      form_type: formType,
    });
    return unwrap<{ form_type: string; suggestion: any }>(res);
  },

  parseAudio: async (audioBase64: string, mimeType: string, formType: "batch" | "supplier" | "buyer" | "sale" | "batch_expense") => {
    const res = await apiClient.post("/voice/parse", {
      audio: audioBase64,
      mime_type: mimeType,
      form_type: formType,
    });
    return unwrap<{ form_type: string; suggestion: any }>(res);
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
  beratJual: string;
  hargaSatuan: string;
  total: string;
  statusBayar: "lunas" | "tempo";
  tanggal: string;
  createdAt: string;
  batch: { userId: string; jenisIkan: string } | null;
  buyer: { nama: string; tipePembeli: string | null } | null;
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
