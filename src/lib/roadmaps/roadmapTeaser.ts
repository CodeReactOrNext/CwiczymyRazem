import type {
  RoadmapTeaser,
  UserRoadmapSummary,
} from "feature/supporterPanel/types/userRoadmaps.types";
import { displayTitle } from "feature/supporterPanel/utils/roadmapGoal";

/** How many roadmaps the locked tab shows. */
export const TEASER_SIZE = 6;

/**
 * The public board cut down to what a player without the badge may see: the
 * roadmaps most people are working through, by goal and size only.
 */
export const buildRoadmapTeaser = (
  summaries: UserRoadmapSummary[],
): RoadmapTeaser => {
  const shown = summaries.filter((summary) => summary.visibility === "public");
  const popularity = (summary: UserRoadmapSummary) =>
    summary.followerCount * 10 + summary.sessionsCompleted;

  return {
    total: shown.length,
    players: new Set(shown.map((summary) => summary.userId)).size,
    roadmaps: [...shown]
      .sort((a, b) => popularity(b) - popularity(a))
      .slice(0, TEASER_SIZE)
      .map((summary) => ({
        goal: displayTitle(summary),
        level: summary.level,
        phaseCount: summary.phaseCount,
        stepCount: summary.stepCount,
        followerCount: summary.followerCount,
      })),
  };
};
