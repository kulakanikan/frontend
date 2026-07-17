/**
 * Auth Store - Zustand
 * Manages authentication state globally.
 * Connected to Backend API via /auth endpoints.
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, profileApi } from "../services/api";
import type { ApiUser } from "../services/api";
import { STORAGE_KEYS } from "../constants";

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: ApiUser) => void;
  devLogin: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (data: { nama_usaha?: string | null; telepon_usaha?: string | null }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),

  /** DEV login — uses hardcoded demo google_sub */
  devLogin: async () => {
    set({ isLoading: true });
    try {
      const result = await authApi.devLogin("demo_google_sub_12345");
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("Dev login failed:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  /** Google OAuth login */
  googleLogin: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.googleLogin(idToken);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("Google login failed:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  /** Logout — clear token and state */
  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (_) {}
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  /** Try to restore auth from stored token on app start */
  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Validate the token by calling /auth/me
      const { user } = await authApi.me();
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      // Token invalid/expired — clear it
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch (_) {}
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /** Update profile on backend and sync local state */
  updateProfile: async (data) => {
    try {
      await profileApi.update(data);
      // Refresh full profile
      const profile = await profileApi.get();
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: {
            ...currentUser,
            namaUsaha: profile.nama_usaha,
            teleponUsaha: profile.telepon_usaha,
          },
        });
      }
    } catch (err) {
      console.error("Update profile failed:", err);
      throw err;
    }
  },
}));
