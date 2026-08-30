import {
  COMMUNITY_GOAL_FAME_REWARD,
  defaultCandidateId,
  eligibleCandidates,
  getCandidate,
  GOAL_CANDIDATES,
  GOAL_METRICS,
  goalLabel,
  goalTarget,
  metricUnit,
} from "feature/communityGoal/data/goalCatalog";
import type {
  CommunityGoal,
  CommunityGoalState,
  GoalMetric,
} from "feature/communityGoal/types/communityGoal.types";
import {
  msToHours,
  nextWeekId,
  previousWeekId,
  weekEnd,
  weekIdOf,
  weekStart,
} from "feature/communityGoal/utils/goalWeek";
import { GOAL_VOTE_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import type {
  DocumentReference,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { AggregateField, FieldValue } from "firebase-admin/firestore";
import type { SupporterSession } from "lib/support/supporterAuth";
import { chargeTokens, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The weekly support challenge.
 *
 * Supporters run it, everybody watches it, and everybody who practised that
 * week may take the reward. Five decisions worth spelling out, because each
 * replaced something worse:
 *
 *  • **Progress is measured, never accumulated.** It comes from an aggregate
 *    over the practice reports players already write, so there is no counter to
 *    increment and therefore no endpoint anyone can hammer to fake a payout
 *    that hands out Fame to the entire app.
 *
 *  • **Only supporters move the bar.** The badge is what buys a place in the
 *    run, so the measurement is scoped to the roster rather than the whole app.
 *    Non-supporters see the same bar and claim the same reward — they just
 *    cannot push it, which is the thing being sold.
 *
 *  • **No unanimity.** An earlier shape needed every supporter to finish the
 *    goal, which is a `p^N` gate: it gets harder the better the donation drive
 *    goes, and one supporter who stops playing blocks it permanently — and the
 *    badge is deliberately never revoked. A shared target scales the other way.
 *
 *  • **Money picks the goal, not the payout.** Tokens decide which candidate
 *    runs; the reward is flat. Otherwise there is a straight line from a
 *    donation to Fame to rig level to the gear leaderboard, which is pay-to-win
 *    wearing a community hat.
 *
 *  • **Whatever just ran sits the next ballot out.** Six candidates and no
 *    repeats means the roster cycles through breadth, depth and the four
 *    practice categories instead of re-buying its favourite every week.
 */

const GOALS_COLLECTION = "communityGoals";
const BALLOTS_COLLECTION = "communityGoalBallots";
const CLAIMS_FIELD = "communityGoalClaims";

const goalRef = (weekId: string): DocumentReference =>
  firestore.collection(GOALS_COLLECTION).doc(weekId);

const ballotRef = (weekId: string): DocumentReference =>
  firestore.collection(BALLOTS_COLLECTION).doc(weekId);

/**
 * Aggregates are the expensive part of a page load, and the number moves by a
 * session at a time — a minute of staleness is invisible and saves a query on
 * every read. A window that has already closed cannot move at all, so last
 * week's figures (which size every target on the ballot) are held far longer.
 * Per-instance, so it warms up rather than being relied on.
 */
const CACHE_TTL_MS = 60_000;
const CLOSED_WINDOW_TTL_MS = 30 * 60_000;

/**
 * The roster moves when somebody donates, which is rare, and it is read on
 * every measurement — so it gets a longer memo than the progress it scopes.
 */
const ROSTER_TTL_MS = 5 * 60_000;
let rosterCache: { at: number; uids: string[] } | null = null;

/** Every metric over one window, so a whole ballot can be priced in one sweep. */
type MetricBundle = Record<GoalMetric, number>;

const emptyBundle = (): MetricBundle => ({
  sessions: 0,
  minutes: 0,
  technique: 0,
  theory: 0,
  hearing: 0,
  creativity: 0,
});

const METRIC_KEYS = Object.keys(emptyBundle()) as GoalMetric[];

const bundleCache = new Map<string, { at: number; value: MetricBundle }>();

/** Drops both memos. Exists so tests can move the underlying data between cases. */
export const resetProgressCache = (): void => {
  bundleCache.clear();
  rosterCache = null;
};

/** Everyone currently carrying the badge — the only people who move the bar. */
async function supporterUids(): Promise<string[]> {
  if (rosterCache && Date.now() - rosterCache.at < ROSTER_TTL_MS) {
    return rosterCache.uids;
  }

  const snap = await firestore
    .collection("users")
    .where("isSupport", "==", true)
    .get();

  const uids = (snap.docs as QueryDocumentSnapshot[]).map((doc) => doc.id);
  rosterCache = { at: Date.now(), uids };
  return uids;
}

/** How many players the targets are sized against. */
export const supporterCount = async (): Promise<number> =>
  (await supporterUids()).length;

/** A window's numbers, and whether every query behind them actually answered. */
interface Measurement {
  bundle: MetricBundle;
  complete: boolean;
}

/**
 * One supporter's whole contribution to the window: a session count, plus the
 * raw milliseconds behind each time metric.
 *
 * Three queries rather than one, for two reasons. Firestore allows at most five
 * aggregations per query and there are six things to ask for — and a `sum` over
 * a range filter needs a composite index covering every field it touches, while
 * a bare `count` needs none. The count therefore rides in a query of its own:
 * an index that has not been created yet costs the hours it belongs to and
 * leaves the session count standing, rather than zeroing the whole bundle.
 *
 * Each query is caught on its own for that same reason, and what could not be
 * asked is reported rather than passed off as a real zero. Milliseconds come
 * back raw — they are floored to hours only once the roster has been added up,
 * otherwise every supporter's part-hour is thrown away before it counts.
 */
const measureOne = async (
  uid: string,
  from: Date,
  to: Date,
): Promise<Measurement> => {
  const window = firestore
    .collection("users")
    .doc(uid)
    .collection("exerciseData")
    .where("reportDate", ">=", from)
    .where("reportDate", "<", to);

  const run = async (
    spec: Record<string, unknown>,
  ): Promise<Partial<MetricBundle> | null> => {
    try {
      return (
        await window.aggregate(spec as never).get()
      ).data() as Partial<MetricBundle>;
    } catch (error) {
      // A missing composite index is the likely cause, and it names itself in
      // the message along with the link that creates it.
      console.error("[communityGoal] aggregate failed", error);
      return null;
    }
  };

  const parts = await Promise.all([
    run({ sessions: AggregateField.count() }),
    run({
      minutes: AggregateField.sum(GOAL_METRICS.minutes.field!),
      technique: AggregateField.sum(GOAL_METRICS.technique.field!),
      theory: AggregateField.sum(GOAL_METRICS.theory.field!),
    }),
    run({
      hearing: AggregateField.sum(GOAL_METRICS.hearing.field!),
      creativity: AggregateField.sum(GOAL_METRICS.creativity.field!),
    }),
  ]);

  const bundle = emptyBundle();
  for (const part of parts) {
    if (!part) continue;
    for (const metric of METRIC_KEYS) {
      if (part[metric] !== undefined)
        bundle[metric] = Number(part[metric]) || 0;
    }
  }

  return { bundle, complete: parts.every(Boolean) };
};

/** How many supporters are queried at once, so a large roster can't fan out unbounded. */
const ROSTER_BATCH = 8;

/**
 * How much the *supporters* did in a window, straight from the practice
 * reports — every metric at once, because the ballot prices all six of them and
 * measuring one at a time would multiply the fan-out by six.
 *
 * Scoped per supporter rather than as one `collectionGroup` sweep because the
 * badge lives on the user document and a collection-group query cannot filter
 * on a parent's field. That is two aggregates per supporter — affordable only
 * because the roster is small and both it and the result are memoised.
 */
export async function measureAll(from: Date, to: Date): Promise<MetricBundle> {
  const key = `${from.toISOString()}:${to.toISOString()}`;
  const ttl = to.getTime() <= Date.now() ? CLOSED_WINDOW_TTL_MS : CACHE_TTL_MS;

  const hit = bundleCache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;

  const totals = emptyBundle();
  let complete = true;

  try {
    const uids = await supporterUids();

    for (let i = 0; i < uids.length; i += ROSTER_BATCH) {
      const batch = await Promise.all(
        uids.slice(i, i + ROSTER_BATCH).map((uid) => measureOne(uid, from, to)),
      );
      for (const part of batch) {
        if (!part.complete) complete = false;
        for (const metric of METRIC_KEYS) totals[metric] += part.bundle[metric];
      }
    }

    // Hours are floored once over the roster total, never per supporter.
    for (const metric of METRIC_KEYS) {
      if (metric !== "sessions") totals[metric] = msToHours(totals[metric]);
    }
  } catch (error) {
    // The roster read is all that is left to throw, and a goal that cannot be
    // measured must not read as "already done" — zeroes keep it honest.
    console.error("[communityGoal] measure failed", error);
    return emptyBundle();
  }

  // A window that could not be asked in full is short by whatever the failed
  // query carried, and memoising that would hold the shortfall for the whole
  // TTL — half an hour on a closed window. It is answered now and asked again
  // next time, so the number repairs itself the moment the index lands.
  if (complete) bundleCache.set(key, { at: Date.now(), value: totals });
  return totals;
}

/** One metric out of the window's bundle. */
export const measure = async (
  metric: GoalMetric,
  from: Date,
  to: Date,
): Promise<number> => (await measureAll(from, to))[metric] ?? 0;

/** The closed week before the one containing `now`. */
const lastWeekWindow = (now: Date): [Date, Date] => [
  weekStart(new Date(weekStart(now).getTime() - 1)),
  weekStart(now),
];

/** Which candidate ran in the week before this one, if that week ever opened. */
const ranLastWeek = async (now: Date): Promise<string | null> => {
  const snap = await goalRef(previousWeekId(now)).get();
  return (snap.data()?.candidateId as string | undefined) ?? null;
};

/** Highest-voted eligible candidate on a ballot, or the default when nobody voted. */
const ballotWinner = async (
  weekId: string,
  excludeId: string | null,
): Promise<string> => {
  const tallies = ((await ballotRef(weekId).get()).data()?.tallies ??
    {}) as Record<string, number>;

  const eligible = eligibleCandidates(excludeId);

  const [winner] = Object.entries(tallies)
    // Tokens on a retired candidate — or on the one sitting this ballot out —
    // are ignored rather than being allowed to win it.
    .filter(([id]) => eligible.some((candidate) => candidate.id === id))
    // A tie goes to the candidate listed first, so the outcome is deterministic.
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        eligible.findIndex((candidate) => candidate.id === a[0]) -
          eligible.findIndex((candidate) => candidate.id === b[0]),
    );

  return winner?.[0] ?? defaultCandidateId(excludeId);
};

/**
 * Opens this week's goal if it isn't open yet. Lazy, like the monthly challenge
 * rollover: the first read after Monday does the work, so there is no cron to
 * keep alive.
 */
export async function ensureCurrentGoal(
  now: Date = new Date(),
): Promise<CommunityGoal> {
  const weekId = weekIdOf(now);
  const existing = await goalRef(weekId).get();

  if (existing.exists) {
    const data = existing.data()!;
    const progress = await measure(
      data.metric as GoalMetric,
      weekStart(now),
      weekEnd(now),
    );

    return {
      weekId,
      candidateId: data.candidateId,
      metric: data.metric,
      label: data.label,
      icon: data.icon,
      target: data.target,
      progress,
      startsAt: weekStart(now).toISOString(),
      endsAt: weekEnd(now).toISOString(),
      isComplete: progress >= data.target,
    };
  }

  const satOut = await ranLastWeek(now);
  const candidate = getCandidate(await ballotWinner(weekId, satOut));

  // The target is last week's real number plus a stretch, and is sized off the
  // roster when there is no history to stretch — so nobody has to guess what a
  // normal week looks like, and the guess that is left grows with the roster.
  const [lastWeek, supporters] = await Promise.all([
    measureAll(...lastWeekWindow(now)),
    supporterCount(),
  ]);
  const baseline = lastWeek[candidate.metric];
  const target = goalTarget(candidate, baseline, supporters);

  const goal = {
    candidateId: candidate.id,
    metric: candidate.metric,
    label: goalLabel(candidate.label, target),
    icon: candidate.icon,
    target,
    baseline,
    roster: supporters,
    satOut,
    openedAt: FieldValue.serverTimestamp(),
  };

  await goalRef(weekId).set(goal, { merge: true });

  const progress = await measure(
    candidate.metric,
    weekStart(now),
    weekEnd(now),
  );

  return {
    weekId,
    candidateId: candidate.id,
    metric: candidate.metric,
    label: goal.label,
    icon: candidate.icon,
    target,
    progress,
    startsAt: weekStart(now).toISOString(),
    endsAt: weekEnd(now).toISOString(),
    isComplete: progress >= target,
  };
}

/** Whether this player practised inside the given week — the price of the reward. */
const practisedThisWeek = async (
  uid: string,
  now: Date = new Date(),
): Promise<boolean> => {
  const snap = await firestore
    .collection("users")
    .doc(uid)
    .collection("exerciseData")
    .where("reportDate", ">=", weekStart(now))
    .limit(1)
    .get();

  return !snap.empty;
};

export async function readState(
  uid: string,
  isSupporter: boolean,
  now: Date = new Date(),
): Promise<CommunityGoalState> {
  const ballotWeekId = nextWeekId(now);

  const [current, ballotSnap, user, lastWeek, thisWeek, supporters] =
    await Promise.all([
      ensureCurrentGoal(now),
      ballotRef(ballotWeekId).get(),
      userRef(uid).get(),
      measureAll(...lastWeekWindow(now)),
      measureAll(weekStart(now), weekEnd(now)),
      supporterCount(),
    ]);

  const tallies = (ballotSnap.data()?.tallies ?? {}) as Record<string, number>;
  const mine = (ballotSnap.data()?.voters?.[uid] ?? {}) as Record<
    string,
    number
  >;

  const claimed = Boolean(user.data()?.[CLAIMS_FIELD]?.[current.weekId]);
  const active =
    current.isComplete && !claimed ? await practisedThisWeek(uid, now) : false;

  return {
    current,
    ballot: {
      weekId: ballotWeekId,
      // Whatever is running now is next week's "last week", so it is the one
      // that sits this ballot out.
      options: eligibleCandidates(current.candidateId).map((candidate) => {
        // Priced off whichever week the roster did more in. Next week's real
        // target is built on this week, but this week is only a lower bound
        // until Sunday — so last week's closed figure holds the floor until
        // the running one overtakes it.
        const baseline = Math.max(
          lastWeek[candidate.metric],
          thisWeek[candidate.metric],
        );
        const target = goalTarget(candidate, baseline, supporters);

        return {
          candidateId: candidate.id,
          label: goalLabel(candidate.label, target),
          blurb: candidate.blurb,
          icon: candidate.icon,
          target,
          unit: metricUnit(candidate.metric),
          tokens: Math.max(0, tallies[candidate.id] ?? 0),
          mine: Math.max(0, mine[candidate.id] ?? 0),
        };
      }),
      myTokens: Object.values(mine).reduce(
        (sum, tokens) => sum + Math.max(0, tokens || 0),
        0,
      ),
      supporters,
      satOut: current.candidateId,
    },
    reward: {
      fame: COMMUNITY_GOAL_FAME_REWARD,
      claimable: current.isComplete && !claimed && active,
      claimed,
      missedTheWeek: current.isComplete && !claimed && !active,
    },
    isSupporter,
  };
}

export type GoalResult =
  | { ok: true; state: CommunityGoalState }
  | { ok: false; status: 400 | 402 | 403 | 409; error: string };

/** Burns a token onto one option of next week's ballot. */
export async function voteOnBallot(
  session: SupporterSession,
  candidateId: string,
  now: Date = new Date(),
): Promise<GoalResult> {
  if (!GOAL_CANDIDATES.some((candidate) => candidate.id === candidateId)) {
    return { ok: false, status: 400, error: "Unknown goal" };
  }

  const current = await ensureCurrentGoal(now);
  if (candidateId === current.candidateId) {
    return {
      ok: false,
      status: 409,
      error: "That one is running this week — it sits the next ballot out",
    };
  }

  const weekId = nextWeekId(now);

  const charged = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    if (!chargeTokens(tx, user, GOAL_VOTE_COST)) return false;

    tx.set(
      ballotRef(weekId),
      {
        tallies: { [candidateId]: FieldValue.increment(GOAL_VOTE_COST) },
        voters: {
          [session.uid]: {
            [candidateId]: FieldValue.increment(GOAL_VOTE_COST),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  });

  if (!charged) {
    return {
      ok: false,
      status: 402,
      error: "Not enough tokens left",
    };
  }

  return { ok: true, state: await readState(session.uid, true, now) };
}

/**
 * Pays the flat reward once, to a player who practised in the week the goal was
 * met. Claim rather than push: a payout to every account would be a mass write,
 * and it would hand Fame to people who were not there.
 */
export async function claimReward(
  uid: string,
  isSupporter: boolean,
  now: Date = new Date(),
): Promise<GoalResult> {
  const goal = await ensureCurrentGoal(now);
  if (!goal.isComplete) {
    return { ok: false, status: 409, error: "The goal is not done yet" };
  }
  if (!(await practisedThisWeek(uid, now))) {
    return {
      ok: false,
      status: 403,
      error: "The reward is for players who practised this week",
    };
  }

  const paid = await firestore.runTransaction(async (tx: Transaction) => {
    const ref = userRef(uid);
    const user = await tx.get(ref);
    if (user.data()?.[CLAIMS_FIELD]?.[goal.weekId]) return false;

    tx.update(ref, {
      [`${CLAIMS_FIELD}.${goal.weekId}`]: new Date().toISOString(),
      "statistics.fame": FieldValue.increment(COMMUNITY_GOAL_FAME_REWARD),
    });
    return true;
  });

  if (!paid) {
    return { ok: false, status: 409, error: "Already claimed this week" };
  }

  return { ok: true, state: await readState(uid, isSupporter, now) };
}
