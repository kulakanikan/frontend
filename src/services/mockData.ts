import type {
  ApiUser,
  ProfileData,
  DashboardSummary,
  ApiBatch,
  ApiBuyer,
  ApiSupplier,
  ApiSale,
  ApiSaleDetail,
  ApiBatchExpense,
  ApiPayment,
} from "./api";

export interface ApiMarketBuyerOrder {
  jenisIkan: string;
  beratKg: number;
  hargaPerKg: number;
  subtotal: number;
}

export interface ApiMarketBuyer {
  id: string;
  namaPembeli: string;
  tipePembeli: string;
  telepon: string;
  statusPesanan: "Menunggu Pengiriman" | "Disiapkan" | "Lunas / Selesai";
  itemPesanan: ApiMarketBuyerOrder[];
  totalHarga: number;
  catatan?: string;
}

export interface ApiMarket {
  id: string;
  namaPasar: string;
  alamat: string;
  jarakKm: number;
  latitude: number;
  longitude: number;
  kategori: "Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran" | "Lapak Ikan Basah";
  totalPesanan: number;
  pembeliList: ApiMarketBuyer[];
}

export const mockUser: ApiUser = {
  id: "u-demo-123",
  nama: "Juragan Ikan",
  email: "juragan@kulakan.id",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  namaUsaha: "UD Bahari Jaya",
  teleponUsaha: "081234567890",
};

export const mockProfile: ProfileData = {
  nama_usaha: "UD Bahari Jaya",
  telepon_usaha: "081234567890",
  nama_google: "Juragan Ikan",
  email: "juragan@kulakan.id",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
};

export const mockDashboardSummary: DashboardSummary = {
  omzet: 18500000,
  laba_riil_total: 4800000,
  stok_tersisa_kg: 420,
  total_piutang: 2500000,
  top_batch: [
    {
      id: "b-1",
      jenis_ikan: "Tongkol",
      diterima_at: "2026-07-28T08:00:00Z",
      total_penjualan: 8500000,
      laba_riil: 2100000,
    },
    {
      id: "b-2",
      jenis_ikan: "Bandeng",
      diterima_at: "2026-07-29T09:30:00Z",
      total_penjualan: 6200000,
      laba_riil: 1600000,
    },
  ],
};

export const mockSuppliers: ApiSupplier[] = [
  {
    id: "sup-1",
    userId: "u-demo-123",
    namaNelayan: "Pak Joko (Nelayan Jepara)",
    telepon: "08123456781",
    alamat: "TPI Kedungmalang, Jepara",
    createdAt: "2026-07-20T00:00:00Z",
  },
  {
    id: "sup-2",
    userId: "u-demo-123",
    namaNelayan: "Pak Slamet (Bandar Pati)",
    telepon: "08139876543",
    alamat: "Tambak Juwana, Pati",
    createdAt: "2026-07-22T00:00:00Z",
  },
];

export const mockBuyers: ApiBuyer[] = [
  {
    id: "buy-1",
    userId: "u-demo-123",
    nama: "Restoran Samudra",
    telepon: "08198765432",
    tipePembeli: "Restoran",
    createdAt: "2026-07-21T00:00:00Z",
  },
  {
    id: "buy-2",
    userId: "u-demo-123",
    nama: "Bu Sri (Pedagang Pasar)",
    telepon: "085211223344",
    tipePembeli: "Pedagang Pasar",
    createdAt: "2026-07-23T00:00:00Z",
  },
];

export const mockBatches: ApiBatch[] = [
  {
    id: "b-1",
    userId: "u-demo-123",
    supplierId: "sup-1",
    jenisIkan: "Tongkol Super",
    berat: "150.00",
    hargaBeliPerKg: "28000.00",
    kondisiKualitas: "Segar Es Tangkapan Subuh",
    sumberInput: "manual",
    status: "aktif",
    diterimaAt: "2026-07-28T08:00:00Z",
    createdAt: "2026-07-28T08:00:00Z",
    suppliers: { namaNelayan: "Pak Joko (Nelayan Jepara)", telepon: "08123456781" },
  },
  {
    id: "b-2",
    userId: "u-demo-123",
    supplierId: "sup-2",
    jenisIkan: "Bandeng Tambak",
    berat: "200.00",
    hargaBeliPerKg: "32000.00",
    kondisiKualitas: "Ukuran 4 ekor/kg",
    sumberInput: "voice",
    status: "aktif",
    diterimaAt: "2026-07-29T09:30:00Z",
    createdAt: "2026-07-29T09:30:00Z",
    suppliers: { namaNelayan: "Pak Slamet (Bandar Pati)", telepon: "08139876543" },
  },
];

