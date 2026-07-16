/**
 * Auth Store - Zustand
 * Manages authentication state globally.
 */
import { create } from "zustand";

import type { User, AuthTokens } from "@/src/types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (name: string, phone: string, avatar_url?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: "user-1",
    name: "Ahmad Samudera",
    email: "ahmad.samudera@example.com",
    phone: "081234567890",
    role: "owner",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    created_at: "2026-01-01",
  },
  tokens: null,
  isAuthenticated: true,
  isLoading: false,

  setUser: (user) => set({ user }),

  setTokens: (tokens) => set({ tokens }),

  login: (user, tokens) =>
    set({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  updateProfile: (name, phone, avatar_url) =>
    set((state) => {
      if (!state.user) return {};
      return {
        user: {
          ...state.user,
          name,
          phone,
          avatar_url: avatar_url || state.user.avatar_url,
        },
      };
    }),
}));
