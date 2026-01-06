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

  async completeProgress(userId: string, challengeId: string): Promise<{ finished: boolean; rewardPoints: number }> {
    const activeChallenges = await this.challengeRepository.getActiveChallenges(userId);
    const activeChallenge = activeChallenges.find(c => c.challengeId === challengeId);

    if (!activeChallenge) throw new Error("Challenge not active");

    const today = new Date().toISOString().split('T')[0];
    if (activeChallenge.lastCompletedDate === today) {
      return { finished: false, rewardPoints: 0 };
    }

    const challenge = await this.challengeRepository.getChallengeById(challengeId);
    if (!challenge) throw new Error("Challenge definition not found");

    let finished = false;
    let rewardPoints = 0;

    if (activeChallenge.currentDay >= activeChallenge.totalDays) {
      finished = true;
      rewardPoints = parseInt(challenge.rewardDescription?.match(/\d+/)?.[0] || '0');
      await this.challengeRepository.markChallengeAsCompleted(userId, challengeId);
    } else {
      activeChallenge.currentDay += 1;
      activeChallenge.lastCompletedDate = today;
      await this.challengeRepository.updateChallengeProgress(userId, activeChallenge);
    }

    return { finished, rewardPoints };
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
