import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock the API layer to prevent real network calls
const mockProfileApi = {
  get: mock(async () => ({
    nama_usaha: "UD Mina Test",
    telepon_usaha: "0811223344",
    nama_google: "Google User Test",
    email: "test@google.com",
    avatar_url: "https://avatar.com",
  })),
  update: mock(async (data: { nama_usaha?: string | null; telepon_usaha?: string | null }) => ({
    nama_usaha: data.nama_usaha !== undefined ? data.nama_usaha : "UD Mina Test",
    telepon_usaha: data.telepon_usaha !== undefined ? data.telepon_usaha : "0811223344",
  })),
};

mock.module("../services/api", () => ({
  profileApi: mockProfileApi,
}));

import { useProfileStore } from "../store/profile-store";

describe("profileStore (Zustand)", () => {
  beforeEach(() => {
    mockProfileApi.get.mockClear();
    mockProfileApi.update.mockClear();

    // Reset store state
    useProfileStore.setState({
      profile: null,
      isLoading: false,
      isSaving: false,
    });
  });

  it("fetchProfile: should fetch and store profile data", async () => {
    await useProfileStore.getState().fetchProfile();

    expect(useProfileStore.getState().isLoading).toBe(false);
    expect(useProfileStore.getState().profile).toEqual({
      nama_usaha: "UD Mina Test",
      telepon_usaha: "0811223344",
      nama_google: "Google User Test",
      email: "test@google.com",
      avatar_url: "https://avatar.com",
    });
    expect(mockProfileApi.get).toHaveBeenCalled();
  });

  it("updateProfile: should call update API and refresh profile state", async () => {
    // Initial state
    useProfileStore.setState({
      profile: {
        nama_usaha: "UD Mina Test",
        telepon_usaha: "0811223344",
        nama_google: "Google User Test",
        email: "test@google.com",
        avatar_url: "https://avatar.com",
      },
    });

    await useProfileStore.getState().updateProfile({
      nama_usaha: "UD Mina Baru",
      telepon_usaha: "089999999",
    });

    expect(useProfileStore.getState().isSaving).toBe(false);
    expect(useProfileStore.getState().profile?.nama_usaha).toBe("UD Mina Baru");
    expect(useProfileStore.getState().profile?.telepon_usaha).toBe("089999999");
    expect(mockProfileApi.update).toHaveBeenCalledWith({
      nama_usaha: "UD Mina Baru",
      telepon_usaha: "089999999",
    });
  });
});
