# Frontend Markets & Delivery Schedules Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrasikan frontend (`dev/bay`) dengan backend markets & delivery schedules API (commit `c5b2bc0`, branch `dev/mastay`) — fix type mismatches, wire semua UI dari hardcode ke real API, tambah market CRUD di map, dan sambungkan notifications ke delivery schedules.

**Architecture:** Layer by Layer — `api.ts` types & methods → Zustand stores → screen components. Semua perubahan mengikuti pola yang sudah ada di codebase (callOrMock wrapper, Zustand store pattern). Tidak ada perubahan navigasi atau struktur tab.

**Tech Stack:** React Native (Expo), TypeScript, Zustand, Axios (via `api-client.ts`), Haversine formula (plain JS)

---

## File Map

| File | Status | Tanggung Jawab |
|---|---|---|
| `src/services/api.ts` | MODIFY | Types + semua API method |
| `src/services/mockData.ts` | MODIFY | Align mock data dengan type baru |
| `src/store/markets-store.ts` | NEW | Zustand state untuk markets CRUD |
| `src/store/delivery-store.ts` | NEW | Zustand state untuk delivery schedules |
| `src/store/index.ts` | MODIFY | Export 2 store baru |
| `src/utils/index.ts` | MODIFY | Tambah `haversineDistanceKm()` |
| `app/notifications.tsx` | MODIFY | Wire ke delivery schedules API |
| `app/input-pembeli.tsx` | MODIFY | Wire market selector ke markets API |
| `app/map.tsx` | MODIFY | Fix types, Haversine, enrich buyers, market CRUD UI |

---

## Task 1: Fix Types + Complete `marketsApi` + Add `deliverySchedulesApi` di `api.ts`

**Files:**
- Modify: `src/services/api.ts`

### Langkah

- [ ] **Step 1: Update `ApiBuyer` interface — tambah `marketId`**

  Buka `src/services/api.ts`, cari interface `ApiBuyer` (sekitar baris 603) dan ganti dengan:

  ```ts
  export interface ApiBuyer {
    id: string;
    userId: string;
    nama: string;
    telepon: string | null;
    tipePembeli: string | null;
    marketId: string | null;
    createdAt: string;
  }
  ```

- [ ] **Step 2: Update `ApiSale` interface — tambah `marketId` dan `market`**

  Cari interface `ApiSale` (sekitar baris 621) dan tambahkan dua field:

  ```ts
  export interface ApiSale {
    id: string;
    batchId: string;
    buyerId: string;
    marketId: string | null;   // BARU
    beratJual: string;
    hargaSatuan: string;
    total: string;
    statusBayar: "lunas" | "tempo";
    tanggal: string;
    createdAt: string;
    batch: { userId: string; jenisIkan: string } | null;
    buyer: { nama: string; tipePembeli: string | null } | null;
    market: {                   // BARU
      id: string;
      namaPasar: string;
      alamat: string;
      latitude: number;
      longitude: number;
      kategori: string;
    } | null;
    saleExtras: ApiSaleExtra[];
    receipt: { id: string; nomorStruk: string } | null;
  }
  ```

- [ ] **Step 3: Tambah 3 interface baru di bagian `// ─── API TYPES ───`**

  Di bagian bawah file (setelah `ApiPayment`), tambahkan:

  ```ts
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
  ```

- [ ] **Step 4: Update import di bagian atas `api.ts` — hapus `type ApiMarket` dari import mockData**

  Cari baris:
  ```ts
  import {
    mockUser,
    mockProfile,
    mockDashboardSummary,
    mockSuppliers,
    mockBuyers,
    mockBatches,
    mockSales,
    mockMarkets,
    type ApiMarket,
  } from "./mockData";
  ```

  Ubah menjadi:
  ```ts
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
  ```

- [ ] **Step 5: Update `buyersApi.create` — tambah `market_id` opsional**

  Cari method `create` di dalam `buyersApi` (sekitar baris 274) dan update signature:

  ```ts
  create: async (data: {
    nama: string;
    telepon?: string;
    tipe_pembeli?: string;
    market_id?: string | null;
  }) => {
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
  ```

- [ ] **Step 6: Update `salesApi.create` — tambah `market_id` opsional**

  Cari method `create` di dalam `salesApi` (sekitar baris 397) dan update signature:

  ```ts
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
    // ... kode existing tetap sama, hanya tambah marketId di newSale mock:
    const newSale: ApiSale = {
      id: `sale-${Date.now()}`,
      batchId: data.batch_id,
      buyerId: data.buyer_id,
      marketId: data.market_id || null,    // BARU
      beratJual: String(data.berat_jual),
      hargaSatuan: String(data.harga_satuan),
      total: String(data.berat_jual * data.harga_satuan),
      statusBayar: data.status_bayar,
      tanggal: data.tanggal,
      createdAt: new Date().toISOString(),
      batch: { userId: "u-demo-123", jenisIkan: "Ikan Tongkol" },
      buyer: { nama: "Pembeli Demo", tipePembeli: "Restoran" },
      market: null,                        // BARU
      saleExtras: [],
      receipt: { id: `rec-${Date.now()}`, nomorStruk: `INV/${Date.now()}` },
    };
    // ...callOrMock existing...
  }
  ```

