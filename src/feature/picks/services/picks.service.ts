import axios, { isAxiosError } from "axios";
import type {
  PickTargetsResponse,
  PickThrowResponse,
} from "feature/picks/picks.rules";
import { auth } from "utils/firebase/client/firebase.utils";

/** Why the server turned a pick down — each has its own message. */
export type PickThrowError = "DAILY_LIMIT" | "UNKNOWN";

export class PickThrowFailure extends Error {
  constructor(public readonly reason: PickThrowError) {
    super(reason);
  }
}

const getIdToken = async (): Promise<string | null> =>
  (await auth.currentUser?.getIdToken()) ?? null;

/** Players worth a pick right now, and how many picks are left today. */
export const fetchPickTargets = async (): Promise<PickTargetsResponse> => {
  const idToken = await getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const { data } = await axios.post<PickTargetsResponse>("/api/picks/targets", {
    idToken,
  });
  return data;
};

/**
 * Tosses a pick at a player's activity. What it is worth and whether there is a pick left are
 * decided by `/api/picks/throw`; nothing about the reward travels from the client.
 */
export const throwPick = async (logId: string): Promise<PickThrowResponse> => {
  const idToken = await getIdToken();
  // The /dev summary preview has no signed-in player and no server: let its picks land.
  if (
    !idToken &&
    process.env.NODE_ENV !== "production" &&
    window.location.pathname.startsWith("/dev/")
  ) {
    return {
      thrown: true,
      alreadyMotivated: false,
      fameAwarded: 0,
      throwerFame: 0,
      picksLeft: 0,
    };
  }
  if (!idToken) throw new PickThrowFailure("UNKNOWN");

  try {
    const { data } = await axios.post<PickThrowResponse>("/api/picks/throw", {
      idToken,
      logId,
    });
    return data;
  } catch (error) {
    const code = isAxiosError(error)
      ? (error.response?.data as { error?: string })?.error
      : undefined;
    throw new PickThrowFailure(
      code === "DAILY_LIMIT" ? "DAILY_LIMIT" : "UNKNOWN",
    );
  }
};
