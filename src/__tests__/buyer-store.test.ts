import { describe, it, expect, mock, beforeEach } from "bun:test";

const mockBuyer = {
  id: "b-1",
  nama: "Pak Budi",
  telepon: "0812345678",
  alamat: "Sunda Kelapa",
  createdAt: "2026-07-17",
};

const mockBuyersApi = {
  list: mock(async () => ({ buyers: [mockBuyer] })),
  get: mock(async (id: string) => ({ buyer: mockBuyer })),
  create: mock(async (data: any) => ({
    buyer: {
      ...mockBuyer,
      id: "b-2",
      nama: data.nama_nelayan || data.nama,
      telepon: data.telepon || null,
      alamat: data.alamat || null,
    },
  })),
  update: mock(async (id: string, data: any) => ({
    buyer: { ...mockBuyer, ...data },
  })),
};

mock.module("../services/api", () => ({
  buyersApi: mockBuyersApi,
}));

import { useBuyerStore } from "../store/buyer-store";

describe("buyerStore (Zustand)", () => {
  beforeEach(() => {
    mockBuyersApi.list.mockClear();
    mockBuyersApi.get.mockClear();
    mockBuyersApi.create.mockClear();
    mockBuyersApi.update.mockClear();

    useBuyerStore.setState({
      buyers: [],
      isLoading: false,
    });
  });

  it("fetchBuyers: should fetch and store buyers", async () => {
    await useBuyerStore.getState().fetchBuyers();

    expect(useBuyerStore.getState().isLoading).toBe(false);
    expect(useBuyerStore.getState().buyers).toEqual([mockBuyer]);
    expect(mockBuyersApi.list).toHaveBeenCalled();
  });

  it("addBuyer: should call create API and prepend to state", async () => {
    useBuyerStore.setState({ buyers: [mockBuyer] });

    const created = await useBuyerStore.getState().addBuyer({
      nama: "Pak Roni",
      telepon: "089876543",
      alamat: "Kalibaru",
    });

    expect(useBuyerStore.getState().buyers.length).toBe(2);
    expect(created.id).toBe("b-2");
    expect(created.nama).toBe("Pak Roni");
    expect(mockBuyersApi.create).toHaveBeenCalled();
  });

  it("updateBuyer: should call update API and update state", async () => {
    useBuyerStore.setState({ buyers: [mockBuyer] });

    await useBuyerStore.getState().updateBuyer("b-1", {
      nama: "Pak Budi Baru",
    });

    expect(useBuyerStore.getState().buyers[0].nama).toBe("Pak Budi Baru");
    expect(mockBuyersApi.update).toHaveBeenCalledWith("b-1", { nama: "Pak Budi Baru" });
  });
});
