# Frontend Integration: Markets & Delivery Schedules API

**Date:** 2026-08-04  
**Backend Commit:** `c5b2bc0` (branch `dev/mastay`)  
**Frontend Branch:** `dev/bay`  
**Status:** Design Approved — Ready for Implementation

---

## Background

Backend commit `c5b2bc0` menambahkan dua fitur utama (Plan 13):
1. **Markets API** — CRUD pasar dengan embedded buyers
2. **Delivery Schedules API** — jadwal pengantaran per transaksi sale

Frontend di commit `e36c4ed` sudah memiliki UI untuk fitur ini (map, notifications, input-pembeli market picker), namun **semuanya masih menggunakan mock data hardcode** dan belum terhubung ke backend baru.

Tujuan integrasi ini adalah menyambungkan seluruh UI frontend yang sudah ada ke endpoint backend yang baru.

---

## Gap Analysis

| Area | Status Sekarang | Status Target |
|---|---|---|
| `ApiMarket` type | Di `mockData.ts` — tidak match backend | Dipindah ke `api.ts`, aligned backend |
| `ApiMarketBuyer` type | Kaya (`itemPesanan[]`, `statusPesanan`) — tidak ada di backend | Disederhanakan sesuai backend response |
| `ApiDeliverySchedule` type | Tidak ada | Dibuat baru di `api.ts` |
| `marketsApi` | Hanya `list()` dan `get()` | Tambah `create`, `update`, `delete` |
| `deliverySchedulesApi` | Tidak ada | Dibuat baru |
| `useMarketsStore` | Tidak ada | Dibuat baru |
| `useDeliveryStore` | Tidak ada | Dibuat baru |
| `notifications.tsx` | Hardcoded 3 reminder statis | Wire ke `GET /delivery-schedules` |
| `map.tsx` — market list | Dari `GET /markets` tapi type mismatch | Fix type + enrich buyer view |
| `map.tsx` — jarak km | `jarakKm` dari mock | Hitung Haversine di frontend |
| `map.tsx` — market CRUD | Tidak ada | FAB + bottom sheet form |
| `input-pembeli.tsx` | `availableMarkets` hardcoded (11 statis) | Wire ke `GET /markets` |
| `buyersApi.create()` | Tidak kirim `market_id` | Tambah `market_id` opsional |
| `salesApi.create()` | Tidak kirim `market_id` | Tambah `market_id` opsional |

---

## Approach: "Layer by Layer" (Opsi A)

Integrasi bertahap mengikuti pola arsitektur yang sudah ada: `api.ts` → `Zustand store` → `screen component`. Tidak ada perubahan navigasi utama.

---

## Proposed Changes

### 1. Type System (`src/services/api.ts`)

#### Tipe yang perlu diperbaiki

**`ApiBuyer`** — tambah field `marketId`:
```ts
export interface ApiBuyer {
  id: string;
  userId: string;
  nama: string;
  telepon: string | null;
  tipePembeli: string | null;
  marketId: string | null;   // BARU
  createdAt: string;
}
```

**`ApiSale`** — tambah field `marketId` dan `market`:
```ts
export interface ApiSale {
  // ... existing fields
  marketId: string | null;   // BARU
  market: {
    id: string;
    namaPasar: string;
    alamat: string;
    latitude: number;
    longitude: number;
    kategori: string;
  } | null; // BARU
}
```

#### Tipe baru

**`ApiMarket`** — dipindah dari `mockData.ts` ke `api.ts`, diubah sesuai backend response:
```ts
export interface ApiMarket {
  id: string;
  userId: string;
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
  // computed di frontend:
  jarakKm?: number;  // dihitung Haversine, bukan dari API
}
```

**`ApiMarketBuyer`** — disederhanakan sesuai backend:
```ts
export interface ApiMarketBuyer {
  id: string;
  nama: string;
  namaPembeli: string;
  telepon: string | null;
  tipePembeli: string | null;
  marketId: string;
}
```

**`ApiDeliverySchedule`** — baru:
```ts
export interface ApiDeliverySchedule {
  id: string;
  saleId: string;
  sale_id: string;
  scheduledAt: string;
  scheduled_at: string;
  catatan: string | null;
  createdAt: string;
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

---

### 2. API Service (`src/services/api.ts`)

#### `marketsApi` — tambah create, update, delete

```ts
create: async (data: {
  nama_pasar: string;
  alamat: string;
  latitude: number;
  longitude: number;
  kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran";
}) => callOrMock(
  async () => unwrap<{ market: ApiMarket }>(await apiClient.post("/markets", data)),
  { market: { id: `mkt-${Date.now()}`, ...data, namaPasar: data.nama_pasar, buyers: [], pembeliList: [], totalBuyers: 0, totalPesanan: 0, createdAt: new Date().toISOString() } }
),

