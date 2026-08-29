/**
 * What a goal counts. Every metric comes off the same practice-report data each
 * session already writes, so progress is derived rather than accumulated —
 * there is no counter for a client to nudge.
 *
 * `sessions` counts reports; `minutes` sums the whole session; the four
 * category metrics sum one slice of the practice timer each. The categories are
 * what let a week be *about* something — the ear training everybody skips, the
 * theory nobody logs — instead of only ever asking for more of the same.
 */
export type GoalMetric =
  | "sessions"
  | "minutes"
  | "technique"
  | "theory"
  | "hearing"
  | "creativity";

export interface GoalCandidate {
  id: string;
  metric: GoalMetric;
  /** Shown as the headline, with the target filled in. */
  label: string;
  /** One line on why this one is worth picking. */
  blurb: string;
  icon: GoalIcon;
  /** How much harder than last week's real number this asks for. */
  stretch: number;
  /** What one supporter is expected to be good for, used to size a week with no history. */
  perSupporter: number;
  /** Absolute floor, so a one-person roster still gets a goal worth the name. */
  floor: number;
}

/**
 * `marathon` and `spread` are retired candidates' icons, kept because goal
 * documents written before the category metrics existed still carry them.
 */
export type GoalIcon =
  | "sessions"
  | "hours"
  | "technique"
  | "theory"
  | "hearing"
  | "creativity"
  | "marathon"
  | "spread";

/** The goal running this week, with where the community has got to. */
export interface CommunityGoal {
  weekId: string;
  candidateId: string;
  metric: GoalMetric;
  label: string;
  icon: GoalIcon;
  target: number;
  progress: number;
  /** ISO instants bounding the week (UTC, Monday to Monday). */
  startsAt: string;
  endsAt: string;
  isComplete: boolean;
}

/** One option on next week's ballot, with what supporters have put behind it. */
export interface GoalBallotOption {
  candidateId: string;
  label: string;
  blurb: string;
  icon: GoalIcon;
  /** What this option would ask for if next week opened today. */
  target: number;
  /** What the target is counted in, e.g. "hours of ear training". */
  unit: string;
  tokens: number;
  /** Tokens this supporter has burned on this option. */
  mine: number;
}

export interface CommunityGoalState {
  current: CommunityGoal | null;
  /** Next week's vote — which goal the supporters are buying. */
  ballot: {
    weekId: string;
    options: GoalBallotOption[];
    /** Tokens this supporter has spent on the ballot so far. */
    myTokens: number;
    /** Size of the roster the targets are sized against. */
    supporters: number;
    /** The goal that just ran, sitting the ballot out. Null on a week with no history. */
    satOut: string | null;
  };
  /** Whether the signed-in player may take this week's reward, and why not. */
  reward: {
    fame: number;
    claimable: boolean;
    claimed: boolean;
    /** True when the goal is done but this player did not practise this week. */
    missedTheWeek: boolean;
  };
  isSupporter: boolean;
}
