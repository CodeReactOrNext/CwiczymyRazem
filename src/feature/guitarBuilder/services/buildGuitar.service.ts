import axios from "axios";
import type { InventoryItem } from "feature/arsenal/types/arsenal.types";
import { auth } from "utils/firebase/client/firebase.utils";

import type {
  Loadout,
  OwnedComponent,
  PlacedSticker,
} from "../types/guitarBuilder.types";

export interface BuildGuitarInput {
  loadout: Loadout;
  stickers: PlacedSticker[];
  /** The player's name for it; null/empty = the body's name. */
  name?: string | null;
  /** A built guitar to rebuild; absent builds a new one. */
  itemId?: string | null;
}

export interface BuildGuitarResult {
  item: InventoryItem;
  components: OwnedComponent[];
  fameSpent: number;
  newFame: number;
}

export const sellComponent = async (
  componentUid: string,
): Promise<{ fameReward: number }> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<{ fameReward: number }>(
    "/api/arsenal/sell-component",
    { idToken, componentUid },
  );
  return data;
};

export const buildGuitar = async (
  input: BuildGuitarInput,
): Promise<BuildGuitarResult> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<BuildGuitarResult>(
    "/api/arsenal/build-guitar",
    { idToken, ...input },
  );
  return data;
};

export const renameGuitar = async (input: {
  itemId: string;
  name: string | null;
}): Promise<{ item: InventoryItem }> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<{ item: InventoryItem }>(
    "/api/arsenal/rename-guitar",
    { idToken, ...input },
  );
  return data;
};
