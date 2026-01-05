import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { IChallengeRepository } from "../../../backend/domain/repositories/IChallengeRepository";
import { Challenge, ActiveChallenge } from "../../../backend/domain/models/Challenge";
import { challengesList } from "./staticChallenges";

export class ChallengeRepository implements IChallengeRepository {
  async getAllChallenges(): Promise<Challenge[]> {
    return challengesList as unknown as Challenge[];
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    return challengesList.find(c => c.id === id) as unknown as Challenge;
  }

  async getActiveChallenges(userId: string): Promise<ActiveChallenge[]> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.statistics?.activeChallenges || [];
    }
    return [];
  }

  async saveActiveChallenge(userId: string, challenge: ActiveChallenge): Promise<void> {
    const userRef = doc(db, "users", userId);
    const activeChallenges = await this.getActiveChallenges(userId);

    const existingIndex = activeChallenges.findIndex(c => c.challengeId === challenge.challengeId);
    let updated = [...activeChallenges];

    if (existingIndex !== -1) {
      updated[existingIndex] = challenge;
    } else {
      updated.push(challenge);
    }

    await updateDoc(userRef, {
      "statistics.activeChallenges": updated
    });
  }

  async updateChallengeProgress(userId: string, challenge: ActiveChallenge): Promise<void> {
    const userRef = doc(db, "users", userId);
    const activeChallenges = await this.getActiveChallenges(userId);

    const updated = activeChallenges.map(c =>
      c.challengeId === challenge.challengeId ? challenge : c
    );

    await updateDoc(userRef, {
      "statistics.activeChallenges": updated
    });
  }

  async abandonChallenge(userId: string, challengeId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    const activeChallenges = await this.getActiveChallenges(userId);
    const filtered = activeChallenges.filter(c => c.challengeId !== challengeId);

    await updateDoc(userRef, {
      "statistics.activeChallenges": filtered
    });
  }

  async markChallengeAsCompleted(userId: string, challengeId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    const activeChallenges = await this.getActiveChallenges(userId);
    const filtered = activeChallenges.filter(c => c.challengeId !== challengeId);

    await updateDoc(userRef, {
      "statistics.activeChallenges": filtered,
      "statistics.completedChallenges": arrayUnion(challengeId)
    });
  }

  async getCompletedChallengeIds(userId: string): Promise<string[]> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.statistics?.completedChallenges || [];
    }
    return [];
  }
}
