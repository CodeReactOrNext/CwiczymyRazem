import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import { GETTING_STARTED_QUEST_DEFAULTS } from "../types";
import type { GettingStartedQuestState } from "../types";

export const GETTING_STARTED_QUEST_COLLECTION = "onboardingQuests";

export const fetchGettingStartedQuest = async (
  userId: string
): Promise<GettingStartedQuestState> => {
  const snapshot = await getDoc(doc(db, GETTING_STARTED_QUEST_COLLECTION, userId));
  if (!snapshot.exists()) return GETTING_STARTED_QUEST_DEFAULTS;

  const data = snapshot.data();
  return { ...GETTING_STARTED_QUEST_DEFAULTS, ...data };
};

export const updateGettingStartedQuest = async (
  userId: string,
  patch: Partial<GettingStartedQuestState>
): Promise<void> => {
  await setDoc(
    doc(db, GETTING_STARTED_QUEST_COLLECTION, userId),
    { userId, ...patch, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

/** Grants the fame reward and marks the checklist reward as claimed. */
export const claimGettingStartedReward = async (
  userId: string,
  fameAmount: number
): Promise<void> => {
  await Promise.all([
    updateDoc(doc(db, "users", userId), {
      "statistics.fame": increment(fameAmount),
    }),
    setDoc(
      doc(db, GETTING_STARTED_QUEST_COLLECTION, userId),
      { userId, rewardClaimed: true, updatedAt: serverTimestamp() },
      { merge: true }
    ),
  ]);
};
