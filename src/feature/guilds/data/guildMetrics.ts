/**
 * What a guild's weekly goals are counted in.
 *
 * A challenge used to be one number — sessions, and nothing else — which said
 * nothing about *what* the week was spent on and left a guild of four people
 * doing four completely different things reading as one flat bar. A goal now
 * names a metric, and the metrics are the same ones the practice report already
 * writes down: the session itself, plus the four practice categories the timer
 * splits every session into.
 *
 * Nothing new is stored for any of this. `field` is the path the report already
 * keeps its milliseconds under, so a goal is measured by summing reports rather
 * than by incrementing a counter somebody could forge — the same choice the
 * community goal makes, for the same reason.
 */

export type GuildMetric =
  | "sessions"
  | "technique"
  | "theory"
  | "hearing"
  | "creativity";

export interface GuildMetricSpec {
  /** What the goal line calls it, e.g. "technique". */
  label: string;
  /** What one of it is, spelled out for the ask: "2h of technique each". */
  unit: "sessions" | "hours";
  /**
   * The report field summed for it, or null for a plain count of reports.
   * Sums come back in milliseconds and are stated in hours everywhere else.
   */
  field: string | null;
}

export const GUILD_METRICS: Record<GuildMetric, GuildMetricSpec> = {
  sessions: { label: "practice sessions", unit: "sessions", field: null },
  technique: {
    label: "technique",
    unit: "hours",
    field: "timeSumary.techniqueTime",
  },
  theory: { label: "theory", unit: "hours", field: "timeSumary.theoryTime" },
  hearing: {
    label: "ear training",
    unit: "hours",
    field: "timeSumary.hearingTime",
  },
  creativity: {
    label: "creative playing",
    unit: "hours",
    field: "timeSumary.creativityTime",
  },
};

export const GUILD_METRIC_KEYS = Object.keys(GUILD_METRICS) as GuildMetric[];

/** Whether the metric sums the practice timer rather than counting reports. */
export const isTimeMetric = (metric: GuildMetric): boolean =>
  GUILD_METRICS[metric].field !== null;

/**
 * An amount with the unit stuck on it: "4 sessions", "2.5h".
 *
 * Hours carry at most one decimal, because a tenth of an hour is six minutes
 * and nobody plans a practice week to the minute.
 */
export const formatAmount = (metric: GuildMetric, amount: number): string => {
  const value = Math.round((Number.isFinite(amount) ? amount : 0) * 10) / 10;

  if (!isTimeMetric(metric)) {
    return `${value} ${value === 1 ? "session" : "sessions"}`;
  }
  return `${value}h`;
};

/** The goal as the week states it, e.g. "2h of technique" or "4 sessions". */
export const objectiveLine = (metric: GuildMetric, amount: number): string =>
  isTimeMetric(metric)
    ? `${formatAmount(metric, amount)} of ${GUILD_METRICS[metric].label}`
    : formatAmount(metric, amount);

/**
 * Milliseconds as the tenths of an hour a goal is measured in.
 *
 * Rounded *down* on purpose: what a member is shown is exactly what the target
 * is compared against, so nothing can read "1h" on screen while the goal still
 * counts it as short.
 */
export const msToHours = (ms: number): number =>
  Math.max(0, Math.floor(((Number.isFinite(ms) ? ms : 0) / 3_600_000) * 10)) /
  10;
