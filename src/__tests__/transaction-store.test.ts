import { describe, it, expect, mock, beforeEach } from "bun:test";

const mockSale = {
  id: "s-1",
  batchId: "b-1",
  buyerId: "buyer-1",
  beratJual: "30",
  hargaSatuan: "25000",
  total: "750000",
  statusBayar: "tempo" as const,
  tanggal: "2026-07-17",
  createdAt: "2026-07-17",
  batch: { userId: "u-1", jenisIkan: "Kembung" },
  buyer: { nama: "Pak Joko", tipePembeli: "pasar" },
  saleExtras: [],
  receipt: null,
};

const mockSaleDetail = {
  ...mockSale,
  payments: [
    { id: "p-1", saleId: "s-1", jumlahBayar: "250000", metodeBayar: "cash", dibayarAt: "2026-07-17" },
  ],
};

const mockSalesApi = {
  list: mock(async () => ({ sales: [mockSale] })),
  get: mock(async (id: string) => ({ sale: mockSaleDetail })),
  create: mock(async (data: any) => ({
    sale: {
      ...mockSale,
      id: "s-2",
      beratJual: String(data.berat_jual),
      hargaSatuan: String(data.harga_satuan),
      statusBayar: data.status_bayar,
    },
    extras: [],
    receipt: null,
  })),
};

const mockPaymentsApi = {
  create: mock(async (saleId: string, data: any) => ({
    payment: { id: "p-2", saleId, jumlahBayar: String(data.jumlah_bayar), metodeBayar: data.metode_bayar, dibayarAt: new Date().toISOString() },
    sale_status_updated: data.jumlah_bayar >= 500000, // if full payment
    total_paid: data.jumlah_bayar + 250000,
    remaining: 500000 - data.jumlah_bayar,
  })),
};

mock.module("../services/api", () => ({
  salesApi: mockSalesApi,
  paymentsApi: mockPaymentsApi,
}));

import { useTransactionStore } from "../store/transaction-store";

describe("transactionStore (Zustand)", () => {
  beforeEach(() => {
    mockSalesApi.list.mockClear();
    mockSalesApi.get.mockClear();
    mockSalesApi.create.mockClear();
    mockPaymentsApi.create.mockClear();

    useTransactionStore.setState({
      sales: [],
      isLoading: false,
    });
  });

  it("fetchSales: should fetch and store sales", async () => {
    await useTransactionStore.getState().fetchSales();

    expect(useTransactionStore.getState().isLoading).toBe(false);
    expect(useTransactionStore.getState().sales).toEqual([mockSale]);
    expect(mockSalesApi.list).toHaveBeenCalled();
  });

  it("fetchSaleDetail: should fetch detailed sale and return it", async () => {
    const detail = await useTransactionStore.getState().fetchSaleDetail("s-1");

    expect(mockSalesApi.get).toHaveBeenCalledWith("s-1");
    expect(detail).toEqual(mockSaleDetail);
  });

  it("createSale: should call create API and prepend to state", async () => {
    useTransactionStore.setState({ sales: [mockSale] });

    await useTransactionStore.getState().createSale({
      batch_id: "b-1",
      buyer_id: "buyer-1",
      berat_jual: 10,
      harga_satuan: 20000,
      status_bayar: "lunas",
      tanggal: "2026-07-17",
    });

    expect(useTransactionStore.getState().sales.length).toBe(2);
    expect(useTransactionStore.getState().sales[0].id).toBe("s-2");
    expect(useTransactionStore.getState().sales[0].statusBayar).toBe("lunas");
  });

  it("addPayment: should call create payment API and update statusBayar in state to lunas if full payment made", async () => {
    useTransactionStore.setState({ sales: [mockSale] });

    await useTransactionStore.getState().addPayment("s-1", {
      jumlah_bayar: 500000,
      metode_bayar: "cash",
    });

    expect(mockPaymentsApi.create).toHaveBeenCalledWith("s-1", {
      jumlah_bayar: 500000,
      metode_bayar: "cash",
    });

    // Check if the sale in list has been updated to lunas since sale_status_updated was true
    expect(useTransactionStore.getState().sales[0].statusBayar).toBe("lunas");
  });
});
