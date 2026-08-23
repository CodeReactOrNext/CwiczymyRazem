/**
 * Turns a session's two rewards into the lists of parts they were made of.
 *
 * The hero used to print Fame as a row of chips — "+46 Fame", "+20 from your
 * rig", "+15 streak bonus" — and every one of those was already *inside* the 46.
 * Read left to right they looked like things to add up, so players expected the
 * counter to move by 66 and reported the 46 it actually moved by as a bug. One
 * headline with its parts indented under it can only be read one way.
 *
 * The parts are therefore never trusted to reach the headline on their own: one
 * line in each list is whatever the named ones do not account for. A report
 * filed before a component existed, or a back-dated one (which pays a flat token
 * and nothing else), still adds up — the worst case is that an unnamed component
 * lands on the remainder line, not that the list contradicts the total.
 */

import { getStreakFameBonus } from "utils/gameLogic/calculateSessionFame";

/** Which glyph the row gets — resolved in the component, kept out of the data. */
export type BreakdownIcon = "time" | "habits" | "streak" | "rig";

export interface BreakdownSub {
  key: string;
  label: string;
  /** Pre-formatted — "+14" for a part, "×1.25" for a multiplier, "—" for none. */
  value: string;
  /** Earned nothing. Still listed: it is the next thing to go and get. */
  muted?: boolean;
}

export interface BreakdownRow {
  key: string;
  icon: BreakdownIcon;
  label: string;
  amount: number;
  subs: BreakdownSub[];
}

export interface FameBreakdownInput {
  /** Total Fame credited for the session. Every row below is a part of it. */
  fame: number;
  /** Flat daily bonus, 0 when another session already claimed it today. */
  streakBonus?: number;
  /** Streak after the report — names the row, never changes its amount. */
  streakDays?: number;
  /** What the rig's level paid. */
  rigBonus?: number;
  /** What the pedalboard's wiring order paid. */
  chainBonus?: number;
  /** What the gear's traits paid, after the rig ceiling took its cut. */
  traitBonus?: number;
  /** Whether the high-accuracy multiplier applied to the practice line. */
  accuracyBonus?: boolean;
}

export interface PointsBreakdownInput {
  /** Total points credited for the session. Every row below is a part of it. */
  totalPoints: number;
  /** Points the practised time was worth, before the streak multiplier. */
  timePoints?: number;
  /** Points the ticked healthy habits were worth, before the multiplier. */
  habitPoints?: number;
  /** The streak multiplier that was actually applied (0.15 = +15%). */
  streakMultiplier?: number;
}

const whole = (value: number | undefined): number =>
  value && value > 0 ? Math.round(value) : 0;

const fmt = (value: number): string => (value > 0 ? `+${value}` : "—");

/**
 * Naming the streak in the row is worth a check: the day count comes from the
 * activity log the rest of the screen reconciles against, while the bonus was
 * paid off the stored counter, and the two can disagree after a timezone slip.
 * A row that says "7-day streak +15" when 7 days pay 8 is exactly the kind of
 * arithmetic this whole change exists to stop, so an unexplainable pairing falls
 * back to a label that claims nothing.
 */
const streakLabel = (streakDays: number | undefined, bonus: number): string =>
  streakDays && streakDays > 1 && getStreakFameBonus(streakDays) === bonus
    ? `${streakDays}-day streak`
    : "Daily streak";

export const buildFameBreakdown = ({
  fame,
  streakBonus,
  streakDays,
  rigBonus,
  chainBonus,
  traitBonus,
  accuracyBonus,
}: FameBreakdownInput): BreakdownRow[] => {
  const streak = whole(streakBonus);
  const level = whole(rigBonus);
  const chain = whole(chainBonus);
  const traits = whole(traitBonus);
  const rig = level + chain + traits;
  const practice = Math.max(0, whole(fame) - streak - rig);

  const rows: BreakdownRow[] = [];

  if (practice > 0) {
    rows.push({
      key: "practice",
      icon: "time",
      label: "Practice time",
      amount: practice,
      // The multiplier is already baked into the amount above, so it is quoted
      // as a factor rather than as fame — a "+9" here would be a fourth part of
      // the total that the total does not contain.
      subs: accuracyBonus
        ? [{ key: "accuracy", label: "Clean playing", value: "×1.25" }]
        : [],
    });
  }

  if (streak > 0) {
    rows.push({
      key: "streak",
      icon: "streak",
      label: streakLabel(streakDays, streak),
      amount: streak,
      subs: [],
    });
  }

  if (rig > 0) {
    rows.push({
      key: "rig",
      icon: "rig",
      label: "Your rig",
      amount: rig,
      // Same three sources, in the same order, as the Rig Sheet in the Arsenal —
      // this screen is where a player finds out the sheet's rates are real, so
      // the two have to be readable against each other. Empty sources stay on
      // the list: "Signal path —" is how a player learns the wiring pays at all.
      subs: [
        { key: "level", label: "Rig level", value: fmt(level), muted: level === 0 },
        { key: "chain", label: "Signal path", value: fmt(chain), muted: chain === 0 },
        { key: "traits", label: "Traits", value: fmt(traits), muted: traits === 0 },
      ],
    });
  }

  return rows;
};

export const buildPointsBreakdown = ({
  totalPoints,
  timePoints,
  habitPoints,
  streakMultiplier,
}: PointsBreakdownInput): BreakdownRow[] => {
  const time = whole(timePoints);
  const habits = whole(habitPoints);
  // The streak line is the remainder for the same reason the practice line is
  // one in the fame list: the multiplier is floored over the sum of the others,
  // so recomputing it here would eventually round differently from the report.
  // It is only claimed as the streak's when there is something for the streak to
  // have multiplied — otherwise the report is one this screen cannot explain
  // (an old shape, missing `timePoints`), and it says nothing rather than
  // labelling the whole total as a bonus it may have nothing to do with.
  const explained = time + habits;
  const streak = explained > 0 ? Math.max(0, whole(totalPoints) - explained) : 0;

  const rows: BreakdownRow[] = [];

  if (time > 0) {
    rows.push({ key: "time", icon: "time", label: "Practice time", amount: time, subs: [] });
  }

  if (habits > 0) {
    rows.push({
      key: "habits",
      icon: "habits",
      label: "Healthy habits",
      amount: habits,
      subs: [],
    });
  }

  if (streak > 0) {
    rows.push({
      key: "streak",
      icon: "streak",
      label: "Streak bonus",
      amount: streak,
      // Unlike fame's flat daily bonus this one is a multiplier on the lines
      // above, and the percentage is the only thing that explains its size.
      subs:
        streakMultiplier && streakMultiplier > 0
          ? [
              {
                key: "rate",
                label: "On everything above",
                value: `+${Math.round(streakMultiplier * 100)}%`,
              },
            ]
          : [],
    });
  }

  return rows;
};
