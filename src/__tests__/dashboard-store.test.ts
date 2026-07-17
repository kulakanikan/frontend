import { describe, it, expect, mock, beforeEach } from "bun:test";

const mockSummaryData = {
  omzet: 5000000,
  laba_riil_total: 1200000,
  stok_tersisa_kg: 150,
  total_piutang: 300000,
  top_batch: [
    {
      id: "batch-1",
      jenis_ikan: "Tongkol",
      diterima_at: "2026-07-17T00:00:00.000Z",
      total_penjualan: 1000000,
      laba_riil: 250000,
    },
  ],
};

// Mock dashboardApi
const mockDashboardApi = {
  summary: mock(async () => mockSummaryData),
  aiSummary: mock(async () => ({ summary: "Toko Anda dalam kondisi sehat walafiat." })),
};

mock.module("../services/api", () => ({
  dashboardApi: mockDashboardApi,
}));

import { useDashboardStore } from "../store/dashboard-store";

describe("dashboardStore (Zustand)", () => {
  beforeEach(() => {
    mockDashboardApi.summary.mockClear();
    mockDashboardApi.aiSummary.mockClear();

    // Reset store state
    useDashboardStore.setState({
      summary: null,
      aiSummary: null,
      isLoading: false,
      isLoadingAi: false,
      lastFetchedAt: null,
    });
  });

  it("fetchSummary: should fetch and store dashboard summary", async () => {
    await useDashboardStore.getState().fetchSummary();

    expect(useDashboardStore.getState().isLoading).toBe(false);
    expect(useDashboardStore.getState().summary).toEqual(mockSummaryData);
    expect(useDashboardStore.getState().lastFetchedAt).toBeInstanceOf(Date);
    expect(mockDashboardApi.summary).toHaveBeenCalled();
  });

  it("fetchSummary: should handle errors and set isLoading to false", async () => {
    mockDashboardApi.summary.mockImplementationOnce(() => {
      throw new Error("Failed to fetch dashboard summary");
    });

    try {
      await useDashboardStore.getState().fetchSummary();
    } catch (_) {
      // Expected to throw
    }

    expect(useDashboardStore.getState().isLoading).toBe(false);
    expect(useDashboardStore.getState().summary).toBeNull();
  });

  it("fetchAiSummary: should fetch and store AI business summary", async () => {
    await useDashboardStore.getState().fetchAiSummary();

    expect(useDashboardStore.getState().isLoadingAi).toBe(false);
    expect(useDashboardStore.getState().aiSummary).toBe("Toko Anda dalam kondisi sehat walafiat.");
    expect(mockDashboardApi.aiSummary).toHaveBeenCalled();
  });

  it("fetchAiSummary: should handle errors gracefully and return fallbacks", async () => {
    mockDashboardApi.aiSummary.mockImplementationOnce(() => {
      throw new Error("API Failure");
    });

    await useDashboardStore.getState().fetchAiSummary();

    expect(useDashboardStore.getState().isLoadingAi).toBe(false);
    expect(useDashboardStore.getState().aiSummary).toContain("Gagal memuat ringkasan bisnis AI");
  });
});
