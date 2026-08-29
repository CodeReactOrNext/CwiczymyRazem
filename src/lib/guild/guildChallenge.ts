import {
  previousWeekId,
  weekEnd,
  weekIdOf,
  weekStart,
} from "feature/communityGoal/utils/goalWeek";
import { challengeTierOf } from "feature/guilds/data/guildChallengeTiers";
import type { GuildMetric } from "feature/guilds/data/guildMetrics";
import {
  GUILD_METRICS,
  isTimeMetric,
  msToHours,
  objectiveLine,
} from "feature/guilds/data/guildMetrics";
import type {
  GuildChallenge,
  GuildMember,
  GuildMemberTally,
  GuildObjectiveProgress,
} from "feature/guilds/types/guild.types";
import {
  canClaimReward,
  nextStreak,
  objectiveTarget,
  streakStillStanding,
} from "feature/guilds/utils/guildChallenge.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { AggregateField, FieldValue } from "firebase-admin/firestore";
import { awardFame } from "lib/support/fameWallet";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild's weekly challenge: practise the things the guild signed up for, or
 * the streak goes.
 *
 * A week is a set of goals rather than one number — sessions, plus hours in the
 * practice categories the rank asks for (see `guildChallengeTiers.ts`). All of
 * them are measured out of the practice reports members already write, so there
 * is nothing to increment and nothing to forge — the same choice the community
 * goal makes, for the same reason.
 *
 * On the rank every guild starts on the week is paid in nothing but the streak.
 * A guild-wide Fame bonus was refused for a good reason: it would be a
 * permanent faucet keyed on membership, which turns not being in the biggest
 * guild into a tax. What a guild can buy keeps that objection answered rather
 * than dropped — a rank raises the ask as well as the reward, every goal scales
 * per member, and the Fame is claimed one member at a time against *that
 * member's own* tallies. Nobody is paid for standing in a big room; they are
 * paid for the week they personally put in, and they have to come and take it.
 */

const guildRef = (id: string): DocumentReference =>
  firestore.collection("guilds").doc(id);

/**
 * The week this member last took Fame for, from the guild's own ledger.
 *
 * Kept on the guild document rather than the user's because `guilds` is closed
 * to clients outright, and the user document is not: a claim record a client
 * could delete is a claim record that pays twice.
 */
const claimedWeekOf = (
  data: Record<string, any> | undefined,
  uid: string,
): string | null => {
  const week = data?.challengeClaims?.[uid];
  return typeof week === "string" ? week : null;
};

/**
 * What one member has in the window, per metric: a count for sessions, raw
 * milliseconds for everything else. Milliseconds stay raw until the roster has
 * been added up, otherwise every member's part-hour is thrown away before it
 * has been added to anybody else's.
 */
type RawTally = Partial<Record<GuildMetric, number>>;

/** Measuring is queries per member, so it is memoised per guild, week and rank. */
const CACHE_TTL_MS = 2 * 60_000;
const progressCache = new Map<
  string,
  { at: number; perMember: Record<string, RawTally> }
>();

/** Drops the memo. Exists so tests can move the underlying data between cases. */
export const resetChallengeCache = (): void => progressCache.clear();

/** Firestore allows at most five aggregations in one query. */
const AGGREGATES_PER_QUERY = 5;

/**
 * One member's week, measured over the metrics the rank actually asks for.
 *
 * Aggregations rather than reads: a count for the sessions and a sum per
 * category, over the per-user subcollection that is already indexed, so this
 * needs no new index of its own and never pulls a report document across.
 */
async function measureOne(
  uid: string,
  metrics: GuildMetric[],
  from: Date,
  to: Date,
): Promise<RawTally> {
  const window = firestore
    .collection("users")
    .doc(uid)
    .collection("exerciseData")
    .where("reportDate", ">=", from)
    .where("reportDate", "<", to);

  const chunks: GuildMetric[][] = [];
  for (let at = 0; at < metrics.length; at += AGGREGATES_PER_QUERY) {
    chunks.push(metrics.slice(at, at + AGGREGATES_PER_QUERY));
  }

  const parts = await Promise.all(
    chunks.map(async (chunk) => {
      const spec = Object.fromEntries(
        chunk.map((metric) => {
          const field = GUILD_METRICS[metric].field;
          return [
            metric,
            field ? AggregateField.sum(field) : AggregateField.count(),
          ];
        }),
      );

      const snap = await window.aggregate(spec as any).get();
      return snap.data() as Record<string, unknown>;
    }),
  );

  const tally: RawTally = {};
  for (const part of parts) {
    for (const metric of metrics) {
      if (part[metric] === undefined) continue;
      tally[metric] = Number(part[metric]) || 0;
    }
  }
  return tally;
}

