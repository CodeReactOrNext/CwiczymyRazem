import axios from "axios";
import { auth } from "utils/firebase/client/firebase.utils";

export interface ToggleLogReactionResult {
  /** Whether the user now has a reaction on this row. */
  reacted: boolean;
  /** Fame the recipient gained (negative when the reaction was withdrawn). */
  fameAwarded: number;
  /** Log the reaction actually landed on — the server picks it, not the caller. */
  logId: string;
}

/**
 * Motivates (or un-motivates) a feed row. The reward is decided entirely by `/api/logs/react`:
 * the server rebuilds the row's group, prices it and moves the Fame with the Admin SDK, so no
 * amount travels from the client and no client write can forge one.
 */
export const toggleLogReaction = async (logId: string): Promise<ToggleLogReactionResult> => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const { data } = await axios.post<ToggleLogReactionResult>("/api/logs/react", {
    idToken,
    logId,
  });

  return data;
};
