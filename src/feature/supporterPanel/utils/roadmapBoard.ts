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

/**
 * The viewer's own run through a roadmap: the one they follow, or — on their
 * own roadmap — the owner's counters, which are theirs. Null on anybody
 * else's roadmap they never started.
 */
export const viewerRun = (
  summary: UserRoadmapSummary,
  viewerUid: string | null,
) =>
  summary.viewerProgress ??
  (viewerUid != null && summary.userId === viewerUid ? summary : null);

/** Theirs, or one they started: what the "Your roadmaps" section holds. */
export const isViewersRoadmap = (
  summary: UserRoadmapSummary,
  viewerUid: string | null,
) =>
  (viewerUid != null && summary.userId === viewerUid) ||
  summary.viewerProgress != null;

const hasSessions = (summary: UserRoadmapSummary, viewerUid: string | null) =>
  (viewerRun(summary, viewerUid)?.sessionsCompleted ?? 0) > 0;

const descending = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);

/**
 * The viewer's own roadmaps in the order they would pick them up: the ones
 * with sessions on them, last practised first, then the untouched ones,
 * newest first — a followed roadmap dated by when they started it.
 */
export const arrangeOwnRoadmaps = (
  summaries: UserRoadmapSummary[],
  viewerUid: string | null,
): UserRoadmapSummary[] =>
  [...summaries].sort((a, b) => {
    const aStarted = hasSessions(a, viewerUid);
    const bStarted = hasSessions(b, viewerUid);
    if (aStarted !== bStarted) return aStarted ? -1 : 1;
    if (aStarted)
      return descending(
        viewerRun(a, viewerUid)?.lastPractisedAt ?? "",
        viewerRun(b, viewerUid)?.lastPractisedAt ?? "",
      );
    return descending(
      a.viewerProgress?.startedAt ?? a.createdAt,
      b.viewerProgress?.startedAt ?? b.createdAt,
    );
  });

/**
 * The roadmap to put up front: the first one under way — sessions on it,
 * steps still to go. Null when nothing is, so a fresh list stays a grid.
 */
export const featuredRoadmap = (
  arranged: UserRoadmapSummary[],
  viewerUid: string | null,
): UserRoadmapSummary | null =>
  arranged.find((summary) => {
    const run = viewerRun(summary, viewerUid);
    return (
      !!run &&
      run.sessionsCompleted > 0 &&
      run.completedSteps < summary.stepCount
    );
  }) ?? null;
