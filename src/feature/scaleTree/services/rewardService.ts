import { db } from "utils/firebase/client/firebase.utils";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

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
    // Check if reward already claimed
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return { success: false, error: "User not found" };
    }

    const userData = userDoc.data();
    const claimedRewards = userData?.claimedRewards ?? [];

    if (claimedRewards.includes(rewardNodeId)) {
      return { success: false, error: "Reward already claimed" };
    }

    // Update user stats
    const statsRef = doc(db, "users", userId);
    const currentStats = userData?.statistics ?? { points: 0, fame: 0 };

    const newPoints = (currentStats.points ?? 0) + points;
    const newFame = (currentStats.fame ?? 0) + famePoints;

    await updateDoc(statsRef, {
      "statistics.points": newPoints,
      "statistics.fame": newFame,
      claimedRewards: arrayUnion(rewardNodeId),
    });

    return {
      success: true,
      newPoints,
      newFame,
    };
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
