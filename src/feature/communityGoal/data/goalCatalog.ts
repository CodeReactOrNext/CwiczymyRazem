import type {
  GoalCandidate,
  GoalMetric,
} from "feature/communityGoal/types/communityGoal.types";

/**
 * What each metric counts, and the report field it counts it over.
 *
 * `sessions` is a count; everything else sums a slice of the practice timer
 * (stored in milliseconds) and is stated in whole hours.
 */
export const GOAL_METRICS: Record<
  GoalMetric,
  { unit: string; field: string | null }
> = {
  sessions: { unit: "sessions", field: null },
  minutes: { unit: "hours", field: "timeSumary.sumTime" },
  technique: { unit: "hours of technique", field: "timeSumary.techniqueTime" },
  theory: { unit: "hours of theory", field: "timeSumary.theoryTime" },
  hearing: { unit: "hours of ear training", field: "timeSumary.hearingTime" },
  creativity: {
    unit: "hours of creativity",
    field: "timeSumary.creativityTime",
  },
};

/** What a target is counted in, for the progress line and the ballot. */
export const metricUnit = (metric: GoalMetric): string =>
  GOAL_METRICS[metric]?.unit ?? GOAL_METRICS.sessions.unit;

/** The same unit, short enough to sit inside a per-supporter line. */
export const metricShortUnit = (metric: GoalMetric): string =>
  metric === "sessions" ? "sessions" : "h";

/**
 * What a target works out at per supporter, spelled out.
 *
 * "48 hours together" says how big the number is and nothing about whether the
 * week is a stretch or a formality — the reader has to know the roster size and
 * do the division. This is the number a supporter is actually agreeing to, so
 * every screen that shows a target shows it underneath.
 */
export const perSupporterLine = (
  target: number,
  supporters: number,
  metric: GoalMetric,
): string | null => {
  if (!Number.isFinite(target) || target <= 0) return null;
  if (!Number.isFinite(supporters) || supporters <= 0) return null;

  const each = Math.round((target / supporters) * 10) / 10;
  const roster =
    supporters === 1 ? "the one supporter" : `${supporters} supporters`;

  return `about ${each} ${metricShortUnit(metric)} each across ${roster}`;
};

/**
 * The ballot supporters choose from.
 *
 * Two shape-of-the-week goals — breadth (sessions) and depth (hours) — plus one
 * per practice category, so a week can be about the thing the roster keeps
 * skipping rather than only ever "more of the same".
 *
 * Targets are not written down here on purpose. Nobody — me included — knows
 * what a normal week looks like well enough to hardcode a number that is
 * neither trivial nor impossible, and whatever is true today stops being true
 * as the app grows. So each candidate carries a *stretch* over what the
 * supporters actually did last week, plus a size for the weeks with no history
 * at all. The goal is always a clear step up from last time — a third more on
 * the two broad goals, half again on a single practice category, because a
 * target the roster would have cleared by accident is not a challenge anybody
 * would spend a token to pick.
 */
export const GOAL_CANDIDATES: GoalCandidate[] = [
  {
    id: "sessions-push",
    metric: "sessions",
    label: "Log {target} practice sessions together",
    blurb: "Breadth: every session counts the same, however short.",
    icon: "sessions",
    stretch: 1.35,
    perSupporter: 5,
    floor: 12,
  },
  {
    id: "hours-push",
    metric: "minutes",
    label: "Put in {target} hours of practice together",
    blurb: "Depth: long sessions carry the week.",
    icon: "hours",
    stretch: 1.35,
    perSupporter: 5,
    floor: 8,
  },
  {
    id: "technique-hours",
    metric: "technique",
    label: "Put in {target} hours of technique together",
    blurb: "Metronome week — scales, picking, the unglamorous reps.",
    icon: "technique",
    stretch: 1.5,
    perSupporter: 2.5,
    floor: 5,
  },
  {
    id: "hearing-hours",
    metric: "hearing",
    label: "Put in {target} hours of ear training together",
    blurb: "The one everybody means to do and nobody logs.",
    icon: "hearing",
    stretch: 1.5,
    perSupporter: 1.5,
    floor: 4,
  },
  {
    id: "theory-hours",
    metric: "theory",
    label: "Put in {target} hours of theory together",
    blurb: "Names for what your fingers already do — a week at the desk.",
    icon: "theory",
    stretch: 1.5,
    perSupporter: 1.5,
    floor: 4,
  },
  {
    id: "creativity-hours",
    metric: "creativity",
    label: "Put in {target} hours of creative playing together",
    blurb: "Improvising, writing, jamming — playing with nothing to hit.",
    icon: "creativity",
    stretch: 1.5,
    perSupporter: 1.5,
    floor: 4,
  },
];

export const DEFAULT_CANDIDATE_ID = "sessions-push";

export const getCandidate = (id: string): GoalCandidate =>
  GOAL_CANDIDATES.find((candidate) => candidate.id === id) ??
  GOAL_CANDIDATES.find((candidate) => candidate.id === DEFAULT_CANDIDATE_ID)!;

/**
 * The ballot, minus whatever just ran.
 *
 * The app never plays the same goal two weeks running: a repeat wastes the one
 * lever supporters have, and the roster that just spent a week on ear training
 * is the worst possible baseline for asking it to do more ear training.
 */
export const eligibleCandidates = (
  excludeId?: string | null,
): GoalCandidate[] => {
  const rest = GOAL_CANDIDATES.filter(
    (candidate) => candidate.id !== excludeId,
  );
  // Never hand back an empty ballot, however the catalog is edited later.
  return rest.length > 0 ? rest : GOAL_CANDIDATES;
};

/** What runs when nobody voted — the default, unless the default just ran. */
export const defaultCandidateId = (excludeId?: string | null): string => {
  const eligible = eligibleCandidates(excludeId);
  return (
    eligible.find((candidate) => candidate.id === DEFAULT_CANDIDATE_ID) ??
    eligible[0]
  ).id;
};

/**
 * How far above the roster's own last week a roster-sized floor may reach.
 * Without a cap, a donation drive that doubles the roster sets a target nobody
 * on it can reach — the bar would grow with the money rather than the playing.
 */
export const MAX_ROSTER_LIFT = 1.8;

/**
 * The number the week asks for.
 *
 * Last week's real figure plus the candidate's stretch, so it is always
 * reachable-but-not-free. A week with no history at all — a fresh metric, or a
 * roster that logged nothing — is sized off the roster instead, at
 * `perSupporter` each. That roster size can also lift a target last week left
 * embarrassingly low, but never past `MAX_ROSTER_LIFT` over what the roster
 * actually managed.
 */
export const goalTarget = (
  candidate: GoalCandidate,
  lastWeek: number,
  supporters: number,
): number => {
  const rosterSize = Math.max(
    candidate.floor,
    Math.ceil(Math.max(0, supporters) * candidate.perSupporter),
  );

  const baseline = Number.isFinite(lastWeek) ? Math.max(0, lastWeek) : 0;
  if (baseline <= 0) return rosterSize;

  return Math.max(
    1,
    Math.ceil(baseline * candidate.stretch),
    Math.min(rosterSize, Math.ceil(baseline * MAX_ROSTER_LIFT)),
  );
};

/** Fills the target into the candidate's headline. */
export const goalLabel = (label: string, target: number | string): string =>
  label.replace("{target}", String(target));

/** Flat, and deliberately not scaled by tokens burned: money picks the goal, never the payout. */
export const COMMUNITY_GOAL_FAME_REWARD = 200;
