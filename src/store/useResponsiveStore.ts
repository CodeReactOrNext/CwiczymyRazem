import { create } from "zustand";

interface ResponsiveState {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

export const useResponsiveStore = create<ResponsiveState>((set) => ({
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
}));
