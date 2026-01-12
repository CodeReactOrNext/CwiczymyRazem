import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc, updateDoc, arrayUnion, increment, arrayRemove } from "firebase/firestore";
import { ActiveChallenge } from "../../domain/models/Challenge";

export const challengeService = {
  async getUserStats(userId: string) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  },

  async updateActiveChallenges(userId: string, challenges: ActiveChallenge[]) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      "statistics.activeChallenges": challenges
    });
  },

  async markAsCompleted(userId: string, challengeId: string, filteredChallenges: ActiveChallenge[], stats?: { rewardPoints?: number; rewardSkillId?: string; rewardLevel?: number }) {
    const userRef = doc(db, "users", userId);
    const updates: any = {
      "statistics.activeChallenges": filteredChallenges,
      "statistics.completedChallenges": arrayUnion(challengeId)
    };

    if (stats?.rewardPoints) {
      updates["statistics.points"] = increment(stats.rewardPoints);
    }

    if (stats?.rewardSkillId) {
      const rewardAmount = stats.rewardLevel || 1;
      updates[`skills.unlockedSkills.${stats.rewardSkillId}`] = increment(rewardAmount);
    }

    await updateDoc(userRef, updates);
  },

  async updateProgress(userId: string, updatedChallenges: ActiveChallenge[]) {
    const userRef = doc(db, "users", userId);
    const updates: any = {
      "statistics.activeChallenges": updatedChallenges
    };

    await updateDoc(userRef, updates);
  },

  async resetChallenge(userId: string, challengeId: string) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      "statistics.completedChallenges": arrayRemove(challengeId)
    });
  }
};
