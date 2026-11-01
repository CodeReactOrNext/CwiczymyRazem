import { firestore } from "./db";
import { hasMcpAccess } from "./supporterPerk";

export {
  MCP_SUPPORTERS_ONLY_ERROR,
  MCP_SUPPORTERS_ONLY_MESSAGE,
} from "./supporterPerk";

/** Whether the player behind a token or id token may use AI assistants. */
export async function readMcpAccess(uid: string): Promise<boolean> {
  const user = (await firestore.collection("users").doc(uid).get()).data();
  return hasMcpAccess(user);
}
