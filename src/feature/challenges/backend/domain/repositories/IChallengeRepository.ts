import { Challenge, ActiveChallenge } from "../models/Challenge";

export interface IChallengeRepository {
  getAllChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
  getActiveChallenges(userId: string): Promise<ActiveChallenge[]>;
  saveActiveChallenge(userId: string, challenge: ActiveChallenge): Promise<void>;
  updateChallengeProgress(userId: string, challenge: ActiveChallenge, rewardSkillId?: string): Promise<void>;
  abandonChallenge(userId: string, challengeId: string): Promise<void>;
  markChallengeAsCompleted(userId: string, challengeId: string, stats?: { rewardPoints?: number; rewardSkillId?: string }): Promise<void>;
  getCompletedChallengeIds(userId: string): Promise<string[]>;
}
