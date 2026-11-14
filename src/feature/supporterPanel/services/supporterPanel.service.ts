import axios from "axios";
import type {
  BoardSkinState,
  SkinKind,
} from "feature/arsenal/data/boardSkins";
import type {
  RoadmapBoard,
  RoadmapIdeaIcon,
  RoadmapIdeaStatus,
  SupporterWallet,
} from "feature/supporterPanel/types/supporterPanel.types";
import { auth } from "utils/firebase/client/firebase.utils";

/**
 * Every call answers with the whole board. Votes and credits are worth real
 * money, so the server recomputes the budget on each write and the client just
 * renders what came back instead of keeping its own tally.
 */

const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
};

export const fetchRoadmapBoard = async (): Promise<RoadmapBoard> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<RoadmapBoard>("/api/supporter/board", {
    idToken,
  });
  return data;
};

export const postRoadmapIdea = async (input: {
  title: string;
  description: string;
  icon: RoadmapIdeaIcon;
}): Promise<RoadmapBoard> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<RoadmapBoard>("/api/supporter/idea", {
    idToken,
    ...input,
  });
  return data;
};

/** Burns tokens onto an idea. `amount` is what to add now, and it is charged. */
export const backRoadmapIdea = async (
  ideaId: string,
  amount: number,
): Promise<RoadmapBoard> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<RoadmapBoard>("/api/supporter/back", {
    idToken,
    ideaId,
    amount,
  });
  return data;
};

export const setRoadmapIdeaStatus = async (
  ideaId: string,
  status: RoadmapIdeaStatus,
): Promise<RoadmapBoard> => {
  const idToken = await getIdToken();
  const { data } = await axios.patch<RoadmapBoard>("/api/supporter/idea", {
    idToken,
    ideaId,
    status,
  });
  return data;
};

/** The skin shop as the server holds it: what is left to spend, what is owned. */
export interface SkinShopState {
  wallet: SupporterWallet;
  boardSkins: BoardSkinState;
}

const postSkinShop = async (
  body: Record<string, unknown>,
): Promise<SkinShopState> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<SkinShopState>("/api/supporter/skins", {
    idToken,
    ...body,
  });
  return data;
};

export const fetchSkinShop = (): Promise<SkinShopState> =>
  postSkinShop({ action: "read" });

/** Only the id travels: the price is the server's to look up. */
export const buyBoardSkin = (skinId: string): Promise<SkinShopState> =>
  postSkinShop({ action: "buy", skinId });

/** `null` goes back to the stock cable or the stock case. */
export const wearBoardSkin = (
  kind: SkinKind,
  skinId: string | null,
): Promise<SkinShopState> => postSkinShop({ action: "wear", kind, skinId });
