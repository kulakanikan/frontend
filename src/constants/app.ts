import Constants from "expo-constants";

export const APP_NAME = "Kulakan Ikan";
export const APP_VERSION = "1.0.0";

const getApiUrl = (): string => {
  // Use explicitly defined environment variable if present
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // In development, automatically resolve local host machine IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:8000/api`;
  }
  return "http://localhost:8000/api";
};

/**
 * API Configuration
 * Override with environment variables in production.
 */
export const API = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 15000,
  RETRY_COUNT: 3,
};

export const GOOGLE_OAUTH = {
  ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
} as const;

/**
 * Storage Keys
 * Centralize all AsyncStorage / SecureStore key names.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  ONBOARDING_COMPLETE: "onboarding_complete",
  THEME_PREFERENCE: "theme_preference",
} as const;

/**
 * Query Keys for data fetching / caching
 */
export const QUERY_KEYS = {
  USER: "user",
  FISH_STOCK: "fish_stock",
  TRANSACTIONS: "transactions",
  CUSTOMERS: "customers",
  SUPPLIERS: "suppliers",
  REPORTS: "reports",
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
