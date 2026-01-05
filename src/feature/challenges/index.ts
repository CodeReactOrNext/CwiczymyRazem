import { ChallengeRepository } from "./frontend/infrastructure/persistence/ChallengeRepository";

export const challengeRepository = new ChallengeRepository();

export * from "./backend/domain/models/Challenge";
export * from "./backend/domain/repositories/IChallengeRepository";
