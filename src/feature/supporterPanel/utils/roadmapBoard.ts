import type { UserRoadmapSummary } from "feature/supporterPanel/types/userRoadmaps.types";

export type RoadmapSort = "recent" | "newest" | "practised" | "followed";

export const ROADMAP_SORTS: { id: RoadmapSort; label: string }[] = [
  { id: "recent", label: "Recently active" },
  { id: "newest", label: "Newest" },
  { id: "practised", label: "Most practised" },
  { id: "followed", label: "Most followed" },
];

/** "all", or one of the roadmap levels. */
export type LevelFilter = string;

const byDateDesc =
  (field: "updatedAt" | "createdAt") =>
  (a: UserRoadmapSummary, b: UserRoadmapSummary) =>
    a[field] < b[field] ? 1 : a[field] > b[field] ? -1 : 0;

const COMPARE: Record<
  RoadmapSort,
  (a: UserRoadmapSummary, b: UserRoadmapSummary) => number
> = {
  recent: byDateDesc("updatedAt"),
  newest: byDateDesc("createdAt"),
  practised: (a, b) =>
    b.sessionsCompleted - a.sessionsCompleted || byDateDesc("updatedAt")(a, b),
  followed: (a, b) =>
    b.followerCount - a.followerCount || byDateDesc("updatedAt")(a, b),
};

/** The board narrowed to one level and put in the chosen order. */
export const arrangeRoadmaps = (
  summaries: UserRoadmapSummary[],
  { level, sort }: { level: LevelFilter; sort: RoadmapSort },
): UserRoadmapSummary[] =>
  summaries
    .filter((summary) => level === "all" || summary.level === level)
    .sort(COMPARE[sort]);
