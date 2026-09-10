import axios from "axios";
import type { AchievementList } from "feature/achievements/types";
import type {
  GuitarDefinition,
  InventoryItem,
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { LevelReward } from "feature/progression/utils/levelRewards";
import { auth } from "utils/firebase/client/firebase.utils";

import type { RewardPayout } from "./rewardPayout";

/** Everything owed to this account, and what it has already spent. */
export interface RewardLedgerState {
  /** Unspent free cases, whatever earned them. */
  caseTokens: number;
  achievements: {
    claimed: AchievementList[];
    claimable: AchievementList[];
    /** Everything `claimable` is worth, already summed. */
    pending: RewardPayout;
  };
  scales: {
    /** Reward ids of the boxes already collected — see `boxRewardId`. */
    claimed: string[];
  };
  journeys: {
    /** Reward ids of the journey modules collected — see `journeyRewardId`. */
    claimed: string[];
  };
  roadmaps: {
    /** Reward ids of the AI-coach roadmaps collected — see `roadmapRewardId`. */
    claimed: string[];
  };
  levels: {
    /** Reward ids of the level milestones collected — see `levelRewardId`. */
    claimed: string[];
  };
}

export interface ClaimResult {
  reward: RewardPayout;
  newFame: number;
  newParts: ScrapPart[];
  caseTokens: number;
}

export interface ClaimAchievementsResult extends ClaimResult {
  claimed: AchievementList[];
}

export interface ClaimScaleResult extends ClaimResult {
  rewardId: string;
  scaleType: string;
  /** The fret the collected box is anchored at. */
  position: number;
}

export interface ClaimRoadmapResult extends ClaimResult {
  rewardId: string;
  roadmapId: string;
  /** The model at the end of the roadmap. */
  guitar: GuitarDefinition;
  /** The copy of it that was just minted for this player. */
  trophy: InventoryItem;
}

/**
 * What a collected level rung paid.
 *
 * Not a `ClaimResult`: the ladder pays in things rather than money, so there is
 * no Fame line to report back — see `LevelPayout`.
 */
export interface ClaimLevelResult {
  rewardId: string;
  lvl: number;
  reward: LevelReward;
  /** The mods as they now hang in the stash. */
  mods: SalvagedMod[];
  newParts: ScrapPart[];
  caseTokens: number;
}

export interface ClaimJourneyResult extends ClaimResult {
  rewardId: string;
  moduleId: string;
  /** The model at the end of the roadmap. */
  guitar: GuitarDefinition;
  /** The copy of it that was just minted for this player. */
  trophy: InventoryItem;
}

const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
};

export const fetchRewardLedger = async (): Promise<RewardLedgerState> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<RewardLedgerState>("/api/rewards/state", {
    idToken,
  });
  return data;
};

/** Collects one badge, or — with no ids — every badge waiting. */
export const claimAchievementRewards = async (
  achievementIds?: AchievementList[],
): Promise<ClaimAchievementsResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ClaimAchievementsResult>(
    "/api/rewards/claim-achievements",
    { idToken, ...(achievementIds ? { achievementIds } : {}) },
  );
  return data;
};

/** Collects one finished box of a scale tree. */
export const claimScaleReward = async (
  scaleType: string,
  position: number,
): Promise<ClaimScaleResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ClaimScaleResult>(
    "/api/rewards/claim-scale",
    { idToken, scaleType, position },
  );
  return data;
};

/** Collects the reward — trophy guitar included — for a finished roadmap. */
export const claimJourneyReward = async (
  moduleId: string,
): Promise<ClaimJourneyResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ClaimJourneyResult>(
    "/api/rewards/claim-journey",
    { idToken, moduleId },
  );
  return data;
};

/**
 * Collects what one level pays.
 *
 * The rung is all the server is told; it re-derives the payout itself. See
 * `api/rewards/claim-level`.
 */
export const claimLevelReward = async (
  lvl: number,
): Promise<ClaimLevelResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ClaimLevelResult>(
    "/api/rewards/claim-level",
    { idToken, lvl },
  );
  return data;
};

/** Collects the reward — trophy guitar included — for a finished curated roadmap. */
export const claimRoadmapReward = async (
  roadmapId: string,
): Promise<ClaimRoadmapResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ClaimRoadmapResult>(
    "/api/rewards/claim-roadmap",
    { idToken, roadmapId },
  );
  return data;
};
