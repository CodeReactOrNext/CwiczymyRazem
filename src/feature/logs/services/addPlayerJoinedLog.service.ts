import axios from "axios";
import { auth } from "utils/firebase/client/firebase.utils";

/**
 * Puts the new player's "joined" row in the activity feed — once per account,
 * the server makes sure. Fire-and-forget: onboarding is finished either way.
 */
export const addPlayerJoinedLog = async () => {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;

    await axios.post("/api/logs/player-joined", { idToken });
  } catch (error) {
    console.error("Player joined log failed:", error);
  }
};
