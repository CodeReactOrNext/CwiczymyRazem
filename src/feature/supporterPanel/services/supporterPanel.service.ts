import axios from "axios";
import type {
  RoadmapBoard,
  RoadmapIdeaIcon,
  RoadmapIdeaStatus,
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
