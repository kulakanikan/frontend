import { describe, it, expect, mock, beforeEach } from "bun:test";

const mockSuppliers = [
  { id: "sup-1", namaNelayan: "Pak Joko", telepon: "0812", alamat: "Depok", createdAt: "2026-07-17" },
  { id: "sup-2", namaNelayan: "Pak Toro", telepon: "0813", alamat: "Jakarta", createdAt: "2026-07-17" },
];

const mockSupplierApi = {
  list: mock(async () => ({ suppliers: mockSuppliers })),
  create: mock(async (data: { nama_nelayan: string; telepon?: string; alamat?: string }) => ({
    supplier: {
      id: "sup-3",
      namaNelayan: data.nama_nelayan,
      telepon: data.telepon || null,
      alamat: data.alamat || null,
      createdAt: new Date().toISOString(),
    },
  })),
  update: mock(async (id: string, data: any) => ({
    supplier: {
      id,
      namaNelayan: data.nama_nelayan || "Pak Joko",
      telepon: data.telepon || "0812",
      alamat: data.alamat || "Depok",
      createdAt: "2026-07-17",
    },
  })),
  delete: mock(async (id: string) => {}),
};

mock.module("../services/api", () => ({
  suppliersApi: mockSupplierApi,
}));

import { useSupplierStore } from "../store/supplier-store";

describe("supplierStore (Zustand)", () => {
  beforeEach(() => {
    mockSupplierApi.list.mockClear();
    mockSupplierApi.create.mockClear();
    mockSupplierApi.update.mockClear();
    mockSupplierApi.delete.mockClear();

    useSupplierStore.setState({
      suppliers: [],
      isLoading: false,
    });
  });

  it("fetchSuppliers: should fetch and store suppliers list", async () => {
    await useSupplierStore.getState().fetchSuppliers();

    expect(useSupplierStore.getState().isLoading).toBe(false);
    expect(useSupplierStore.getState().suppliers).toEqual(mockSuppliers);
    expect(mockSupplierApi.list).toHaveBeenCalled();
  });

  it("addSupplier: should call create API and prepend to state", async () => {
    useSupplierStore.setState({ suppliers: mockSuppliers });

    const newSup = await useSupplierStore.getState().addSupplier({
      nama_nelayan: "Pak Bambang",
      telepon: "0815",
      alamat: "Bogor",
    });

    expect(useSupplierStore.getState().suppliers.length).toBe(3);
    expect(useSupplierStore.getState().suppliers[0].id).toBe("sup-3");
    expect(useSupplierStore.getState().suppliers[0].namaNelayan).toBe("Pak Bambang");
    expect(mockSupplierApi.create).toHaveBeenCalledWith({
      nama_nelayan: "Pak Bambang",
      telepon: "0815",
      alamat: "Bogor",
    });
  });

  it("updateSupplier: should call update API and modify in state", async () => {
    useSupplierStore.setState({ suppliers: mockSuppliers });

    await useSupplierStore.getState().updateSupplier("sup-1", {
      nama_nelayan: "Pak Joko Baru",
    });

    expect(useSupplierStore.getState().suppliers.find(s => s.id === "sup-1")?.namaNelayan).toBe("Pak Joko Baru");
    expect(mockSupplierApi.update).toHaveBeenCalledWith("sup-1", {
      nama_nelayan: "Pak Joko Baru",
    });
  });

  it("deleteSupplier: should call delete API and remove from state", async () => {
    useSupplierStore.setState({ suppliers: mockSuppliers });

    await useSupplierStore.getState().deleteSupplier("sup-2");

    expect(useSupplierStore.getState().suppliers.length).toBe(1);
    expect(useSupplierStore.getState().suppliers.find(s => s.id === "sup-2")).toBeUndefined();
    expect(mockSupplierApi.delete).toHaveBeenCalledWith("sup-2");
  });
});
