import { describe, it, expect, mock, beforeEach } from "bun:test";

let mockToken: string | null = null;
let deletedToken = false;
let savedToken: string | null = null;

// Mock expo-secure-store specifically for auth-store testing
mock.module("expo-secure-store", () => ({
  getItemAsync: async (key: string) => {
    if (key === "auth_token") return mockToken;
    return null;
  },
  setItemAsync: async (key: string, value: string) => {
    if (key === "auth_token") savedToken = value;
  },
  deleteItemAsync: async (key: string) => {
    if (key === "auth_token") {
      deletedToken = true;
      mockToken = null;
    }
  },
}));

// Mock the API layer to prevent real network calls
const mockAuthApi = {
  me: mock(async () => ({
    user: {
      id: "user-123",
      nama: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      namaUsaha: null,
      teleponUsaha: null,
    },
  })),
  devLogin: mock(async (googleSub: string) => ({
    token: "mock-dev-token",
    user: {
      id: "user-123",
      nama: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      namaUsaha: null,
      teleponUsaha: null,
    },
  })),
  googleLogin: mock(async (idToken: string) => ({
    token: "mock-google-token",
    user: {
      id: "user-123",
      nama: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      namaUsaha: null,
      teleponUsaha: null,
    },
  })),
};

mock.module("../services/api", () => ({
  authApi: mockAuthApi,
}));

import { useAuthStore } from "../store/auth-store";

describe("authStore (Zustand)", () => {
  beforeEach(() => {
    mockToken = null;
    deletedToken = false;
    savedToken = null;
    mockAuthApi.me.mockClear();
    mockAuthApi.devLogin.mockClear();
    mockAuthApi.googleLogin.mockClear();

    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("loadStoredAuth: should do nothing if no token is stored", async () => {
    mockToken = null;

    await useAuthStore.getState().loadStoredAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(mockAuthApi.me).not.toHaveBeenCalled();
  });

  it("loadStoredAuth: should restore user session if valid token is found", async () => {
    mockToken = "valid-stored-token";

    await useAuthStore.getState().loadStoredAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe("valid-stored-token");
    expect(useAuthStore.getState().user).toEqual({
      id: "user-123",
      nama: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      namaUsaha: null,
      teleponUsaha: null,
    });
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(mockAuthApi.me).toHaveBeenCalled();
  });

  it("loadStoredAuth: should clear session if token validation (me API) fails", async () => {
    mockToken = "invalid-token";
    mockAuthApi.me.mockImplementationOnce(() => {
      throw new Error("401 Unauthorized");
    });

    await useAuthStore.getState().loadStoredAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(deletedToken).toBe(true);
  });

  it("logout: should clear secure store and reset state", async () => {
    useAuthStore.setState({
      user: { id: "user-123" } as any,
      token: "some-token",
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(deletedToken).toBe(true);
  });

  it("devLogin: should save token and set state correctly on success", async () => {
    await useAuthStore.getState().devLogin();

    expect(savedToken).toBe("mock-dev-token");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe("mock-dev-token");
    expect(useAuthStore.getState().user).toEqual({
      id: "user-123",
      nama: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      namaUsaha: null,
      teleponUsaha: null,
    });
  });

  it("googleLogin: should save token and set state correctly on success", async () => {
    await useAuthStore.getState().googleLogin("google-id-token");

    expect(savedToken).toBe("mock-google-token");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe("mock-google-token");
    expect(mockAuthApi.googleLogin).toHaveBeenCalledWith("google-id-token");
  });
});
