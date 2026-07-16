/**
 * Axios API client with interceptors for authentication,
 * error handling, and request/response logging.
 */
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

import { API } from "@/src/constants";

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
 * - Attaches auth token from secure storage
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // TODO: Get token from SecureStore
    // const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor:
 * - Handles 401 (token refresh)
 * - Standardizes error responses
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest) {
      // TODO: Implement token refresh logic
      // try {
      //   const newToken = await refreshAuthToken();
      //   originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //   return apiClient(originalRequest);
      // } catch (refreshError) {
      //   // Redirect to login
      // }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
