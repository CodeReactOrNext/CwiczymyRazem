import type { UserRoadmapStepResourceProgress } from "feature/aiCoach/services/userProgress.service";
import type { PhaseCheckResult } from "feature/aiCoach/types/phaseCheck.types";
import type {
  Roadmap,
  RoadmapVisibility,
} from "feature/aiCoach/types/roadmap.types";

/** One row of the roadmap browser — counts only, no step bodies. */
export interface UserRoadmapSummary {
  /** Unique per player and roadmap; also the id of their progress document. */
  rowId: string;
  id: string;
  userId: string;
  displayName: string | null;
  avatar: string | null;
  title: string;
  goal: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  phaseCount: number;
  stepCount: number;
  describedSteps: number;
  exerciseSteps: number;
  /** Steps linked to a song from the library. */
  songSteps: number;
  lessonSteps: number;
  /** Steps whose logged sessions already cover `sessionsRequired`. */
  completedSteps: number;
  sessionsCompleted: number;
  /** When the owner last touched their progress, null if they never started. */
  lastPractisedAt: string | null;
  /** Phases whose checkpoint quiz the owner has passed. */
  checkpointsPassed: number;
  /** Private rows reach only their owner; the board sees public ones. */
  visibility: RoadmapVisibility;
  /** Players other than the owner who started this roadmap for themselves. */
  followerCount: number;
  /**
   * The viewer's own run through somebody else's roadmap, once they pressed
   * "Start this roadmap"; null on their own roadmaps and on ones they never
   * started. The counters above stay the owner's.
   */
  viewerProgress: RoadmapRunProgress | null;
}

/** How far one player got on one roadmap. */
export interface RoadmapRunProgress {
  completedSteps: number;
  sessionsCompleted: number;
  startedAt: string | null;
  lastPractisedAt: string | null;
}

/**
 * Full roadmap plus one player's progress on it, loaded when a row is opened —
 * the owner's, or the viewer's own when they are following it.
 */
export interface UserRoadmapDetail {
  summary: UserRoadmapSummary;
  roadmap: Roadmap;
  stepProgress: Record<string, number>;
  /** The exercise, lessons and song ticked off on each step. */
  resourceProgress: Record<string, UserRoadmapStepResourceProgress>;
  phaseChecks: Record<string, PhaseCheckResult>;
}

/**
 * One roadmap as the locked tab shows it to a player without the badge: what
 * it is about and how big it is. No names, avatars or uids — those are for
 * supporters.
 */
export interface RoadmapTeaserItem {
  goal: string;
  level: string;
  phaseCount: number;
  stepCount: number;
  followerCount: number;
}

export interface RoadmapTeaser {
  total: number;
  players: number;
  roadmaps: RoadmapTeaserItem[];
}
