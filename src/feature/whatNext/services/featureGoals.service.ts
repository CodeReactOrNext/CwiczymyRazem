import axios from "axios";
import type { FeatureGoalCases } from "feature/whatNext/utils/featureGoalCases";
import type { FeatureGoalStatus } from "feature/whatNext/utils/featureGoalsView";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { auth } from "utils/firebase/client/firebase.utils";

export interface FeatureGoalsState {
  goals: FeatureGoalStatus[];
  cases: FeatureGoalCases;
  /** Free cases the server put into the stash on this very look. */
  paidNow: number;
}

const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
};

/** Every goal with whether it is done, and the free cases they are worth — paying any just earned. */
export const fetchFeatureGoals = async (): Promise<FeatureGoalsState> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<FeatureGoalsState>(
    "/api/feature-goals/state",
    { idToken },
  );
  if (data.paidNow > 0) playUiSound("reward");
  return data;
};

