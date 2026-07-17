import { create } from "zustand";
import { profileApi, type ProfileData } from "../services/api";

interface ProfileState {
  profile: ProfileData | null;
  isLoading: boolean;
  isSaving: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { nama_usaha?: string | null; telepon_usaha?: string | null }) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await profileApi.get();
      set({ profile, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  updateProfile: async (data) => {
    set({ isSaving: true });
    try {
      const updated = await profileApi.update(data);
      const currentProfile = get().profile;
      if (currentProfile) {
        set({
          profile: {
            ...currentProfile,
            nama_usaha: updated.nama_usaha,
            telepon_usaha: updated.telepon_usaha,
          },
          isSaving: false,
        });
      } else {
        // Fallback if profile wasn't fetched yet
        set({
          profile: {
            nama_usaha: updated.nama_usaha,
            telepon_usaha: updated.telepon_usaha,
            nama_google: "",
            email: "",
            avatar_url: null,
          },
          isSaving: false,
        });
      }

      // Sync with useAuthStore state if present
      try {
        const { useAuthStore } = require("./auth-store");
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.setState({
            user: {
              ...currentUser,
              namaUsaha: updated.nama_usaha,
              teleponUsaha: updated.telepon_usaha,
            },
          });
        }
      } catch (e) {
        // Ignored in test environment if auth-store is not fully mocked or available
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      set({ isSaving: false });
      throw err;
    }
  },
}));
