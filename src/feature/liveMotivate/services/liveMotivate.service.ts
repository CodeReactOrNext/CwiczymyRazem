import axios, { isAxiosError } from "axios";
import type { LiveMotivateResponse } from "feature/liveMotivate/liveMotivate.rules";
import { auth } from "utils/firebase/client/firebase.utils";

/** Why the server turned a live motivation down — each has its own message. */
export type LiveMotivateError =
  | "NOT_PLAYING"
  | "DAILY_LIMIT"
  | "SESSION_FULL"
  | "UNKNOWN";

export class LiveMotivateFailure extends Error {
  constructor(public readonly reason: LiveMotivateError) {
    super(reason);
  }
}

/**
 * Motivates a player who is practicing right now. The amount, the limits and the Hype are all
 * decided by `/api/presence/motivate`; nothing about the reward travels from the client.
 */
export const motivateLive = async (recipientId: string): Promise<LiveMotivateResponse> => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new LiveMotivateFailure("UNKNOWN");

  try {
    const { data } = await axios.post<LiveMotivateResponse>("/api/presence/motivate", {
      idToken,
      recipientId,
    });
    return data;
  } catch (error) {
    const code = isAxiosError(error) ? (error.response?.data as { error?: string })?.error : undefined;
    if (code === "NOT_PLAYING" || code === "DAILY_LIMIT" || code === "SESSION_FULL") {
      throw new LiveMotivateFailure(code);
    }
    throw new LiveMotivateFailure("UNKNOWN");
  }
};
