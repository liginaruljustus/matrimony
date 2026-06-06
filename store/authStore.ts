"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
} | null;

type AuthState = {
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "matrimony-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
