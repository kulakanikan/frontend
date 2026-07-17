/**
 * Axios API client with interceptors for authentication,
 * error handling, and request/response logging.
 *
 * Token storage: expo-secure-store (hardware-backed, encrypted).
 */
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";

import { router } from "expo-router";

import { API, STORAGE_KEYS } from "@/src/constants";

const apiClient = axios.create({
  baseURL: API.BASE_URL,
  timeout: API.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request interceptor:
 * - Reads JWT from SecureStore (hardware-backed keychain)
 * - Attaches as Bearer token
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // SecureStore unavailable (e.g., web) — proceed without token
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/**
 * Response interceptor:
 * - 401 means token expired or invalid — clear it and let the auth guard
 *   redirect to login on next navigation.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        router.replace("/(auth)/login");
      } catch (_) {}
    }
    return Promise.reject(error);
  },
);

export default apiClient;
