"use client";

import { create } from "zustand";

type FilterState = {
  ageRange: [number, number];
  religion: string;
  caste: string;
  location: string;
  education: string;
  income: number;
  setFilters: (filters: Partial<Omit<FilterState, "setFilters" | "resetFilters">>) => void;
  resetFilters: () => void;
};

const initialState = {
  ageRange: [21, 40] as [number, number],
  religion: "",
  caste: "",
  location: "",
  education: "",
  income: 0,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  resetFilters: () => set(initialState),
}));
