import { getAuth } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { TourStepId } from "./tourSteps";

/**
 * How the tour ended, next to the onboarding answers. A field path, so the
 * answers already saved under `onboarding` stay as they are.
 */
export const firebaseSaveTourOutcome = async (outcome: {
  status: "completed" | "skipped";
  step: TourStepId;
}) => {
  const auth = getAuth();
  if (!auth.currentUser) return;
  await updateDoc(doc(db, "users", auth.currentUser.uid), {
    "onboarding.tour": {
      status: outcome.status,
      step: outcome.step,
      at: serverTimestamp(),
    },
  });
};
