import { ChallengeUseCases } from "./backend/application/ChallengeUseCases";
import { ChallengeRepository } from "./backend/infrastructure/persistence/ChallengeRepository";

export const challengeRepository = new ChallengeRepository();
export const challengeUseCases = new ChallengeUseCases(challengeRepository);

export * from "./backend/application/ChallengeUseCases";
export * from "./backend/domain/models/Challenge";
export * from "./backend/domain/repositories/IChallengeRepository";
export * from "./backend/infrastructure/persistence/staticChallenges";
