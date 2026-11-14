import axios from "axios";
import type {
  BuyCosmeticResult,
  CosmeticKind,
  CosmeticsState,
  EquippedLookup,
} from "feature/cosmetics/types/cosmetics.types";
import { auth } from "utils/firebase/client/firebase.utils";

const token = () => auth.currentUser!.getIdToken();

export const fetchCosmeticsState = async (): Promise<CosmeticsState> => {
  const { data } = await axios.post<CosmeticsState>("/api/cosmetics/state", {
    idToken: await token(),
  });
  return data;
};

export const fetchEquippedLookup = async (): Promise<EquippedLookup> => {
  const { data } = await axios.get<{ players?: EquippedLookup }>(
    "/api/cosmetics/equipped",
  );
  return data.players ?? {};
};

export const buyCosmetic = async (itemId: string): Promise<BuyCosmeticResult> => {
  const { data } = await axios.post<BuyCosmeticResult>("/api/cosmetics/buy", {
    idToken: await token(),
    itemId,
  });
  return data;
};

export const equipCosmetic = async (
  slot: CosmeticKind,
  itemId: string | null,
): Promise<CosmeticsState> => {
  const { data } = await axios.post<CosmeticsState>("/api/cosmetics/equip", {
    idToken: await token(),
    slot,
    itemId,
  });
  return data;
};