- [ ] **Step 7: Complete `marketsApi` — tambah `create`, `update`, `delete`**

  Cari blok `export const marketsApi = {` dan replace seluruhnya dengan:

  ```ts
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
  ```

- [ ] **Step 8: Tambah `deliverySchedulesApi` baru setelah `marketsApi`**

  ```ts
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
  ```

- [ ] **Step 9: Verifikasi TypeScript compile — tidak ada error terkait type baru**

  ```bash
  cd /home/hyprland/NasywanPrivat/LOMBA/kulakan/frontend
  npx tsc --noEmit 2>&1 | head -40
  ```

  Tidak boleh ada error terkait `ApiMarket`, `ApiMarketBuyer`, `ApiDeliverySchedule`, `marketId`.

- [ ] **Step 10: Commit**

  ```bash
  git add src/services/api.ts
  git commit -m "feat(api): add markets CRUD, delivery schedules API, fix types for market_id"
  ```

---

## Task 2: Update `mockData.ts` — Align dengan Types Baru

**Files:**
- Modify: `src/services/mockData.ts`

### Langkah

- [ ] **Step 1: Hapus interface `ApiMarketBuyerOrder`, `ApiMarketBuyer`, `ApiMarket` dari mockData.ts**

  Hapus baris 14–42 (keseluruhan 3 interface tersebut). Mereka sekarang ada di `api.ts`.

  Ubah bagian import di baris 1–12 — hapus karena tidak ada lagi interface yang diekspor dari sini (atau pertahankan jika masih ada type lain).

- [ ] **Step 2: Tambah `marketId: null` ke `mockBuyers`**

  Tambahkan `marketId: null` ke setiap entry di `mockBuyers`:

  ```ts
  export const mockBuyers: ApiBuyer[] = [
    {
      id: "buy-1",
      userId: "u-demo-123",
      nama: "Restoran Samudra",
      telepon: "08198765432",
      tipePembeli: "Restoran",
      marketId: null,       // BARU
      createdAt: "2026-07-21T00:00:00Z",
    },
    {
      id: "buy-2",
      userId: "u-demo-123",
      nama: "Bu Sri (Pedagang Pasar)",
      telepon: "085211223344",
      tipePembeli: "Pedagang Pasar",
      marketId: null,       // BARU
      createdAt: "2026-07-23T00:00:00Z",
    },
  ];
  ```

- [ ] **Step 3: Tambah `marketId: null, market: null` ke `mockSales`**

  ```ts
  export const mockSales: ApiSale[] = [
    {
      id: "sale-1",
      batchId: "b-1",
      buyerId: "buy-1",
      marketId: null,   // BARU
      beratJual: "50.00",
      hargaSatuan: "35000.00",
      total: "1750000.00",
      statusBayar: "lunas",
      tanggal: "2026-07-29T10:00:00Z",
      createdAt: "2026-07-29T10:00:00Z",
      batch: { userId: "u-demo-123", jenisIkan: "Tongkol Super" },
      buyer: { nama: "Restoran Samudra", tipePembeli: "Restoran" },
      market: null,     // BARU
      saleExtras: [],
      receipt: { id: "rec-1", nomorStruk: "INV/20260729/0001" },
    },
    {
      id: "sale-2",
      batchId: "b-2",
      buyerId: "buy-2",
      marketId: null,   // BARU
      beratJual: "80.00",
      hargaSatuan: "38000.00",
      total: "3040000.00",
      statusBayar: "tempo",
      tanggal: "2026-07-30T07:30:00Z",
      createdAt: "2026-07-30T07:30:00Z",
      batch: { userId: "u-demo-123", jenisIkan: "Bandeng Tambak" },
      buyer: { nama: "Bu Sri (Pedagang Pasar)", tipePembeli: "Pedagang Pasar" },
      market: null,     // BARU
      saleExtras: [],
      receipt: { id: "rec-2", nomorStruk: "INV/20260730/0002" },
    },
  ];
  ```