/**
 * What every member has in the window.
 *
 * A guild is a handful of people, so this is a small fan-out rather than a
 * collection-group sweep — and a collection-group query could not be scoped to
 * one guild's members anyway, because membership lives on the parent document.
 */
async function measureMembers(
  members: GuildMember[],
  metrics: GuildMetric[],
  now: Date,
): Promise<Record<string, RawTally>> {
  const from = weekStart(now);
  const to = weekEnd(now);

  const measured = await Promise.all(
    members.map(async (member) => {
      try {
        const tally = await measureOne(member.uid, metrics, from, to);
        return [member.uid, tally] as const;
      } catch (error) {
        // One unreadable member must not take the whole week down with it.
        console.error("[guildChallenge] measure failed", member.uid, error);
        return [member.uid, {} as RawTally] as const;
      }
    }),
  );

  return Object.fromEntries(measured);
}

/** A raw tally in the unit its goal is stated in: sessions counted, time in hours. */
const amountOf = (tally: RawTally | undefined, metric: GuildMetric): number => {
  const raw = tally?.[metric] ?? 0;
  return isTimeMetric(metric) ? msToHours(raw) : Math.max(0, Math.floor(raw));
};

/**
 * Reads the challenge, and banks the week the first time it is seen cleared.
 * Lazy, like the other rollovers here — no cron to keep alive.
 */