export const mockSales: ApiSale[] = [
  {
    id: "sale-1",
    batchId: "b-1",
    buyerId: "buy-1",
    beratJual: "50.00",
    hargaSatuan: "35000.00",
    total: "1750000.00",
    statusBayar: "lunas",
    tanggal: "2026-07-29T10:00:00Z",
    createdAt: "2026-07-29T10:00:00Z",
    batch: { userId: "u-demo-123", jenisIkan: "Tongkol Super" },
    buyer: { nama: "Restoran Samudra", tipePembeli: "Restoran" },
    saleExtras: [],
    receipt: { id: "rec-1", nomorStruk: "INV/20260729/0001" },
  },
  {
    id: "sale-2",
    batchId: "b-2",
    buyerId: "buy-2",
    beratJual: "80.00",
    hargaSatuan: "38000.00",
    total: "3040000.00",
    statusBayar: "tempo",
    tanggal: "2026-07-30T07:30:00Z",
    createdAt: "2026-07-30T07:30:00Z",
    batch: { userId: "u-demo-123", jenisIkan: "Bandeng Tambak" },
    buyer: { nama: "Bu Sri (Pedagang Pasar)", tipePembeli: "Pedagang Pasar" },
    saleExtras: [],
    receipt: { id: "rec-2", nomorStruk: "INV/20260730/0002" },
  },
];

