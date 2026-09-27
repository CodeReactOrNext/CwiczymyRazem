import { create } from "zustand";

interface CommunityDrawerState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

/**
 * One drawer for the whole app, opened from wherever its buttons sit — the top bar on desktop, the
 * bottom nav on phones — so the feed is never mounted twice.
 */
export const useCommunityDrawer = create<CommunityDrawerState>()((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
}));