update: async (id: string, data: Partial<CreateMarketData>) => callOrMock(
  async () => unwrap<{ market: ApiMarket }>(await apiClient.patch(`/markets/${id}`, data)),
  { market: { ...(mockMarkets.find(m => m.id === id) || mockMarkets[0]), ...data } }
),

delete: async (id: string) => {
  if (isMockMode()) return;
  await apiClient.delete(`/markets/${id}`);
},
```

#### `deliverySchedulesApi` — baru

```ts
export const deliverySchedulesApi = {
  list: async () => callOrMock(
    async () => unwrap<{ schedules: ApiDeliverySchedule[] }>(
      await apiClient.get("/delivery-schedules")
    ),
    { schedules: mockDeliverySchedules }
  ),

  create: async (saleId: string, data: { scheduled_at: string; catatan?: string }) => callOrMock(
    async () => unwrap<{ schedule: ApiDeliverySchedule }>(
      await apiClient.post(`/sales/${saleId}/schedules`, data)
    ),
    { schedule: { id: `sch-${Date.now()}`, saleId, sale_id: saleId, scheduledAt: data.scheduled_at, scheduled_at: data.scheduled_at, catatan: data.catatan || null, createdAt: new Date().toISOString(), sale: null, buyer: null, market: null } }
  ),

  delete: async (id: string) => {
    if (isMockMode()) return;
    await apiClient.delete(`/schedules/${id}`);
  },
};
```

#### `buyersApi.create` — tambah `market_id`

```ts
create: async (data: {
  nama: string;
  telepon?: string;
  tipe_pembeli?: string;
  market_id?: string | null;  // BARU
}) => ...
```

#### `salesApi.create` — tambah `market_id`

```ts
create: async (data: {
  // ... existing
  market_id?: string | null;  // BARU
}) => ...
```

---

### 3. Zustand Stores

#### [NEW] `src/store/markets-store.ts`

```ts
import { create } from "zustand";
import { marketsApi, type ApiMarket } from "../services/api";

interface CreateMarketData {
  nama_pasar: string;
  alamat: string;
  latitude: number;
  longitude: number;
  kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran";
}

interface MarketsState {
  markets: ApiMarket[];
  isLoading: boolean;
  fetchMarkets: () => Promise<void>;
  addMarket: (data: CreateMarketData) => Promise<ApiMarket>;
  updateMarket: (id: string, data: Partial<CreateMarketData>) => Promise<void>;
  deleteMarket: (id: string) => Promise<void>;
}
```

Pattern: ikuti `buyer-store.ts` — optimistic update, `isLoading`, catch error dan rethrow.

#### [NEW] `src/store/delivery-store.ts`

```ts
import { create } from "zustand";
import { deliverySchedulesApi, type ApiDeliverySchedule } from "../services/api";

interface DeliveryState {
  schedules: ApiDeliverySchedule[];
  isLoading: boolean;
  fetchSchedules: () => Promise<void>;
  addSchedule: (saleId: string, data: { scheduled_at: string; catatan?: string }) => Promise<ApiDeliverySchedule>;
  deleteSchedule: (id: string) => Promise<void>;
}
```

#### [MODIFY] `src/store/index.ts`

```ts
export { useMarketsStore } from "./markets-store";
export { useDeliveryStore } from "./delivery-store";
```

---

### 4. Haversine Utility (`src/utils/index.ts`)

Tambah fungsi:

```ts
export function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
}
```

Koordinat user default: Jepara (-6.5925, 110.6698) jika GPS tidak tersedia.

---

### 5. `mockData.ts` — Update

- **Hapus** `ApiMarket` dan `ApiMarketBuyer` interface (dipindah ke `api.ts`)
- **Sesuaikan** `mockMarkets` array — hapus `jarakKm`, `itemPesanan`, `statusPesanan`, `totalHarga` dari buyer; sesuaikan dengan type baru
- **Tambah** `mockDeliverySchedules: ApiDeliverySchedule[]` (2-3 item untuk fallback)

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
    sale: { id: "sale-1", invoice_number: "INV/20260729/0001", berat_jual: 50, harga_satuan: 35000, total: 1750000, status_bayar: "lunas", tanggal: new Date().toISOString() },
    buyer: { id: "buy-1", nama: "Restoran Samudra", telepon: "08198765432", tipe_pembeli: "Restoran" },
    market: { id: "mkt-1", namaPasar: "Pasar Ratu Jepara", nama_pasar: "Pasar Ratu Jepara", alamat: "Jl. Pemuda No. 45, Jepara", latitude: -6.5925, longitude: 110.6698, kategori: "Pasar Tradisional" }
  },
  {
    id: "sch-2",
    saleId: "sale-2",
    sale_id: "sale-2",
    scheduledAt: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
    scheduled_at: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
    catatan: "Ditimbang di dermaga TPI.",
    createdAt: new Date().toISOString(),
    sale: { id: "sale-2", invoice_number: "INV/20260730/0002", berat_jual: 80, harga_satuan: 38000, total: 3040000, status_bayar: "tempo", tanggal: new Date().toISOString() },
    buyer: { id: "buy-2", nama: "Bu Sri (Pedagang Pasar)", telepon: "085211223344", tipe_pembeli: "Pedagang Pasar" },
    market: { id: "mkt-2", namaPasar: "TPI Kedungmalang", nama_pasar: "TPI Kedungmalang", alamat: "Kawasan Pelelangan Ikan Kedungmalang", latitude: -6.6542, longitude: 110.6421, kategori: "TPI Pelelangan" }
  },
];
```

