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

// Mock @react-native-google-signin/google-signin
mock.module("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: () => {},
    hasPlayServices: async () => true,
    signIn: async () => ({
      data: { idToken: "dummy-native-id-token" },
    }),
    signOut: async () => {},
    revokeAccess: async () => {},
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
  },
}));

// Mock expo-av
mock.module("expo-av", () => ({
  Audio: {
    requestPermissionsAsync: async () => ({ status: "granted" }),
    setAudioModeAsync: async () => {},
    Recording: class {
      prepareToRecordAsync() {}
      startAsync() {}
      stopAndUnloadAsync() {}
      getURI() { return "file:///dummy.m4a"; }
      static createAsync() {
        return Promise.resolve({
          recording: new this(),
          status: {},
        });
      }
    },
  },
}));

// Mock expo-file-system
mock.module("expo-file-system", () => ({
  readAsStringAsync: async () => "dummy-base64-string",
  EncodingType: {
    Base64: "base64",
  },
}));
