/**
 * Auth Store - Zustand
 * Manages authentication state globally.
 * Token stored in expo-secure-store (hardware-backed keychain).
 */
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, profileApi } from "../services/api";
import type { ApiUser } from "../services/api";
import { STORAGE_KEYS } from "../constants";

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: ApiUser) => void;
  devLogin: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (data: { nama_usaha?: string | null; telepon_usaha?: string | null }) => Promise<void>;
}

/** Save JWT to hardware-backed secure storage */
async function saveToken(token: string) {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
}

/** Remove JWT from secure storage */
async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch (_) {}
}

/** Read JWT from secure storage */
async function readToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch (_) {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),

  /** DEV login — uses hardcoded demo google_sub (development only) */
  devLogin: async () => {
    set({ isLoading: true });
    try {
      const result = await authApi.devLogin("demo_google_sub_12345");
      await saveToken(result.token);
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

  /** Google OAuth login — idToken comes from expo-auth-session */
  googleLogin: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.googleLogin(idToken);
      await saveToken(result.token);
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

  /** Logout — delete token and clear state */
  logout: async () => {
    await clearToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Restore session on app start.
   * Reads JWT from SecureStore → validates via GET /auth/me.
   * On failure (token expired/invalid), clears token and sets unauthenticated.
   */
  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await readToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Validate token freshness — /auth/me returns 401 if expired
      const { user } = await authApi.me();
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (_) {
      await clearToken();
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
