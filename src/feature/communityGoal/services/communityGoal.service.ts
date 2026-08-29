import axios from "axios";
import type { CommunityGoalState } from "feature/communityGoal/types/communityGoal.types";
import { auth } from "utils/firebase/client/firebase.utils";

const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
};

export const fetchCommunityGoal = async (): Promise<CommunityGoalState> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<CommunityGoalState>("/api/community-goal", {
    idToken,
  });
  return data;
};

export const voteForGoal = async (
  candidateId: string,
): Promise<CommunityGoalState> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<CommunityGoalState>(
    "/api/community-goal/vote",
    { idToken, candidateId },
  );
  return data;
};

export const claimGoalReward = async (): Promise<CommunityGoalState> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<CommunityGoalState>(
    "/api/community-goal/claim",
    { idToken },
  );
  return data;
};