- [ ] **Step 4: Rewrite `mockMarkets` sesuai type `ApiMarket` baru**

  Hapus seluruh array `mockMarkets` yang lama dan ganti dengan versi yang sesuai type baru (tanpa `jarakKm`, tanpa `itemPesanan`, buyers hanya punya field yang ada di `ApiMarketBuyer`):

  ```ts
  import type { ApiBuyer, ApiSale, ApiMarket, ApiDeliverySchedule, ... } from "./api";

  export const mockMarkets: ApiMarket[] = [
    {
      id: "mkt-1",
      namaPasar: "Pasar Ratu Jepara",
      nama_pasar: "Pasar Ratu Jepara",
      alamat: "Jl. Pemuda No. 45, Jobokuto, Kec. Jepara, Kab. Jepara",
      latitude: -6.5925,
      longitude: 110.6698,
      kategori: "Pasar Tradisional",
      totalBuyers: 1,
      totalPesanan: 3,
      buyers: [
        { id: "buy-2", nama: "Bu Sri (Pedagang Pasar)", namaPembeli: "Bu Sri (Pedagang Pasar)", telepon: "085211223344", tipePembeli: "Pedagang Lapak", marketId: "mkt-1" },
      ],
      pembeliList: [
        { id: "buy-2", nama: "Bu Sri (Pedagang Pasar)", namaPembeli: "Bu Sri (Pedagang Pasar)", telepon: "085211223344", tipePembeli: "Pedagang Lapak", marketId: "mkt-1" },
      ],
      createdAt: "2026-07-20T00:00:00Z",
    },
    {
      id: "mkt-2",
      namaPasar: "TPI Kedungmalang",
      nama_pasar: "TPI Kedungmalang",
      alamat: "Kawasan Tempat Pelelangan Ikan Kedungmalang, Kedung, Jepara",
      latitude: -6.6542,
      longitude: 110.6421,
      kategori: "TPI Pelelangan",
      totalBuyers: 0,
      totalPesanan: 2,
      buyers: [],
      pembeliList: [],
      createdAt: "2026-07-20T00:00:00Z",
    },
    {
      id: "mkt-3",
      namaPasar: "Pusat Seafood Kalinyamatan",
      nama_pasar: "Pusat Seafood Kalinyamatan",
      alamat: "Jl. Raya Kalinyamatan No. 18, Jepara",
      latitude: -6.7112,
      longitude: 110.7205,
      kategori: "Pusat Restoran",
      totalBuyers: 1,
      totalPesanan: 2,
      buyers: [
        { id: "buy-1", nama: "Restoran Samudra", namaPembeli: "Restoran Samudra", telepon: "08198765432", tipePembeli: "Restoran", marketId: "mkt-3" },
      ],
      pembeliList: [
        { id: "buy-1", nama: "Restoran Samudra", namaPembeli: "Restoran Samudra", telepon: "08198765432", tipePembeli: "Restoran", marketId: "mkt-3" },
      ],
      createdAt: "2026-07-20T00:00:00Z",
    },
  ];
  ```

- [ ] **Step 5: Tambah `mockDeliverySchedules`**

  ```ts
  export const mockDeliverySchedules: ApiDeliverySchedule[] = [
    {
      id: "sch-1",
      saleId: "sale-1",
      sale_id: "sale-1",
      scheduledAt: new Date(Date.now() + 1000 * 3600 * 3).toISOString(),
      scheduled_at: new Date(Date.now() + 1000 * 3600 * 3).toISOString(),
      catatan: "Kirim sebelum jam 05:30 WIB subuh.",
      createdAt: new Date().toISOString(),
      sale: {
        id: "sale-1",
        invoice_number: "INV/20260729/0001",
        berat_jual: 50,
        harga_satuan: 35000,
        total: 1750000,
        status_bayar: "lunas",
        tanggal: "2026-07-29T10:00:00Z",
      },
      buyer: { id: "buy-1", nama: "Restoran Samudra", telepon: "08198765432", tipe_pembeli: "Restoran" },
      market: {
        id: "mkt-3",
        namaPasar: "Pusat Seafood Kalinyamatan",
        nama_pasar: "Pusat Seafood Kalinyamatan",
        alamat: "Jl. Raya Kalinyamatan No. 18, Jepara",
        latitude: -6.7112,
        longitude: 110.7205,
        kategori: "Pusat Restoran",
      },
    },
    {
      id: "sch-2",
      saleId: "sale-2",
      sale_id: "sale-2",
      scheduledAt: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      scheduled_at: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      catatan: "Ditimbang di dermaga TPI.",
      createdAt: new Date().toISOString(),
      sale: {
        id: "sale-2",
        invoice_number: "INV/20260730/0002",
        berat_jual: 80,
        harga_satuan: 38000,
        total: 3040000,
        status_bayar: "tempo",
        tanggal: "2026-07-30T07:30:00Z",
      },
      buyer: { id: "buy-2", nama: "Bu Sri (Pedagang Pasar)", telepon: "085211223344", tipe_pembeli: "Pedagang Pasar" },
      market: {
        id: "mkt-1",
        namaPasar: "Pasar Ratu Jepara",
        nama_pasar: "Pasar Ratu Jepara",
        alamat: "Jl. Pemuda No. 45, Jepara",
        latitude: -6.5925,
        longitude: 110.6698,
        kategori: "Pasar Tradisional",
      },
    },
  ];
  ```

- [ ] **Step 6: Update import di baris 1 mockData.ts — import dari api.ts**

  ```ts
  import type {
    ApiUser,
    ProfileData,
    DashboardSummary,
    ApiBatch,
    ApiBuyer,
    ApiSupplier,
    ApiSale,
    ApiBatchExpense,
    ApiPayment,
    ApiMarket,
    ApiMarketBuyer,
    ApiDeliverySchedule,
  } from "./api";
  ```

- [ ] **Step 7: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```

  Tidak ada error dari `mockData.ts`.

- [ ] **Step 8: Commit**

  ```bash
  git add src/services/mockData.ts
  git commit -m "fix(mock): align mockData with new backend-aligned ApiMarket, ApiMarketBuyer types, add mockDeliverySchedules"
  ```

---

## Task 3: Tambah `haversineDistanceKm` ke `src/utils/index.ts`

**Files:**
- Modify: `src/utils/index.ts`

### Langkah

- [ ] **Step 1: Buka `src/utils/index.ts` dan tambahkan fungsi Haversine**

  Tambahkan di akhir file:

  ```ts
  /**
   * Menghitung jarak antara dua koordinat GPS menggunakan formula Haversine.
   * Mengembalikan jarak dalam kilometer, dibulatkan ke 1 desimal.
   */
  export function haversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // radius bumi dalam km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
  ```

- [ ] **Step 2: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep utils
  ```

  Tidak ada error.

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/index.ts
  git commit -m "feat(utils): add haversineDistanceKm utility function"
  ```

---

## Task 4: Buat `src/store/markets-store.ts`

**Files:**
- Create: `src/store/markets-store.ts`

### Langkah

- [ ] **Step 1: Buat file `src/store/markets-store.ts`**

  ```ts
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
  ```

- [ ] **Step 2: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep markets-store
  ```

  Tidak ada error.

