import { IChallengeRepository } from "../domain/repositories/IChallengeRepository";
import { ActiveChallenge, Challenge } from "../domain/models/Challenge";

export class ChallengeUseCases {
  constructor(private challengeRepository: IChallengeRepository) { }

  async startChallenge(userId: string, challenge: Challenge): Promise<void> {
    const today = new Date().toISOString();
    const activeChallenge: ActiveChallenge = {
      challengeId: challenge.id,
      startDate: today,
      lastCompletedDate: null,
      currentDay: 1,
      totalDays: challenge.streakDays
    };
    await this.challengeRepository.saveActiveChallenge(userId, activeChallenge);
  }

  async abandonChallenge(userId: string, challengeId: string): Promise<void> {
    await this.challengeRepository.abandonChallenge(userId, challengeId);
  }

  async completeProgress(userId: string, challengeId: string): Promise<{
    finished: boolean;
    rewardPoints: number;
    rewardLevel: number;
    rewardSkillId?: string;
    activeChallenge: ActiveChallenge;
  }> {
    const activeChallenges = await this.challengeRepository.getActiveChallenges(userId);
    const activeChallenge = activeChallenges.find(c => c.challengeId === challengeId);

    if (!activeChallenge) throw new Error("Challenge not active");

    const today = new Date().toISOString().split('T')[0];

    if (activeChallenge.lastCompletedDate === today) {
      throw new Error("Already completed today");
    }

    const challenge = await this.challengeRepository.getChallengeById(challengeId);
    if (!challenge) throw new Error("Challenge definition not found");

    let finished = false;
    let rewardPoints = parseInt(challenge.rewardDescription || '0');
    let rewardLevel = challenge.rewardLevel || 0;

    if (activeChallenge.currentDay >= activeChallenge.totalDays) {
      finished = true;
      await this.challengeRepository.markChallengeAsCompleted(userId, challengeId, {
        rewardPoints,
        rewardSkillId: challenge.rewardSkillId
      });
    } else {
      activeChallenge.currentDay += 1;
      activeChallenge.lastCompletedDate = today;
      await this.challengeRepository.updateChallengeProgress(userId, activeChallenge, challenge.rewardSkillId);
    }

    return {
      finished,
      rewardPoints,
      rewardLevel,
      rewardSkillId: challenge.rewardSkillId,
      activeChallenge
    };
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return this.challengeRepository.getAllChallenges();
  }

  async getActiveChallenges(userId: string): Promise<ActiveChallenge[]> {
    return this.challengeRepository.getActiveChallenges(userId);
  }

  async getCompletedChallengeIds(userId: string): Promise<string[]> {
    return this.challengeRepository.getCompletedChallengeIds(userId);
  }
}
