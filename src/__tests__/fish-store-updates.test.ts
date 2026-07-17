import { describe, it, expect, mock, beforeEach } from "bun:test";

const mockBatch = {
  id: "b-1",
  userId: "user-1",
  supplierId: "sup-1",
  jenisIkan: "Kembung",
  berat: "50",
  hargaBeliPerKg: "20000",
  kondisiKualitas: "segar",
  sumberInput: "manual",
  status: "aktif",
  diterimaAt: "2026-07-17T00:00:00.000Z",
  createdAt: "2026-07-17T00:00:00.000Z",
  expenses: [
    { id: "exp-1", batchId: "b-1", jenisBiaya: "Es Batu", jumlah: "15000", catatan: null, createdAt: "2026-07-17" },
  ],
};

const mockBatchesApi = {
  list: mock(async (params?: any) => ({
    batches: [mockBatch],
  })),
  get: mock(async (id: string) => ({
    batch: mockBatch,
  })),
  create: mock(async () => ({ batch: mockBatch })),
  update: mock(async () => ({ batch: mockBatch })),
  delete: mock(async () => {}),
};

mock.module("../services/api", () => ({
  batchesApi: mockBatchesApi,
  buyersApi: {
    list: async () => ({ buyers: [] }),
  },
  salesApi: {
    list: async () => ({ sales: [] }),
  },
}));

import { useFishStore } from "../store/fish-store";

describe("fishStore Updates (Zustand)", () => {
  beforeEach(() => {
    mockBatchesApi.list.mockClear();
    mockBatchesApi.get.mockClear();

    useFishStore.setState({
      fishStocks: [],
      isLoading: false,
    });
  });

  it("should default sell_price to 0 inside mapBatchToStock", async () => {
    await useFishStore.getState().fetchStocks();

    const stock = useFishStore.getState().fishStocks[0];
    expect(stock.sell_price).toBe(0);
  });

  it("fetchStocks: should accept status and filter params", async () => {
    await useFishStore.getState().fetchStocks({ status: "aktif", jenis_ikan: "Kembung" });

    expect(mockBatchesApi.list).toHaveBeenCalledWith({ status: "aktif", jenis_ikan: "Kembung" });
  });

  it("fetchStockDetail: should fetch detailed batch and map expenses to addons", async () => {
    const stockDetail = await useFishStore.getState().fetchStockDetail("b-1");

    expect(mockBatchesApi.get).toHaveBeenCalledWith("b-1");
    expect(stockDetail.id).toBe("b-1");
    expect(stockDetail.addons).toEqual([
      { id: "exp-1", name: "Es Batu", price: 15000 },
    ]);
  });
});