- [ ] **Step 3: Commit**

  ```bash
  git add src/store/markets-store.ts
  git commit -m "feat(store): add useMarketsStore for markets CRUD state management"
  ```

---

## Task 5: Buat `src/store/delivery-store.ts`

**Files:**
- Create: `src/store/delivery-store.ts`

### Langkah

- [ ] **Step 1: Buat file `src/store/delivery-store.ts`**

  ```ts
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
  ```

- [ ] **Step 2: Export kedua store baru di `src/store/index.ts`**

  Buka `src/store/index.ts` dan tambahkan:

  ```ts
  export { useMarketsStore } from "./markets-store";
  export { useDeliveryStore } from "./delivery-store";
  ```

- [ ] **Step 3: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep -E "delivery|markets"
  ```

  Tidak ada error.

- [ ] **Step 4: Commit**

  ```bash
  git add src/store/delivery-store.ts src/store/index.ts
  git commit -m "feat(store): add useDeliveryStore for delivery schedules state management"
  ```

---

## Task 6: Wire `app/notifications.tsx` ke Delivery Schedules API

**Files:**
- Modify: `app/notifications.tsx`

### Langkah

- [ ] **Step 1: Update imports di baris 1 `notifications.tsx`**

  Tambahkan import:
  ```ts
  import { useDeliveryStore } from "../src/store";
  import type { ApiDeliverySchedule } from "../src/services/api";
  import { ActivityIndicator, Alert } from "react-native";
  ```

  (`Alert` sudah mungkin ada, pastikan `ActivityIndicator` juga diimport dari `react-native`.)

- [ ] **Step 2: Tambahkan adapter function `scheduleToReminder` sebelum komponen**

  Sisipkan sebelum `export default function NotificationsScreen()`:

  ```ts
  function scheduleToReminder(s: ApiDeliverySchedule): DeliveryReminder {
    const date = new Date(s.scheduledAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDay = new Date(date);
    scheduleDay.setHours(0, 0, 0, 0);
    const isPast = date < new Date();
    const isToday = scheduleDay.getTime() === today.getTime();

    return {
      id: s.id,
      tanggal: date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      jam: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      hari: isPast ? "Selesai" : isToday ? "Hari Ini" : "Mendatang",
      status: isToday ? "Diantar Hari Ini" : isPast ? "Sudah Diantar" : "Jadwal Mendatang",
      pasar: s.market?.namaPasar ?? "Pasar Tidak Diketahui",
      jarak: "",
      pembeli: s.buyer?.nama ?? "Pembeli Tidak Diketahui",
      telepon: s.buyer?.telepon ?? "",
      items: s.sale
        ? [
            {
              jenis: `Pesanan #${s.sale.invoice_number}`,
              berat: s.sale.berat_jual,
              harga: s.sale.harga_satuan,
            },
          ]
        : [],
      totalHarga: s.sale?.total ?? 0,
      catatan: s.catatan ?? undefined,
    };
  }
  ```

- [ ] **Step 3: Ubah komponen — ganti `reminders` hardcode dengan store**

  Di dalam `export default function NotificationsScreen()`, ganti:

  ```ts
  // HAPUS semua ini:
  const reminders: DeliveryReminder[] = [
    { id: "rem-1", ... },
    { id: "rem-2", ... },
    { id: "rem-3", ... },
  ];
  ```

  Dengan:

  ```ts
  const { schedules, isLoading, fetchSchedules, deleteSchedule } = useDeliveryStore();

  useEffect(() => {
    fetchSchedules().catch((err) => console.error(err));
  }, [fetchSchedules]);

  const reminders = schedules.map(scheduleToReminder);
  ```

- [ ] **Step 4: Tambah loading state — di atas ScrollView**

  Ganti blok `<ScrollView ...>` dengan:

  ```tsx
  {isLoading && reminders.length === 0 ? (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.royalBlue} />
      <Text style={{ color: Colors.textMuted, marginTop: 8, fontSize: rfs(12) }}>
        Memuat jadwal pengantaran...
      </Text>
    </View>
  ) : reminders.length === 0 ? (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing(32) }}>
      <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
      <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: rfs(13), textAlign: "center" }}>
        Belum ada jadwal pengantaran.{"\n"}Buat jadwal dari halaman transaksi.
      </Text>
    </View>
  ) : (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: spacing(16), paddingBottom: spacing(40) }}
      showsVerticalScrollIndicator={false}
    >
      {filteredReminders.map((rem) => {
        // ... kode kartu reminder yang sudah ada
      })}
    </ScrollView>
  )}
  ```

- [ ] **Step 5: Tambah tombol hapus jadwal di expanded card**

  Di dalam blok `{isExpanded && (...)`, setelah tombol "Lihat di Peta" dan "Hubungi WA", tambahkan tombol hapus:

  ```tsx
  <TouchableOpacity
    onPress={() => {
      Alert.alert(
        "Hapus Jadwal",
        "Yakin ingin menghapus jadwal pengantaran ini?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteSchedule(rem.id);
              } catch {
                Alert.alert("Gagal", "Tidak dapat menghapus jadwal.");
              }
            },
          },
        ]
      );
    }}
    style={[styles.btnMap, { backgroundColor: "#ef4444" }]}
    activeOpacity={0.85}
  >
    <Ionicons name="trash-outline" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
    <Text style={styles.btnText}>Hapus Jadwal</Text>
  </TouchableOpacity>
  ```

- [ ] **Step 6: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep notifications
  ```

  Tidak ada error.

