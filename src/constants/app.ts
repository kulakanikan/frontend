/**
 * Application-wide constants and configuration values.
 * Centralizes magic strings and numbers for maintainability.
 */

export const APP_NAME = "Kulakan Ikan";
export const APP_VERSION = "1.0.0";

/**
 * API Configuration
 * Override with environment variables in production.
 */
export const API = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api",
  TIMEOUT: 15000,
  RETRY_COUNT: 3,
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
