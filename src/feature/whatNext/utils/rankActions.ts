import type {
  NextAction,
  NextActionKind,
  NextActionLane,
  NextActionSource,
  RankedAction,
} from "feature/whatNext/types/whatNext.types";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Every weight the ranking uses, in one place so it can be tuned against what
 * players actually click without hunting through the code.
 */
export const RANK_WEIGHTS = {
  base: {
    expiring: 100,
    continue: 70,
    start: 55,
    week: 45,
    balance: 40,
    horizon: 10,
    claim: 0,
  } satisfies Record<NextActionKind, number>,
  /** Extra pull of a deadline that runs out within a day, at its strongest. */
  urgency: 2,
  /** Extra pull of something nearly finished, at 100%. */
  closeness: 1.5,
  /** Extra pull of something left for three weeks. */
  staleness: 0.5,
  /** Something the player set up themselves — a goal, a calendar slot, a roadmap. */
  playerSet: 1.3,
  /** Tapped in the last day and still not done: let the next thing have a turn. */
  recentlyClicked: 0.6,
  /** Some sources matter more than their kind says. */
  source: {
    onboarding: 3,
    progression: 0.8,
  } as Partial<Record<NextActionSource, number>>,
  /** Top slots on the road that may not share a source. */
  diverseTop: 3,
};

export const LANE_LIMIT = 6;

export interface RankOptions {
  now: number;
  /** Action id → epoch ms until which it is hidden. */
  snoozed?: Record<string, number>;
  /** Action id → epoch ms of the last tap. */
  clicked?: Record<string, number>;
}

export const scoreAction = (
  action: NextAction,
  { now, clicked = {} }: RankOptions,
): number => {
  const w = RANK_WEIGHTS;
  let score = w.base[action.kind];

  if (action.deadlineAt !== undefined) {
    const hours = Math.max(0, (action.deadlineAt - now) / HOUR_MS);
    score *= 1 + w.urgency * Math.max(0, 1 - hours / 24);
  }
  if (action.progress && action.progress.max > 0) {
    const share = Math.min(1, action.progress.value / action.progress.max);
    score *= 1 + w.closeness * share * share;
  }
  if (action.staleDays !== undefined) {
    score *= 1 + w.staleness * (Math.min(action.staleDays, 21) / 21);
  }
  if (action.playerSet) score *= w.playerSet;
  score *= w.source[action.source] ?? 1;

  const lastClick = clicked[action.id];
  if (lastClick !== undefined && now - lastClick < 24 * HOUR_MS)
    score *= w.recentlyClicked;

  return Math.round(score * 10) / 10;
};

/**
 * Sorts by score, then keeps the first few slots to one action per source, so
 * three songs never push a goal and the daily board off the top of the road.
 */
export const rankActions = (
  actions: NextAction[],
  options: RankOptions,
): RankedAction[] => {
  const { now, snoozed = {} } = options;
  const sorted = actions
    .filter((action) => !(snoozed[action.id] > now))
    .map((action) => ({ ...action, score: scoreAction(action, options) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const top: RankedAction[] = [];
  const rest: RankedAction[] = [];
  const sources = new Set<NextActionSource>();
  sorted.forEach((action) => {
    if (top.length < RANK_WEIGHTS.diverseTop && !sources.has(action.source)) {
      sources.add(action.source);
      top.push(action);
    } else {
      rest.push(action);
    }
  });
  return [...top, ...rest];
};

/**
 * Sources that never lead: the exercise of the day is its own board with its
 * own prize, a side quest next to the player's practice, not the practice.
 */
const NEVER_HERO: ReadonlySet<NextActionSource> = new Set(["dailyExercise"]);

/**
 * The one action shown big: the best-ranked thing to *play* from the player's
 * own practice. The streak and the daily quest are not candidates — any
 * session keeps them, so they ride along as perks (see heroPerks).
 */
export const pickHero = (ranked: RankedAction[]): RankedAction | null =>
  ranked.find(
    (action) => action.isPractice && !NEVER_HERO.has(action.source),
  ) ?? null;

export const laneOf = (action: NextAction, now: number): NextActionLane => {
  if (action.kind === "expiring") return "today";
  if (action.kind === "horizon") return "horizon";
  if (action.kind === "week" || action.kind === "balance") {
    return action.deadlineAt !== undefined &&
      action.deadlineAt - now < 24 * HOUR_MS
      ? "today"
      : "week";
  }
  return "inProgress";
};

export const groupLanes = (
  ranked: RankedAction[],
  now: number,
  exclude?: string,
): Record<NextActionLane, RankedAction[]> => {
  const lanes: Record<NextActionLane, RankedAction[]> = {
    today: [],
    inProgress: [],
    week: [],
    horizon: [],
  };
  ranked.forEach((action) => {
    if (action.id === exclude) return;
    const lane = lanes[laneOf(action, now)];
    if (lane.length < LANE_LIMIT) lane.push(action);
  });
  return lanes;
};
