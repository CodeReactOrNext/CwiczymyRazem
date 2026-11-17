import axios from "axios";
import { logger } from "feature/logger/Logger";
import { auth } from "utils/firebase/client/firebase.utils";

/**
 * Asks the server to have the bot post a run that was just filed to the
 * community's Discord channel. Best effort: the run is already saved, so a
 * failure here is only logged — never shown to the player.
 */
export const announceChallengeRun = async (
  challengeId: string,
  songId: string,
): Promise<void> => {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    await axios.post("/api/challenges/announce", {
      idToken,
      challengeId,
      songId,
    });
  } catch (error) {
    logger.error(error, { context: "announceChallengeRun" });
  }
};
