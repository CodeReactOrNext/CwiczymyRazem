import type { BossRecordMap } from "feature/bosses/types/boss.types";
import type { MilestoneStatus } from "feature/dashboard/utils/milestoneSummary";
import type { DuelView } from "feature/duels/types/duel.types";
import type { ExerciseGoal } from "feature/exerciseGoals/types/exerciseGoal.types";
import type { SongPracticeMode } from "feature/exercisePlan/types/exercise.types";
import type { NextJourneyStep } from "feature/journey/utils/journeyStatus";
import type { CalendarSongRef } from "feature/practiceCalendar/types/calendar.types";
import type { CalendarItem } from "feature/practiceCalendar/types/calendar.types";
import type { PlannerRoadmapStep } from "feature/practiceCalendar/utils/planner";
import type { ClaimableScaleBox } from "feature/scaleTree/data/scaleTreeRewards";
import type { RewardPayout } from "lib/rewards/rewardPayout";
import type { DailyQuest } from "types/api.types";

/** Which part of the app an action comes from — one per provider. */
export type NextActionSource =
  | "claims"
  | "onboarding"
  | "streak"
  | "dailyQuest"
  | "dailyExercise"
  | "calendar"
  | "duels"
  | "goals"
  | "journey"
  | "roadmap"
  | "skillTree"
  | "scaleTree"
  | "songs"
  | "rotation"
  | "plan"
  | "challenge"
  | "guilds"
  | "milestones"
  | "season"
  | "balance"
  | "achievements"
  | "bosses"
  | "progression";

/**
 * What kind of nudge it is, which decides its base weight and its lane.
 *
 * - `claim` — a reward is waiting; zero effort.
 * - `expiring` — gone or broken when the clock runs out (streak, duel, today's board).
 * - `continue` — something the player already started.
 * - `start` — nothing begun yet that should be.
 * - `balance` — a part of practice left out this week.
 * - `week` — a weekly or monthly target in progress.
 * - `horizon` — a long goal, shown so the player knows where the road goes.
 */
export type NextActionKind =
  | "claim"
  | "expiring"
  | "continue"
  | "start"
  | "balance"
  | "week"
  | "horizon";

export type NextActionLane = "today" | "inProgress" | "week" | "horizon";

/** A translatable line: a key (namespaced as `ns:key` when not in `what_next`) and its values. */
export interface NextMessage {
  key: string;
  params?: Record<string, string | number>;
}

/** What the action would add to a "play N minutes" session, when it can be played. */
export type NextSessionItem =
  | { kind: "exercise"; exerciseId: string; minutes: number }
  | {
      kind: "goal";
      exerciseId: string;
      goalId: string;
      bpm: number;
      minutes: number;
    }
  | {
      kind: "song";
      song: CalendarSongRef;
      songMode?: SongPracticeMode;
      minutes: number;
    }
  | {
      kind: "roadmap";
      roadmapId: string;
      stepId: string;
      title: string;
      roadmapTitle: string;
      exerciseId?: string;
      song?: CalendarSongRef;
      songMode?: SongPracticeMode;
      minutes: number;
    };

export interface NextActionReward {
  fame?: number;
  points?: number;
  caseTokens?: number;
}

export interface NextAction {
  /** Stable across visits, so a snooze or a click can be remembered. */
  id: string;
  source: NextActionSource;
  kind: NextActionKind;
  /** Only playing can lead — gear and claims never take the hero spot. */
  isPractice: boolean;
  title: NextMessage;
  reason?: NextMessage;
  href: string;
  /** Epoch ms after which the action is gone or broken. */
  deadlineAt?: number;
  progress?: { value: number; max: number };
  estMinutes?: number;
  reward?: NextActionReward;
  sessionItem?: NextSessionItem;
  /** Set by the player — a goal, a calendar slot, a roadmap. Weighs more than a suggestion. */
  playerSet?: boolean;
  /** Days since it was last played, for things that rust. */
  staleDays?: number;
}

export interface RankedAction extends NextAction {
  score: number;
}

