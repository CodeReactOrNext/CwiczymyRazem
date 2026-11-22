import { create } from "zustand";

/**
 * Which instrument the Collection has put on the bench, if any.
 *
 * The bench can be opened from several places that do not share a parent —
 * a card in the grid, a card opened from a stash socket, the socket's
 * right-click menu, a rescued mod's own menu — so they all write here and one
 * `BenchDialog` reads it.
 */
interface BenchDialogState {
  itemId: string | null;
  /**
   * A rescued mod to drop straight into a free slot: the bench opens on that
   * slot's install dialog with this mod picked, instead of on the bench.
   */
  modFeatureId: string | null;
  openBench: (itemId: string, modFeatureId?: string | null) => void;
  /** Moves the open bench to another instrument (the ‹ › keys). */
  showItem: (itemId: string) => void;
  close: () => void;
}

export const useBenchDialogStore = create<BenchDialogState>((set) => ({
  itemId: null,
  modFeatureId: null,
  openBench: (itemId, modFeatureId = null) => set({ itemId, modFeatureId }),
  showItem: (itemId) => set({ itemId, modFeatureId: null }),
  close: () => set({ itemId: null, modFeatureId: null }),
}));