- [ ] **Step 7: Commit**

  ```bash
  git add app/notifications.tsx
  git commit -m "feat(notifications): wire delivery schedules API, add adapter, remove hardcoded data"
  ```

---

## Task 7: Wire `app/input-pembeli.tsx` — Market Selector dari API

**Files:**
- Modify: `app/input-pembeli.tsx`

### Langkah

- [ ] **Step 1: Update import di baris atas `input-pembeli.tsx`**

  Pastikan `useMarketsStore` diimport:

  ```ts
  import { useFishStore, useBuyerStore, useTransactionStore, useMarketsStore } from "../src/store";
  ```

- [ ] **Step 2: Tambahkan store dan state baru di dalam komponen**

  Di dalam `export default function InputPembeliScreen()`, tambahkan setelah baris deklarasi store yang ada:

  ```ts
  const { markets, fetchMarkets } = useMarketsStore();

  // Ganti state marketLocation yang hanya string dengan dua state:
  const [selectedMarketName, setSelectedMarketName] = useState((params.lokasi_pasar as string) || "");
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  ```

  **Hapus** baris ini yang ada:
  ```ts
  const [marketLocation, setMarketLocation] = useState((params.lokasi_pasar as string) || "Pasar Ratu Jepara");
  ```

- [ ] **Step 3: Update `useEffect` untuk tambahkan `fetchMarkets`**

  Ubah `useEffect` yang ada:

  ```ts
  useEffect(() => {
    fetchStocks().catch((err) => console.error(err));
    fetchBuyers().catch((err) => console.error(err));
    fetchMarkets().catch((err) => console.error(err));   // BARU
  }, [fetchStocks, fetchBuyers, fetchMarkets]);
  ```

- [ ] **Step 4: Hapus `availableMarkets` hardcoded dan ganti `filteredMarketsList`**

  **Hapus** const `availableMarkets` (baris 57–69 yang berisi 11 pasar hardcoded).

  **Ganti** `filteredMarketsList`:

  ```ts
  const filteredMarketsList = markets.filter(
    (m) =>
      m.namaPasar.toLowerCase().includes(searchMarketQuery.toLowerCase()) ||
      m.alamat.toLowerCase().includes(searchMarketQuery.toLowerCase())
  );
  ```

- [ ] **Step 5: Update `handleSelectMarket`**

  Ubah:
  ```ts
  // HAPUS:
  const handleSelectMarket = (namaPasar: string) => {
    setMarketLocation(namaPasar);
    setShowMarketModal(false);
  };
  ```

  Dengan:
  ```ts
  const handleSelectMarket = (market: { id: string; namaPasar: string }) => {
    setSelectedMarketName(market.namaPasar);
    setSelectedMarketId(market.id);
    setShowMarketModal(false);
  };
  ```

- [ ] **Step 6: Update render market location field di JSX**

  Cari semua penggunaan `marketLocation` di JSX dan ganti dengan `selectedMarketName`:

  ```tsx
  // Baris ~532:
  <Text style={{ color: selectedMarketName ? "#00072d" : "#64748b", fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
    {selectedMarketName || "Pilih Lokasi Pasar"}
  </Text>
  ```

- [ ] **Step 7: Update `FlatList` di market modal — ganti data dan onPress**

  Cari bagian FlatList yang merender market items, ubah:

  ```tsx
  data={filteredMarketsList}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectMarket({ id: item.id, namaPasar: item.namaPasar })}
      // ... styling existing
    >
      <Text style={{ ... }}>{item.namaPasar}</Text>
      <Text style={{ ... }}>{item.alamat}</Text>
    </TouchableOpacity>
  )}
  ```

- [ ] **Step 8: Kirim `market_id` di `handleCreateBuyer`**

  Ubah:
  ```ts
  const created = await addBuyer({
    nama: newBuyerName.trim(),
    telepon: newBuyerPhone.trim() || undefined,
    tipe_pembeli: "perorangan",
    market_id: selectedMarketId,   // BARU
  });
  ```

- [ ] **Step 9: Kirim `market_id` di `handleSave` saat `createSale`**

  Ubah:
  ```ts
  const newSale = await createSale({
    batch_id: matchedFish!.id,
    buyer_id: buyerId,
    berat_jual: qtyNum,
    harga_satuan: priceNum,
    status_bayar: paymentMethod,
    tanggal: new Date().toISOString(),
    extras: extras,
    market_id: selectedMarketId,   // BARU
  });
  ```

