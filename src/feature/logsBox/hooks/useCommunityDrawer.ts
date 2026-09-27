import { create } from "zustand";

export type CommunityTab = "logs" | "chat" | "guild" | "changelog";

interface CommunityDrawerState {
  isOpen: boolean;
  /** The drawer's tab. Kept here rather than in the panel, so it survives closing and reopening. */
  tab: CommunityTab;
  setOpen: (isOpen: boolean) => void;
  setTab: (tab: CommunityTab) => void;
  /** Opens straight on a tab — a chat notification lands in the room it came from. */
  openTab: (tab: CommunityTab) => void;
}

/**
 * One drawer for the whole app, opened from wherever its buttons sit — the top bar on desktop, the
 * bottom nav on phones — so the feed is never mounted twice.
 */
export const useCommunityDrawer = create<CommunityDrawerState>()((set) => ({
  isOpen: false,
  tab: "logs",
  setOpen: (isOpen) => set({ isOpen }),
  setTab: (tab) => set({ tab }),
  openTab: (tab) => set({ isOpen: true, tab }),
}));
