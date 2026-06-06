"use client";

import { create } from "zustand";

type ThemeMode = "light" | "dark";

type UIState = {
  isModalOpen: boolean;
  theme: ThemeMode;
  toggleModal: (value?: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  theme: "light",
  toggleModal: (value) =>
    set((state) => ({
      isModalOpen: typeof value === "boolean" ? value : !state.isModalOpen,
    })),
  setTheme: (theme) => set({ theme }),
}));
