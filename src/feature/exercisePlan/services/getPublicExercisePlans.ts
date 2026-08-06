import { logger } from "feature/logger/Logger";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { ExercisePlan } from "../types/exercise.types";
import { EXERCISE_PLANS_COLLECTION } from "./constants";

export const getPublicExercisePlans = async (): Promise<ExercisePlan[]> => {
  try {
    const q = query(
      collection(db, EXERCISE_PLANS_COLLECTION),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const plans = snap.docs.map(d => ({ id: d.id, ...d.data() } as ExercisePlan));

    // authorUsername/authorAvatar are only written when a plan is toggled public
    // from the UI (see MyPlans.handleTogglePublic) — older or manually-published
    // plans never got them. Backfill from the owner's current profile so the
    // community list still shows an author instead of silently hiding it.
    const missingAuthorUserIds = Array.from(
      new Set(
        plans
          .filter(plan => !plan.authorUsername && plan.userId)
          .map(plan => plan.userId)
      )
    );

    if (missingAuthorUserIds.length > 0) {
      const profileEntries = await Promise.all(
        missingAuthorUserIds.map(async userId => {
          const userSnap = await getDoc(doc(db, "users", userId));
          return [userId, userSnap.exists() ? userSnap.data() : null] as const;
        })
      );
      const profileByUserId = new Map(profileEntries);

      for (const plan of plans) {
        if (plan.authorUsername || !plan.userId) continue;
        const profile = profileByUserId.get(plan.userId);
        if (profile?.displayName) {
          plan.authorUsername = profile.displayName;
          plan.authorAvatar = profile.avatar || undefined;
        }
      }
    }

    return plans;
  } catch (error) {
    logger.error(error, { context: "getPublicExercisePlans" });
    return [];
  }
};
