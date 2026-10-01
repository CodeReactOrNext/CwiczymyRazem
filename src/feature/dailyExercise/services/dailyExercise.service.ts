import axios from "axios";
import type {
  DailyExerciseLeaderboard,
  DailyExerciseSubmission,
} from "feature/dailyExercise/types/dailyExercise.types";
import { auth } from "utils/firebase/client/firebase.utils";

export const dailyLeaderboardQueryKey = (dayKey: string, uid: string | null) =>
  ["daily-exercise-leaderboard", dayKey, uid] as const;

export const fetchDailyLeaderboard = async (
  dayKey: string,
  uid: string | null,
): Promise<DailyExerciseLeaderboard> => {
  const { data } = await axios.get<DailyExerciseLeaderboard>(
    "/api/daily-exercise/leaderboard",
    { params: { day: dayKey, ...(uid ? { uid } : {}) } },
  );
  return data;
};

export const submitDailyExerciseScore = async (
  submission: DailyExerciseSubmission,
): Promise<{ isNewBest: boolean }> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<{ isNewBest: boolean }>(
    "/api/daily-exercise/submit",
    { idToken, ...submission },
  );
  return data;
};