---

### 6. `app/notifications.tsx` — Wire ke Backend

#### Perubahan

1. **Hapus** array `reminders[]` hardcoded
2. Import `useDeliveryStore` — `fetchSchedules()` di `useEffect`
3. **Adapter function** `scheduleToReminder(s: ApiDeliverySchedule): DeliveryReminder`:

```ts
function scheduleToReminder(s: ApiDeliverySchedule): DeliveryReminder {
  const date = new Date(s.scheduledAt);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const isPast = date < today;
  return {
    id: s.id,
    tanggal: date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
    jam: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    hari: isPast ? "Selesai" : isToday ? "Hari Ini" : "Mendatang",
    status: isToday ? "Diantar Hari Ini" : isPast ? "Sudah Diantar" : "Jadwal Mendatang",
    pasar: s.market?.namaPasar ?? "Pasar Tidak Diketahui",
    jarak: "",  // bisa diisi Haversine jika GPS tersedia
    pembeli: s.buyer?.nama ?? "Pembeli Tidak Diketahui",
    telepon: s.buyer?.telepon ?? "",
    items: s.sale ? [{ jenis: `Pesanan #${s.sale.invoice_number}`, berat: s.sale.berat_jual, harga: s.sale.harga_satuan }] : [],
    totalHarga: s.sale?.total ?? 0,
    catatan: s.catatan ?? undefined,
  };
}
```

4. **Loading state** — tampilkan `<ActivityIndicator>` saat `isLoading`
5. **Empty state** — tampilkan pesan jika `schedules.length === 0`
6. **Tombol "Hapus Jadwal"** di expanded card → `deleteSchedule(rem.id)` dengan konfirmasi

---

### 7. `app/input-pembeli.tsx` — Wire Market Selector

#### Perubahan

1. Import `useMarketsStore` dari `"../src/store"`
2. Ganti `availableMarkets` (hardcoded const) → `const { markets, fetchMarkets } = useMarketsStore()`
3. **State baru** — ubah `marketLocation: string` menjadi dua state:
   - `selectedMarketName: string` — untuk display
   - `selectedMarketId: string | null` — untuk dikirim ke API
4. `handleSelectMarket(market)` → set `selectedMarketName = market.namaPasar`, `selectedMarketId = market.id`
5. `filteredMarketsList` — filter dari `markets` bukan `availableMarkets`
6. `handleCreateBuyer` → tambahkan `market_id: selectedMarketId`
7. `handleSave` dalam `createSale()` → tambahkan `market_id: selectedMarketId`
8. `useEffect` → tambahkan `fetchMarkets()` di samping `fetchStocks()` dan `fetchBuyers()`

---

### 8. `app/map.tsx` — Market CRUD + Data Enrichment

#### Perubahan: Data Loading

1. Import `useMarketsStore` + `useDeliveryStore`
2. Ganti `marketsApi.list()` lokal → gunakan store
3. `useEffect` → `fetchMarkets()` + `fetchSchedules()`
4. Hitung `jarakKm` via Haversine saat markets di-load

#### Perubahan: Buyer Card (Market Detail Sheet)

Ganti tampilan `buyer.itemPesanan`, `buyer.statusPesanan`, `buyer.totalHarga` dengan:

```ts
// Cari schedules untuk buyer ini di market ini
const buyerSchedules = schedules.filter(
  s => s.buyer?.id === buyer.id && s.market?.id === selectedMarket.id
);
```

Jika `buyerSchedules.length > 0`:
- Tampilkan info jadwal terkini: jam kirim, total, catatan

Jika kosong:
- Tampilkan badge "Belum ada jadwal aktif" + tombol "Buat Jadwal" (navigasi ke transaksi)

#### Perubahan: Market CRUD UI

**FAB (+) Button** — tambah di atas `gpsButton`:
```tsx
<TouchableOpacity style={styles.fabButton} onPress={() => setShowMarketForm(true)}>
  <Ionicons name="add" size={24} color="#ffffff" />
