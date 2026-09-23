import type { RefineAction } from "feature/aiCoach/types/refine.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import { auth } from "utils/firebase/client/firebase.utils";

/** What every paid refinement answers with, next to its own payload. */
export interface RefineEnvelope {
  wallet: SupporterWallet;
  tokensCharged: number;
}

/**
 * One paid change to the signed-in player's own roadmap. The server charges,
 * asks the coach and answers with the content plus the wallet after the
 * charge; a failure is refunded there, so a thrown error here means nothing
 * was taken.
 */
export const runRefineAction = async <T>(
  action: RefineAction,
  body: Record<string, unknown>,
): Promise<T & RefineEnvelope> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/refine-roadmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, action, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.message || data.error || "The change did not go through.",
    );
  }
  return data as T & RefineEnvelope;
};