/** A reward that can be taken right now, without playing. */
export interface ClaimItem {
  id: string;
  label: NextMessage;
  reward?: NextActionReward;
  /** Claimed in place by the strip; without it, the item links to where it is claimed. */
  claim?: "dailyQuest" | "achievements" | "milestones";
  /** For a weekly goal: which tier and week the claim is for. */
  milestone?: { id: number; name: string; reward: number; weekKey: string };
  href: string;
}

export interface WhatNextResult {
  claims: ClaimItem[];
  hero: RankedAction | null;
  lanes: Record<NextActionLane, RankedAction[]>;
  /** Everything ranked, hero included, for the session builder. */
  ranked: RankedAction[];
}

export interface SongRef {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  /** Epoch ms, null when never played. */
  lastPracticedAt: number | null;
  hasGpFile: boolean;
}

export type PracticeCategory =
  | "technique"
  | "theory"
  | "hearing"
  | "creativity";

/**
 * Everything the providers read, gathered once. A field left `undefined`
 * is still loading (or not asked for on this surface): its providers stay
 * quiet rather than guess.
 */
export interface WhatNextSnapshot {
  now: number;
  lvl: number;
  points: number;
  sessionCount: number;
  /** Unspent skill points, summed across categories. */
  availableSkillPoints: number;

  streak?: {
    dayWithoutBreak: number;
    didPracticeToday: boolean;
    dayEndsAt: number;
  };
  /** Today's quest only; null when none is drawn yet. */
  dailyQuest?: DailyQuest | null;
  /** What claiming a finished quest pays — passed in so providers stay free of the store. */
  dailyQuestReward?: { fame: number; points: number };
  /** Free cases and badges waiting to be claimed. */
  rewards?: {
    caseTokens: number;
    achievementsClaimable: number;
    achievementsPending: RewardPayout;
  };
  milestones?: { statuses: MilestoneStatus[]; weekKey: string };
  dailyExercise?: {
    exerciseId: string;
    title: string;
    myRank: number | null;
    players: number;
    endsAt: number;
  };
  goals?: ExerciseGoal[];
  calendar?: {
    today: string;
    todayItems: { item: CalendarItem; done: boolean }[];
    /** Any slot at all this week or next. */
    hasUpcoming: boolean;
  };
  journey?: NextJourneyStep | null;
  roadmapSteps?: PlannerRoadmapStep[];
  skillTree?: {
    exerciseId: string;
    title: string;
    branch: string;
    done: number;
    total: number;
  } | null;
  scaleBoxes?: ClaimableScaleBox[];
  scaleInProgress?: {
    nodeId: string;
    title: string;
    done: number;
    total: number;
  } | null;
  songs?: { learning: SongRef[]; wantToLearn: SongRef[]; learnedCount: number };
  rotation?: { rusty: number; cooling: number; total: number };
  lastPlan?: { planId: string; title: string; lastPlayedAt: number } | null;
  challenge?: {
    id: string;
    total: number;
    cleared: number;
    daysLeft: number;
    endsAt: number;
  };
  duels?: DuelView[];
  guild?: {
    isMember: boolean;
    claimableFame: number;
    claimableQuests: number;
    /** Quests where the player's own share is still open. */
    openShares: { id: string; name: string; mine: number; target: number }[];
    applications: number;
  } | null;
  season?: {
    place: number;
    rivalName: string;
    gap: number;
    endsAt: number;
  } | null;
  /** Minutes per category over the last seven days. */
  weekMinutes?: Record<PracticeCategory, number>;
  /** A playable exercise for each category, picked for today. */
  categoryPicks?: Partial<
    Record<PracticeCategory, { exerciseId: string; title: string }>
  >;
  /** Badges the player is close to: `ready` unlocks with the next logged session. */
  achievements?: {
    id: string;
    name: string;
    current: number;
    max: number;
    ready: boolean;
  }[];
  bosses?: BossRecordMap;
  /** Exercise suggested for a first session or a streak rescue. */
  quickPick?: { exerciseId: string; title: string };
}
