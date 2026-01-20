import type { ActiveChallenge,Challenge } from "../../domain/models/Challenge";
import type { IChallengeRepository } from "../../domain/repositories/IChallengeRepository";
import { challengeService } from "./challenge.service";
import { challengesList } from "./staticChallenges";

export class ChallengeRepository implements IChallengeRepository {
  async getAllChallenges(): Promise<Challenge[]> {
    return challengesList as unknown as Challenge[];
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    return challengesList.find(c => c.id === id) as unknown as Challenge;
  }

  async getActiveChallenges(userId: string): Promise<ActiveChallenge[]> {
    const data = await challengeService.getUserStats(userId);
    return data?.statistics?.activeChallenges || [];
  }

  async saveActiveChallenge(userId: string, challenge: ActiveChallenge): Promise<void> {
    const activeChallenges = await this.getActiveChallenges(userId);
    const existingIndex = activeChallenges.findIndex(c => c.challengeId === challenge.challengeId);
    let updated = [...activeChallenges];

    if (existingIndex !== -1) {
      updated[existingIndex] = challenge;
    } else {
      updated.push(challenge);
    }

    await challengeService.updateActiveChallenges(userId, updated);
  }

  async updateChallengeProgress(userId: string, challenge: ActiveChallenge): Promise<void> {
    const activeChallenges = await this.getActiveChallenges(userId);
    const updated = activeChallenges.map(c =>
      c.challengeId === challenge.challengeId ? challenge : c
    );

    await challengeService.updateProgress(userId, updated);
  }

  async abandonChallenge(userId: string, challengeId: string): Promise<void> {
    const activeChallenges = await this.getActiveChallenges(userId);
    const filtered = activeChallenges.filter(c => c.challengeId !== challengeId);
    await challengeService.updateActiveChallenges(userId, filtered);
  }

  async markChallengeAsCompleted(userId: string, challengeId: string, stats?: { rewardPoints?: number; rewardSkillId?: string; rewardLevel?: number }): Promise<void> {
    const activeChallenges = await this.getActiveChallenges(userId);
    const filtered = activeChallenges.filter(c => c.challengeId !== challengeId);
    await challengeService.markAsCompleted(userId, challengeId, filtered, stats);
  }

  async resetChallenge(userId: string, challengeId: string): Promise<void> {
    await challengeService.resetChallenge(userId, challengeId);
  }

  async getCompletedChallengeIds(userId: string): Promise<string[]> {
    const data = await challengeService.getUserStats(userId);
    return data?.statistics?.completedChallenges || [];
  }
}