export async function readChallenge(
  guildId: string,
  data: Record<string, any>,
  uid: string,
  now: Date = new Date(),
): Promise<GuildChallenge> {
  const members = (data.members ?? []) as GuildMember[];
  const thisWeek = weekIdOf(now);
  const previousWeek = previousWeekId(now);
  const tier = challengeTierOf(data.challengeTier);

  // Sessions are measured whether or not the rank asks for them: the roster is
  // ordered by them, and every rank so far wants them anyway.
  const metrics = [
    ...new Set<GuildMetric>([
      "sessions",
      ...tier.objectives.map((objective) => objective.metric),
    ]),
  ];

  const key = `${guildId}:${thisWeek}:${tier.id}`;
  const hit = progressCache.get(key);
  const perMemberRaw =
    hit && Date.now() - hit.at < CACHE_TTL_MS
      ? hit.perMember
      : await measureMembers(members, metrics, now);
  progressCache.set(key, { at: Date.now(), perMember: perMemberRaw });

  const objectives: GuildObjectiveProgress[] = tier.objectives.map(
    (objective) => {
      const { metric, perMember } = objective;
      const rawTotal = Object.values(perMemberRaw).reduce(
        (sum, tally) => sum + (tally[metric] ?? 0),
        0,
      );

      // Summed raw and converted once, so nobody's part-hour is rounded away
      // before it has been added to anybody else's.
      const progress = isTimeMetric(metric)
        ? msToHours(rawTotal)
        : Math.max(0, Math.floor(rawTotal));
      const target = objectiveTarget(members.length, perMember);
      const mine = amountOf(perMemberRaw[uid], metric);

      return {
        metric,
        perMember,
        target,
        progress,
        isComplete: progress >= target,
        mine,
        mineComplete: mine >= perMember,
      };
    },
  );

  const cleared = objectives.filter((objective) => objective.isComplete).length;
  const isComplete = objectives.length > 0 && cleared === objectives.length;
  const myShareDone = objectives.every((objective) => objective.mineComplete);

  const perMember: Record<string, GuildMemberTally> = Object.fromEntries(
    members.map((member) => {
      const tally = perMemberRaw[member.uid];
      const hours = Object.fromEntries(
        metrics
          .filter(isTimeMetric)
          .map((metric) => [metric, amountOf(tally, metric)]),
      ) as GuildMemberTally["hours"];

      return [
        member.uid,
        {
          sessions: amountOf(tally, "sessions"),
          hours,
          done: tier.objectives.filter(
            (objective) =>
              amountOf(tally, objective.metric) >= objective.perMember,
          ).length,
          total: tier.objectives.length,
        },
      ];
    }),
  );

  const lastCompletedWeek = (data.lastCompletedWeek as string) ?? null;
  const storedStreak = Number(data.challengeStreak) || 0;

  // A streak whose last win is older than last week is over the moment the
  // week rolls, not the next time the guild happens to play.
  const standing = streakStillStanding({
    lastCompletedWeek,
    thisWeek,
    previousWeek,
  });
  let streak = standing ? storedStreak : 0;

  if (isComplete && lastCompletedWeek !== thisWeek) {
    streak = nextStreak({
      currentStreak: storedStreak,
      lastCompletedWeek,
      thisWeek,
      previousWeek,
    });

    try {
      await guildRef(guildId).update({
        challengeStreak: streak,
        lastCompletedWeek: thisWeek,
        challengeBankedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("[guildChallenge] could not bank the week", guildId, error);
    }
  }

  const claimedWeek = claimedWeekOf(data, uid);

  return {
    weekId: thisWeek,
    objectives,
    cleared,
    isComplete,
    perMember,
    streak,
    endsAt: weekEnd(now).toISOString(),
    tier: tier.id,
    tierName: tier.name,
    reward: tier.reward,
    myShareDone,
    claimed: claimedWeek === thisWeek,
    canClaim: canClaimReward({
      reward: tier.reward,
      isComplete,
      myShareDone,
      claimedWeek,
      thisWeek,
    }),
  };
}

export type ClaimResult =
  | { ok: true; fame: number }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

/** What a member still owes their own share, said as the goals themselves. */
const owedLine = (challenge: GuildChallenge): string =>
  challenge.objectives
    .filter((objective) => !objective.mineComplete)
    .map((objective) =>
      objectiveLine(
        objective.metric,
        Math.max(0, objective.perMember - objective.mine),
      ),
    )
    .join(", ");

/**
 * Takes this week's Fame for one member.
 *
 * The eligibility is worked out from the same read the page uses, outside the
 * transaction, because measuring a week is an aggregate query and those cannot
 * run inside one. What the transaction re-checks from the stored document is
 * the pair that actually costs money if it is wrong: the rank the Fame is
 * priced off, and whether this member has already been paid this week. The
 * measuring can only be up to `CACHE_TTL_MS` stale, and staleness there delays
 * a claim rather than granting one.
 *
 * Claims are per guild. Somebody who leaves a cleared guild and is accepted
 * into another cleared one inside the same week could take a second payout —
 * which needs a founder to let them in, so it is a slower way to earn Fame than
 * practising.
 */
export async function claimChallengeReward(
  session: PlayerSession,
): Promise<ClaimResult> {
  const user = await userRef(session.uid).get();
  const guildId = user.data()?.guildId as string | undefined;
  if (!guildId)
    return { ok: false, status: 400, error: "You are not in a guild" };

  const snap = await guildRef(guildId).get();
  if (!snap.exists)
    return { ok: false, status: 404, error: "That guild is gone" };

  const challenge = await readChallenge(
    guildId,
    snap.data() ?? {},
    session.uid,
  );

  if (challenge.reward <= 0) {
    return {
      ok: false,
      status: 409,
      error: "This week pays nothing — the guild has not taken on a paid rank",
    };
  }
  if (!challenge.isComplete) {
    return {
      ok: false,
      status: 409,
      error: "The guild has not cleared every goal yet",
    };
  }
  if (!challenge.myShareDone) {
    return {
      ok: false,
      status: 403,
      error: `Your own share is not in yet — ${owedLine(challenge)} to go`,
    };
  }
  if (challenge.claimed) {
    return { ok: false, status: 409, error: "Already taken this week" };
  }

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    // Both reads first: a transaction may not read after it has written.
    const guild = await tx.get(guildRef(guildId));
    const me = await tx.get(userRef(session.uid));
    if (!guild.exists) return { state: "missing" as const };

    const data = guild.data() ?? {};
    // Priced off the stored rank inside the transaction, never off the object
    // the page was built from — the same rule the cosmetics shop runs on.
    const tier = challengeTierOf(data.challengeTier);
    if (tier.reward <= 0) return { state: "free-tier" as const };
    if (claimedWeekOf(data, session.uid) === challenge.weekId) {
      return { state: "already" as const };
    }

    tx.update(guildRef(guildId), {
      [`challengeClaims.${session.uid}`]: challenge.weekId,
    });
    awardFame(tx, me, tier.reward);

    return { state: "ok" as const, fame: tier.reward };
  });

  if (outcome.state === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome.state === "free-tier") {
    return { ok: false, status: 409, error: "This week pays nothing" };
  }
  if (outcome.state === "already") {
    return { ok: false, status: 409, error: "Already taken this week" };
  }

  return { ok: true, fame: outcome.fame };
}