</TouchableOpacity>
```

**Bottom Sheet Form "Tambah/Edit Pasar"** — state baru:
```ts
const [showMarketForm, setShowMarketForm] = useState(false);
const [editingMarket, setEditingMarket] = useState<ApiMarket | null>(null);
const [formNama, setFormNama] = useState("");
const [formAlamat, setFormAlamat] = useState("");
const [formKategori, setFormKategori] = useState<"Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran">("Pasar Tradisional");
const [formLat, setFormLat] = useState("");
const [formLng, setFormLng] = useState("");
```

Form submit → `addMarket()` atau `updateMarket()` dari store.

**Hapus pasar** — tombol di market detail sheet, konfirmasi Alert sebelum `deleteMarket(id)`.

---

## File Change Summary

| File | Type | Description |
|---|---|---|
| `src/services/api.ts` | MODIFY | Fix types (`ApiBuyer`, `ApiSale`), add `ApiMarket`, `ApiMarketBuyer`, `ApiDeliverySchedule` types, complete `marketsApi`, add `deliverySchedulesApi` |
| `src/services/mockData.ts` | MODIFY | Remove old types, align mockMarkets, add `mockDeliverySchedules` |
| `src/store/markets-store.ts` | NEW | Zustand store untuk markets CRUD |
| `src/store/delivery-store.ts` | NEW | Zustand store untuk delivery schedules |
| `src/store/index.ts` | MODIFY | Export 2 store baru |
| `src/utils/index.ts` | MODIFY | Tambah `haversineDistanceKm()` |
| `app/notifications.tsx` | MODIFY | Wire ke `useDeliveryStore`, adapter function, hapus hardcode |
| `app/input-pembeli.tsx` | MODIFY | Wire market selector ke `useMarketsStore`, kirim `market_id` |
| `app/map.tsx` | MODIFY | Fix types, Haversine, enrich buyer view via schedules, tambah CRUD UI |

**Total: 9 files** — 2 baru, 7 dimodifikasi. Tidak ada breaking change pada navigasi atau tab utama.

---

## Verification Plan

### Automated (Existing Tests)
- `bun test` di backend — semua 89 test harus tetap passing (tidak ada perubahan di sini)
- `bun test` di frontend — store tests harus tetap passing

### Manual Verification (Per Feature)
1. **`map.tsx`**: Markets muncul dari API → jarak tampil (Haversine) → tap pasar → buyer list muncul → schedules ter-join per buyer → FAB tambah pasar → form submit → pasar baru muncul di map → edit/hapus pasar bekerja
2. **`notifications.tsx`**: Schedules dari API → transform adapter benar → filter chip bekerja → hapus jadwal
3. **`input-pembeli.tsx`**: Market picker load dari API → pilih pasar → submit → cek di DB bahwa `market_id` tersimpan di `sales` dan `buyers`
4. **Type safety**: Tidak ada `undefined` runtime error dari type mismatch

---

## Open Notes

- **`items[].jenis`** di `notifications.tsx`: Backend tidak menyimpan jenis ikan di `delivery_schedules`. Solusi: tampilkan struk nomor (`invoice_number`) sebagai label item. Data ikan lengkap ada di `batch` tabel yang tidak diinclude. Ini trade-off yang diterima — jika nanti diperlukan, bisa extend `GET /delivery-schedules` untuk join ke batch.
- **GPS location**: Saat ini pakai koordinat Jepara sebagai default. Bisa di-upgrade ke `expo-location` untuk GPS realtime jika diperlukan di iterasi berikutnya.
- **`Lapak Ikan Basah`** kategori di `mockData.ts` — backend enum hanya punya 3 kategori (`Pasar Tradisional`, `TPI Pelelangan`, `Pusat Restoran`). Mock kategori ini perlu diupdate.
- **Import path di `map.tsx` baris 23** — `import { ApiMarket, ApiMarketBuyer, ApiMarketBuyerOrder } from "../src/services/mockData"` harus diubah ke `import { ApiMarket, ApiMarketBuyer } from "../src/services/api"` setelah type dipindahkan. `ApiMarketBuyerOrder` dihapus (tidak lagi digunakan karena `itemPesanan` tidak ada di backend).
