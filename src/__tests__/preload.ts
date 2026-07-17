import { mock } from "bun:test";

// Mock react-native completely to prevent Bun parser from compiling it
mock.module("react-native", () => ({
  Platform: {
    OS: "android",
    select: (obj: any) => obj.android,
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Mock expo-constants to prevent transitively importing react-native
mock.module("expo-constants", () => ({
  default: {
    expoConfig: {
      hostUri: "localhost:8081",
    },
  },
}));

// Mock expo-secure-store
let mockToken: string | null = null;
mock.module("expo-secure-store", () => ({
  getItemAsync: async (key: string) => {
    if (key === "auth_token") return mockToken;
    return null;
  },
  setItemAsync: async (key: string, value: string) => {
    if (key === "auth_token") mockToken = value;
  },
  deleteItemAsync: async (key: string) => {
    if (key === "auth_token") mockToken = null;
  },
}));

// Mock expo-router
mock.module("expo-router", () => ({
  router: {
    replace: () => {},
  },
}));