export const mockMarkets: ApiMarket[] = [
  {
    id: "mkt-1",
    namaPasar: "Pasar Ratu Jepara",
    alamat: "Jl. Pemuda No. 45, Jobokuto, Kec. Jepara, Kab. Jepara",
    jarakKm: 1.8,
    latitude: -6.5925,
    longitude: 110.6698,
    kategori: "Pasar Tradisional",
    totalPesanan: 3,
    pembeliList: [
      {
        id: "mb-1",
        namaPembeli: "Bu Sri (Lapak Ikan Basah No. 12)",
        tipePembeli: "Pedagang Lapak",
        telepon: "085211223344",
        statusPesanan: "Disiapkan",
        itemPesanan: [
          { jenisIkan: "Ikan Tongkol Super", beratKg: 45, hargaPerKg: 35000, subtotal: 1575000 },
          { jenisIkan: "Ikan Bandeng Tambak", beratKg: 60, hargaPerKg: 38000, subtotal: 2280000 },
        ],
        totalHarga: 3855000,
        catatan: "Kirim sebelum jam 05:30 WIB subuh.",
      },
      {
        id: "mb-2",
        namaPembeli: "Pak Bambang (Grosir Seafood)",
        tipePembeli: "Pengepul Pasar",
        telepon: "081298761234",
        statusPesanan: "Menunggu Pengiriman",
        itemPesanan: [
          { jenisIkan: "Udang Vaname Segar", beratKg: 25, hargaPerKg: 85000, subtotal: 2125000 },
        ],
        totalHarga: 2125000,
        catatan: "Tolong es batunya ditambahin.",
      },
    ],
  },
  {
    id: "mkt-2",
    namaPasar: "TPI Kedungmalang",
    alamat: "Kawasan Tempat Pelelangan Ikan Kedungmalang, Kedung, Jepara",
    jarakKm: 4.2,
    latitude: -6.6542,
    longitude: 110.6421,
    kategori: "TPI Pelelangan",
    totalPesanan: 2,
    pembeliList: [
      {
        id: "mb-3",
        namaPembeli: "Pak Haji Ahmad (Bakul Besar)",
        tipePembeli: "Bakul Besar / Pengepul",
        telepon: "081399887766",
        statusPesanan: "Menunggu Pengiriman",
        itemPesanan: [
          { jenisIkan: "Ikan Kakap Merah", beratKg: 80, hargaPerKg: 65000, subtotal: 5200000 },
          { jenisIkan: "Ikan Tenggiri Super", beratKg: 35, hargaPerKg: 75000, subtotal: 2625000 },
        ],
        totalHarga: 7825000,
        catatan: "Siap ditimbang di dermaga TPI.",
      },
    ],
  },
  {
    id: "mkt-3",
    namaPasar: "Pusat Seafood Kalinyamatan",
    alamat: "Jl. Raya Kalinyamatan No. 18, Jepara",
    jarakKm: 5.5,
    latitude: -6.7112,
    longitude: 110.7205,
    kategori: "Pusat Restoran",
    totalPesanan: 2,
    pembeliList: [
      {
        id: "mb-4",
        namaPembeli: "Restoran Samudra Jaya",
        tipePembeli: "Restoran Seafood",
        telepon: "08198765432",
        statusPesanan: "Lunas / Selesai",
        itemPesanan: [
          { jenisIkan: "Ikan Gurame Segar", beratKg: 30, hargaPerKg: 45000, subtotal: 1350000 },
          { jenisIkan: "Cumi-cumi Segar", beratKg: 20, hargaPerKg: 70000, subtotal: 1400000 },
        ],
        totalHarga: 2750000,
        catatan: "Ukuran gurame 600-800 gram per ekor.",
      },
    ],
  },
  {
    id: "mkt-4",
    namaPasar: "Pasar Welahan Jepara",
    alamat: "Jl. Gotri Welahan, Kec. Welahan, Kabupaten Jepara",
    jarakKm: 7.1,
    latitude: -6.7580,
    longitude: 110.7410,
    kategori: "Pasar Tradisional",
    totalPesanan: 1,
    pembeliList: [
      {
        id: "mb-5",
        namaPembeli: "Kios Ikan Mbak Rahma",
        tipePembeli: "Pedagang Lapak",
        telepon: "085712345678",
        statusPesanan: "Disiapkan",
        itemPesanan: [
          { jenisIkan: "Ikan Nila Hitam", beratKg: 50, hargaPerKg: 32000, subtotal: 1600000 },
          { jenisIkan: "Ikan Layang Basah", beratKg: 40, hargaPerKg: 28000, subtotal: 1120000 },
        ],
        totalHarga: 2720000,
      },
    ],
  },
  {
    id: "mkt-5",
    namaPasar: "PASAR KEPITING JEPARA",
    alamat: "Kawasan Pelelangan Ikan & Kepiting, Jepara",
    jarakKm: 2.1,
    latitude: -6.5890,
    longitude: 110.6620,
    kategori: "TPI Pelelangan",
    totalPesanan: 2,
    pembeliList: [
      {
        id: "mb-6",
        namaPembeli: "Juragan Kepiting Bakau",
        tipePembeli: "Pengepul Kepiting",
        telepon: "081299887711",
        statusPesanan: "Menunggu Pengiriman",
        itemPesanan: [{ jenisIkan: "Kepiting Bakau Super", beratKg: 40, hargaPerKg: 120000, subtotal: 4800000 }],
        totalHarga: 4800000,
      },
    ],
  },
  {
    id: "mkt-6",
    namaPasar: "Pasar Rakyat Jepara 2",
    alamat: "Jobokuto, Jepara Kota",
    jarakKm: 2.5,
    latitude: -6.5920,
    longitude: 110.6690,
    kategori: "Pasar Tradisional",
    totalPesanan: 1,
    pembeliList: [],
  },
  {
    id: "mkt-7",
    namaPasar: "Pasar Sore Karangrandu (PSK)",
    alamat: "Karangrandu, Pecangaan, Jepara",
    jarakKm: 4.8,
    latitude: -6.6350,
    longitude: 110.6980,
    kategori: "Pasar Tradisional",
    totalPesanan: 1,
    pembeliList: [],
  },
  {
    id: "mkt-8",
    namaPasar: "Pasar Ngabul Baru",
    alamat: "Jl. Raya Jepara-Kudus, Ngabul",
    jarakKm: 6.2,
    latitude: -6.6497,
    longitude: 110.6766,
    kategori: "Pasar Tradisional",
    totalPesanan: 2,
    pembeliList: [],
  },
  {
    id: "mkt-9",
    namaPasar: "Pasar Duren Ngabul",
    alamat: "Kawasan Pasar Ngabul, Tahunan",
    jarakKm: 6.5,
    latitude: -6.6510,
    longitude: 110.6780,
    kategori: "Pasar Tradisional",
    totalPesanan: 1,
    pembeliList: [],
  },
  {
    id: "mkt-10",
    namaPasar: "Pasar Durian Ngabul",
    alamat: "Sentra Durian & Hasil Laut Ngabul",
    jarakKm: 6.7,
    latitude: -6.6530,
    longitude: 110.6800,
    kategori: "Pasar Tradisional",
    totalPesanan: 1,
    pembeliList: [],
  },
];
