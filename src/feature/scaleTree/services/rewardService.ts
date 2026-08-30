import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

interface ClaimRewardResult {
  success: boolean;
  newPoints?: number;
  newFame?: number;
  error?: string;
}

export async function claimReward(
  userId: string,
  rewardNodeId: string,
  points: number,
  famePoints: number
): Promise<ClaimRewardResult> {
  try {
    const userDocRef = doc(db, "users", userId);

    // One transaction for the whole claim. Read-then-write across two round
    // trips let a double click pass the "already claimed" check twice and pay
    // the node out twice (`arrayUnion` dedupes the id, the points don't), and
    // it wrote both currencies as absolute totals — anything incremented onto
    // the same fields in between (a challenge recording, a song learned) was
    // erased. The increments make the payout additive; the transaction makes
    // the guard hold.
    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        return { success: false, error: "User not found" };
      }

      const userData = userDoc.data();
      const claimedRewards = userData?.claimedRewards ?? [];

      if (claimedRewards.includes(rewardNodeId)) {
        return { success: false, error: "Reward already claimed" };
      }

      const currentStats = userData?.statistics ?? {};

      transaction.update(userDocRef, {
        "statistics.points": increment(points),
        "statistics.fame": increment(famePoints),
        claimedRewards: arrayUnion(rewardNodeId),
      });

      return {
        success: true,
        newPoints: (currentStats.points ?? 0) + points,
        newFame: (currentStats.fame ?? 0) + famePoints,
      };
    });
  } catch (error) {
    console.error("Failed to claim reward:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getClaimedRewards(userId: string): Promise<string[]> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return [];
    }

    return userDoc.data()?.claimedRewards ?? [];
  } catch (error) {
    console.error("Failed to fetch claimed rewards:", error);
    return [];
  }
}
