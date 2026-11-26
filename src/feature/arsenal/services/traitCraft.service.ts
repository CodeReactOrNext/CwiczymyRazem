import axios from "axios";
import type {
  ExtractTraitResult,
  InsertTraitResult,
} from "feature/arsenal/data/traitCraft";
import { auth } from "utils/firebase/client/firebase.utils";

const getIdToken = async () => auth.currentUser?.getIdToken();

/** Lifts one trait off an instrument with a Trait Extractor. */
export const extractTrait = async (input: {
  itemId: string;
  kind: "guitar" | "effect";
  traitId: string;
}): Promise<ExtractTraitResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ExtractTraitResult>(
    "/api/arsenal/traits/extract",
    {
      idToken,
      ...input,
    },
  );
  return data;
};

/** Puts a Trait Imprint into an instrument. The price is decided by the server. */
export const insertTrait = async (input: {
  imprintId: string;
  itemId: string;
  kind: "guitar" | "effect";
}): Promise<InsertTraitResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<InsertTraitResult>(
    "/api/arsenal/traits/insert",
    {
      idToken,
      ...input,
    },
  );
  return data;
};

/** Sells an extractor or an imprint to the bin. */
export const sellTraitItem = async (input: {
  itemType: "imprint" | "extractor";
  id: string;
}): Promise<{ fameReward: number }> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ fameReward: number }>(
    "/api/arsenal/traits/sell",
    {
      idToken,
      ...input,
    },
  );
  return data;
};
