import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

// Store variables for mocks so tests can verify behavior
let mockToken: string | null = null;
let deletedKeys: string[] = [];
let replacedRoute: string | null = null;

// Mock react-native before it gets imported
mock.module("react-native", () => ({
  Platform: {
    OS: "android",
  },
}));

// Mock expo-constants before it gets imported
mock.module("expo-constants", () => ({
  default: {
    expoConfig: {
      hostUri: "localhost:8081",
    },
  },
}));

// Mock dependencies before importing apiClient
mock.module("expo-secure-store", () => ({
  getItemAsync: async (key: string) => {
    if (key === "auth_token") return mockToken;
    return null;
  },
  setItemAsync: async (key: string, value: string) => {
    if (key === "auth_token") mockToken = value;
  },
  deleteItemAsync: async (key: string) => {
    deletedKeys.push(key);
    if (key === "auth_token") mockToken = null;
  },
}));

mock.module("expo-router", () => ({
  router: {
    replace: (route: string) => {
      replacedRoute = route;
    },
  },
}));

// Mock react-native-mmkv / others if they cause issues on import
mock.module("react-native-mmkv", () => ({
  MMKV: class {
    getString() {}
    set() {}
  },
}));

import apiClient from "../lib/api-client";

describe("apiClient Interceptors", () => {
  beforeEach(() => {
    mockToken = null;
    deletedKeys = [];
    replacedRoute = null;
  });

  it("should attach Authorization header when token is present in SecureStore", async () => {
    mockToken = "valid-test-token-123";

    // Retrieve request interceptor fulfilled handler
    const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const mockConfig = {
      headers: {} as any,
    };

    const finalConfig = await requestHandler(mockConfig);
    expect(finalConfig.headers.Authorization).toBe("Bearer valid-test-token-123");
  });

  it("should NOT attach Authorization header when token is missing in SecureStore", async () => {
    mockToken = null;

    const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const mockConfig = {
      headers: {} as any,
    };

    const finalConfig = await requestHandler(mockConfig);
    expect(finalConfig.headers.Authorization).toBeUndefined();
  });

  it("should delete token and redirect to login on 401 response error", async () => {
    mockToken = "expired-token";

    // Retrieve response interceptor rejected handler
    const responseHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mockError = {
      response: {
        status: 401,
      },
    };

    try {
      await responseHandler(mockError);
    } catch (err) {
      // Expected to reject the error
    }

    expect(deletedKeys).toContain("auth_token");
    expect(mockToken).toBeNull();
    expect(replacedRoute).toBe("/(auth)/login");
  });
});