- [ ] **Step 10: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep input-pembeli
  ```

  Tidak ada error.

- [ ] **Step 11: Commit**

  ```bash
  git add app/input-pembeli.tsx
  git commit -m "feat(input-pembeli): wire market selector to API, send market_id to buyer and sale"
  ```

---

## Task 8: Update `app/map.tsx` — Fix Types, Haversine, Enrich Buyers, Market CRUD

**Files:**
- Modify: `app/map.tsx`

### Langkah

- [ ] **Step 1: Update imports di baris 1–23**

  **Hapus** baris 23:
  ```ts
  import { ApiMarket, ApiMarketBuyer, ApiMarketBuyerOrder } from "../src/services/mockData";
  ```

  **Ganti** dengan:
  ```ts
  import { marketsApi, type ApiMarket, type ApiMarketBuyer } from "../src/services/api";
  import { useMarketsStore, useDeliveryStore } from "../src/store";
  import { haversineDistanceKm } from "../src/utils";
  ```

- [ ] **Step 2: Ubah state management — pakai store**

  Di dalam komponen, ganti:
  ```ts
  // HAPUS:
  const [markets, setMarkets] = useState<ApiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  // ...
  const loadMarkets = async () => {
    setLoading(true);
    try {
      const res = await marketsApi.list();
      setMarkets(res.markets);
    } catch (err) {
      console.error("Failed to load markets:", err);
    } finally {
      setLoading(false);
    }
  };
  ```

  **Ganti** dengan:
  ```ts
  const { markets, isLoading: marketsLoading, fetchMarkets, addMarket, updateMarket, deleteMarket } = useMarketsStore();
  const { schedules, fetchSchedules } = useDeliveryStore();

  // Koordinat default Jepara sebagai fallback
  const USER_LAT = -6.5925;
  const USER_LNG = 110.6698;

  // Augment markets dengan jarakKm (Haversine)
  const marketsWithDistance: ApiMarket[] = markets.map((m) => ({
    ...m,
    jarakKm: haversineDistanceKm(USER_LAT, USER_LNG, m.latitude, m.longitude),
  }));
  ```

- [ ] **Step 3: Update useEffect**

  Ubah:
  ```ts
  useEffect(() => {
    loadMarkets();
  }, []);
  ```

  Dengan:
  ```ts
  useEffect(() => {
    fetchMarkets().catch(console.error);
    fetchSchedules().catch(console.error);
  }, [fetchMarkets, fetchSchedules]);
  ```

- [ ] **Step 4: Update `filteredMarkets` untuk pakai `marketsWithDistance`**

  Ganti:
  ```ts
  const filteredMarkets = markets.filter(...)
  ```

  Dengan:
  ```ts
  const filteredMarkets = marketsWithDistance.filter((m) => {
    const matchesSearch =
      m.namaPasar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.alamat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || m.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  ```

- [ ] **Step 5: Tambah state untuk market CRUD form**

  Di dalam komponen, setelah state yang ada:
  ```ts
  // Market CRUD form state
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [editingMarket, setEditingMarket] = useState<ApiMarket | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formKategori, setFormKategori] = useState<"Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran">("Pasar Tradisional");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [isSavingMarket, setIsSavingMarket] = useState(false);
  ```

- [ ] **Step 6: Tambah fungsi `handleSaveMarket` dan `handleDeleteMarket`**

  ```ts
  const handleSaveMarket = async () => {
    if (!formNama.trim() || !formAlamat.trim()) {
      Alert.alert("Validasi", "Nama dan alamat pasar wajib diisi.");
      return;
    }
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Validasi", "Koordinat harus berupa angka desimal.");
      return;
    }

    setIsSavingMarket(true);
    try {
      if (editingMarket) {
        await updateMarket(editingMarket.id, {
          nama_pasar: formNama.trim(),
          alamat: formAlamat.trim(),
          latitude: lat,
          longitude: lng,
          kategori: formKategori,
        });
      } else {
        await addMarket({
          nama_pasar: formNama.trim(),
          alamat: formAlamat.trim(),
          latitude: lat,
          longitude: lng,
          kategori: formKategori,
        });
      }
      setShowMarketForm(false);
      setEditingMarket(null);
      setFormNama("");
      setFormAlamat("");
      setFormLat("");
      setFormLng("");
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyimpan pasar.");
    } finally {
      setIsSavingMarket(false);
    }
  };

  const handleDeleteMarket = (market: ApiMarket) => {
    Alert.alert(
      "Hapus Pasar",
      `Yakin ingin menghapus "${market.namaPasar}"? Pastikan tidak ada pembeli yang terhubung.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMarket(market.id);
              closeMarketDetail();
            } catch (err: any) {
              const msg = err?.response?.data?.error?.message ?? "Tidak dapat menghapus pasar.";
              Alert.alert("Gagal", msg);
            }
          },
        },
      ]
    );
  };
  ```

- [ ] **Step 7: Fix buyer card di market detail sheet**

  Di blok yang merender `selectedMarket.pembeliList.map(...)`, **hapus** semua referensi ke:
  - `buyer.itemPesanan`
  - `buyer.statusPesanan`
  - `buyer.totalHarga`

  **Ganti** expanded content buyer dengan versi baru yang enrich via schedules:

  ```tsx
  {isExpanded && (
    <View style={styles.expandedContent}>
      {/* Tipe Pembeli */}
      <View style={styles.detailRow}>
        <View style={[SharedStyles.row, { gap: 5 }]}>
          <Ionicons name="person" size={iconSize(13)} color={Colors.navy} />
          <Text style={styles.detailLabel}>Tipe Pembeli:</Text>
        </View>
        <Text style={styles.detailValueBold}>{buyer.tipePembeli ?? "-"}</Text>
      </View>

      {/* Telepon */}
      <View style={styles.detailRow}>
        <View style={[SharedStyles.row, { gap: 5 }]}>
          <Ionicons name="call" size={iconSize(13)} color={Colors.navy} />
          <Text style={styles.detailLabel}>No. Telepon:</Text>
        </View>
        <Text style={styles.detailValue}>{buyer.telepon ?? "-"}</Text>
      </View>

      {/* Jadwal Pengantaran (dari delivery schedules) */}
      {(() => {
        const buyerSchedules = schedules.filter(
          (s) => s.buyer?.id === buyer.id && s.market?.id === selectedMarket?.id
        );
        if (buyerSchedules.length === 0) {
          return (
            <View style={{ backgroundColor: "#F8FAFC", borderRadius: radius(10), padding: spacing(10), marginTop: spacing(8), borderWidth: 1, borderColor: Colors.divider }}>
              <Text style={{ color: Colors.textMuted, fontSize: rfs(11.5), textAlign: "center" }}>
                Belum ada jadwal pengantaran aktif.
              </Text>
            </View>
          );
        }
        return (
          <View style={{ marginTop: spacing(8) }}>
            <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "700", marginBottom: 4 }}>JADWAL PENGANTARAN:</Text>
            {buyerSchedules.slice(0, 2).map((sch) => (
              <View key={sch.id} style={{ backgroundColor: "#F0F4FF", borderRadius: radius(8), padding: spacing(8), marginBottom: 6 }}>
                <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "bold" }}>
                  {new Date(sch.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — {new Date(sch.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </Text>
                {sch.catatan && <Text style={{ color: Colors.textMuted, fontSize: rfs(11) }}>{sch.catatan}</Text>}
                {sch.sale && (
                  <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "800", marginTop: 2 }}>
                    Total: {formatCurrency(sch.sale.total)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        );
      })()}

      {/* Action Buttons */}
      <View style={[SharedStyles.row, { gap: 10, marginTop: spacing(12) }]}>
        <TouchableOpacity
          onPress={() => handleOpenWa(buyer, selectedMarket!.namaPasar)}
          style={styles.btnWa}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Hubungi WA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { closeMarketDetail(); router.push("/tambah"); }}
          style={styles.btnProcess}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={iconSize(16)} color={Colors.royalBlue} style={{ marginRight: 6 }} />
          <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "bold" }}>
            Proses Transaksi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
  ```

- [ ] **Step 8: Tambah tombol Edit + Hapus di market detail sheet header**

  Di blok `{isSheetOpen && selectedMarket && (...)`, di dalam `sheetHeader`, setelah baris yang menampilkan `badgeCategory` dan jarak, tambahkan baris tombol:

  ```tsx
  {/* Edit & Hapus Pasar */}
  <View style={[SharedStyles.row, { gap: 8, marginTop: spacing(8) }]}>
    <TouchableOpacity
      onPress={() => {
        setEditingMarket(selectedMarket);
        setFormNama(selectedMarket.namaPasar);
        setFormAlamat(selectedMarket.alamat);
        setFormKategori(selectedMarket.kategori);
        setFormLat(String(selectedMarket.latitude));
        setFormLng(String(selectedMarket.longitude));
        setShowMarketForm(true);
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: Colors.royalBlueMuted, borderRadius: radius(8) }}
    >
      <Ionicons name="create-outline" size={iconSize(14)} color={Colors.royalBlue} />
      <Text style={{ color: Colors.royalBlue, fontSize: rfs(11), fontWeight: "700" }}>Edit</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => handleDeleteMarket(selectedMarket)}
      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: radius(8) }}
    >
      <Ionicons name="trash-outline" size={iconSize(14)} color="#ef4444" />
      <Text style={{ color: "#ef4444", fontSize: rfs(11), fontWeight: "700" }}>Hapus</Text>
    </TouchableOpacity>
  </View>
  ```

- [ ] **Step 9: Tambah FAB (+) dan Bottom Sheet Form Pasar**

  Di dalam JSX utama (sebelum penutup `</View>`), tambahkan:

  ```tsx
  {/* FAB Tambah Pasar */}
  <TouchableOpacity
    style={[styles.gpsButton, { bottom: isSheetOpen ? SCREEN_H * 0.74 + 60 : 90, backgroundColor: Colors.navy }]}
    onPress={() => {
      setEditingMarket(null);
      setFormNama("");
      setFormAlamat("");
      setFormKategori("Pasar Tradisional");
      setFormLat("");
      setFormLng("");
      setShowMarketForm(true);
    }}
    activeOpacity={0.85}
  >
    <Ionicons name="add" size={iconSize(24)} color="#ffffff" />
  </TouchableOpacity>

  {/* Bottom Sheet: Form Tambah / Edit Pasar */}
  {showMarketForm && (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, justifyContent: "flex-end" }}>
      <View style={{ backgroundColor: "#fff", borderTopLeftRadius: radius(24), borderTopRightRadius: radius(24), padding: spacing(24), paddingBottom: spacing(40) }}>
        <Text style={{ ...Type.h2, fontSize: rfs(16), marginBottom: spacing(16) }}>
          {editingMarket ? "Edit Pasar" : "Tambah Pasar Baru"}
        </Text>

        {[
          { label: "Nama Pasar *", value: formNama, set: setFormNama, placeholder: "Contoh: Pasar Ratu Jepara" },
          { label: "Alamat *", value: formAlamat, set: setFormAlamat, placeholder: "Alamat lengkap pasar" },
          { label: "Latitude", value: formLat, set: setFormLat, placeholder: "-6.5925", numeric: true },
          { label: "Longitude", value: formLng, set: setFormLng, placeholder: "110.6698", numeric: true },
        ].map(({ label, value, set, placeholder, numeric }) => (
          <View key={label} style={{ marginBottom: spacing(12) }}>
            <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "600", marginBottom: 4 }}>{label}</Text>
            <TextInput
              style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: radius(10), paddingHorizontal: 12, fontSize: rfs(13), color: "#00072d" }}
              value={value}
              onChangeText={set}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              keyboardType={numeric ? "decimal-pad" : "default"}
            />
          </View>
        ))}

        {/* Kategori Picker */}
        <View style={{ marginBottom: spacing(16) }}>
          <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "600", marginBottom: 4 }}>Kategori</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["Pasar Tradisional", "TPI Pelelangan", "Pusat Restoran"] as const).map((kat) => (
              <TouchableOpacity
                key={kat}
                onPress={() => setFormKategori(kat)}
                style={{ flex: 1, paddingVertical: 8, borderRadius: radius(8), alignItems: "center", backgroundColor: formKategori === kat ? Colors.navy : "#e5eaf7" }}
              >
                <Text style={{ fontSize: rfs(10), fontWeight: "700", color: formKategori === kat ? "#fff" : Colors.navy, textAlign: "center" }}>{kat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => { setShowMarketForm(false); setEditingMarket(null); }}
            style={{ flex: 1, height: 48, borderRadius: radius(12), alignItems: "center", justifyContent: "center", backgroundColor: "#e5eaf7" }}
          >
            <Text style={{ color: Colors.navy, fontWeight: "bold", fontSize: rfs(13) }}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveMarket}
            disabled={isSavingMarket}
            style={{ flex: 2, height: 48, borderRadius: radius(12), alignItems: "center", justifyContent: "center", backgroundColor: Colors.navy }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: rfs(13) }}>
              {isSavingMarket ? "Menyimpan..." : editingMarket ? "Simpan Perubahan" : "Tambah Pasar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )}
  ```

- [ ] **Step 10: Pastikan `handleOpenWa` menerima `ApiMarketBuyer` baru (tanpa `itemPesanan`)**

  Ubah signature dan isi fungsi:

  ```ts
  const handleOpenWa = (buyer: ApiMarketBuyer, marketName: string) => {
    const message = `Halo ${buyer.namaPembeli}, mengenai pesanan kulakan ikan Anda untuk pengiriman ke ${marketName}...`;
    const url = `https://api.whatsapp.com/send?phone=${buyer.telepon}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => console.warn("Cannot open WhatsApp"));
  };
  ```

- [ ] **Step 11: Verifikasi TypeScript**

  ```bash
  npx tsc --noEmit 2>&1 | grep map.tsx
  ```

  Tidak ada error. Khususnya tidak ada error terkait `ApiMarketBuyerOrder` atau `itemPesanan`.

- [ ] **Step 12: Commit**

  ```bash
  git add app/map.tsx
  git commit -m "feat(map): fix types, add Haversine distance, enrich buyer view via schedules, add market CRUD UI"
  ```

---

## Task 9: Final Verification

- [ ] **Step 1: Full TypeScript check**

  ```bash
  cd /home/hyprland/NasywanPrivat/LOMBA/kulakan/frontend
  npx tsc --noEmit 2>&1
  ```

  Expected: **0 errors**. Jika ada error, trace ke task yang relevan dan fix.

- [ ] **Step 2: Run frontend existing tests**

  ```bash
  bun test
  ```

  Expected: semua existing tests passing (tidak ada yang baru broken).

- [ ] **Step 3: Verifikasi backend tests tidak terpengaruh**

  ```bash
  cd /home/hyprland/NasywanPrivat/LOMBA/kulakan/backend
  bun test
  ```

  Expected: 89/89 passing.

- [ ] **Step 4: Manual check — jalankan dev server**

  ```bash
  cd /home/hyprland/NasywanPrivat/LOMBA/kulakan/frontend
  npm run web
  ```

  Navigasi ke:
  - `/map` → markets muncul dari store, bukan hardcode → klik pasar → sheet terbuka → buyer list tanpa crash → FAB (+) → form muncul
  - `/notifications` → schedules dari store atau mock fallback → adapter menghasilkan data yang benar
  - `/tambah` → buka transaksi → pilih pembeli → market picker load dari store
