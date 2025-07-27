import { create } from "zustand";

export const useLoginStore = create((set) => ({
  username: "",
  password: "",
  setUsername: (value) => set({ username: value }),
  setPassword: (value) => set({ password: value }),
}));