import type { ActiveChallenge,Challenge } from "../models/Challenge";

export interface IChallengeRepository {
  getAllChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
  getActiveChallenges(userId: string): Promise<ActiveChallenge[]>;
  saveActiveChallenge(userId: string, challenge: ActiveChallenge): Promise<void>;
  updateChallengeProgress(userId: string, challenge: ActiveChallenge): Promise<void>;
  abandonChallenge(userId: string, challengeId: string): Promise<void>;
  markChallengeAsCompleted(userId: string, challengeId: string, stats?: { rewardPoints?: number; rewardSkillId?: string; rewardLevel?: number }): Promise<void>;
  resetChallenge(userId: string, challengeId: string): Promise<void>;
  getCompletedChallengeIds(userId: string): Promise<string[]>;
}
