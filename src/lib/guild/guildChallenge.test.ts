import { weekIdOf, weekStart } from "feature/communityGoal/utils/goalWeek";
import { GUILD_CHALLENGE_TIERS } from "feature/guilds/data/guildChallengeTiers";
import type { GuildMetric } from "feature/guilds/data/guildMetrics";
import { GUILD_METRICS } from "feature/guilds/data/guildMetrics";
import { SESSIONS_PER_MEMBER } from "feature/guilds/utils/guildChallenge.utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Firestore with the one thing this module needs: aggregations over a
 * member's practice reports, scoped to a date window — a count for the
 * sessions, and a sum per practice category.
 */
const store = new Map<string, Record<string, any>>();

/** Practice reports as [ownerUid, when, milliseconds per report field]. */
type Report = [string, Date, Record<string, number>];
let reports: Report[] = [];

type Aggregation = { kind: "count" } | { kind: "sum"; field: string };

const windowQuery = (owner: string) => {
  let from = new Date(0);
  let to = new Date(8.64e15);

  const query = {
    where: (_field: string, op: string, value: Date) => {
      if (op === ">=") from = value;
      if (op === "<") to = value;
      return query;
    },
    aggregate: (spec: Record<string, Aggregation>) => ({
      get: async () => ({
        data: () => {
          const window = reports.filter(
            ([uid, when]) => uid === owner && when >= from && when < to,
          );

          return Object.fromEntries(
            Object.entries(spec).map(([alias, aggregation]) => [
              alias,
              aggregation.kind === "count"
                ? window.length
                : window.reduce(
                    (sum, [, , times]) => sum + (times[aggregation.field] ?? 0),
                    0,
                  ),
            ]),
          );
        },
      }),
    }),
  };

  return query;
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        update: async (patch: Record<string, any>) =>
          store.set(`${name}/${id}`, {
            ...(store.get(`${name}/${id}`) ?? {}),
            ...patch,
          }),
        collection: () => windowQuery(id),
      }),
    }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => new Date("2026-08-29T00:00:00.000Z") },
  AggregateField: {
    count: () => ({ kind: "count" }),
    sum: (field: string) => ({ kind: "sum", field }),
  },
}));

const { readChallenge, resetChallengeCache } = await import("./guildChallenge");

const HOUR_MS = 3_600_000;
const NOW = new Date("2026-08-28T12:00:00.000Z"); // a Friday
const THIS_WEEK = weekIdOf(NOW);
const LAST_WEEK = weekIdOf(new Date(weekStart(NOW).getTime() - 1));

const members = (...uids: string[]) =>
  uids.map((uid) => ({ uid, displayName: uid, avatar: null }));

/**
 * Logs `count` sessions for a member inside the current week, with `hours` of
 * category time carried by the first of them — which is where practice time
 * comes from anyway.
 */
const logSessions = (
  uid: string,
  count: number,
  hours: Partial<Record<GuildMetric, number>> = {},
) => {
  const times = Object.fromEntries(
    Object.entries(hours).map(([metric, amount]) => [
      GUILD_METRICS[metric as GuildMetric].field as string,
      amount * HOUR_MS,
    ]),
  );

  for (let i = 0; i < count; i++) {
    reports.push([
      uid,
      new Date(weekStart(NOW).getTime() + i * HOUR_MS),
      i === 0 ? times : {},
    ]);
  }
};

const banked = (): Record<string, any> | undefined =>
  store.get("guilds/riff-raiders");

beforeEach(() => {
  store.clear();
  reports = [];
  resetChallengeCache();
});

describe("readChallenge", () => {
  it("asks for a week's worth of sessions from each member", async () => {
    const challenge = await readChallenge(
      "riff-raiders",
      { members: members("a", "b") },
      "a",
      NOW,
    );

    expect(challenge.objectives).toHaveLength(1);
    expect(challenge.objectives[0]).toMatchObject({
      metric: "sessions",
      perMember: SESSIONS_PER_MEMBER,
      target: 2 * SESSIONS_PER_MEMBER,
      progress: 0,
      isComplete: false,
    });
    expect(challenge.isComplete).toBe(false);
    expect(challenge.cleared).toBe(0);
  });

  it("counts every member's sessions, and only this week's", async () => {
    logSessions("a", 2);
    logSessions("b", 1);
    // Last week belongs to a week already settled.
    reports.push(["a", new Date(weekStart(NOW).getTime() - 1), {}]);

    const challenge = await readChallenge(
      "riff-raiders",
      { members: members("a", "b") },
      "a",
      NOW,
    );

    expect(challenge.objectives[0].progress).toBe(3);
  });

  it("banks the week and starts a streak the first time it is cleared", async () => {
    logSessions("a", SESSIONS_PER_MEMBER);

    const challenge = await readChallenge(
      "riff-raiders",
      { members: members("a") },
      "a",
      NOW,
    );

    expect(challenge.isComplete).toBe(true);
    expect(challenge.streak).toBe(1);
    expect(banked()).toMatchObject({
      challengeStreak: 1,
      lastCompletedWeek: THIS_WEEK,
    });
  });

  it("extends a streak that ran through last week", async () => {
    logSessions("a", SESSIONS_PER_MEMBER);

    const challenge = await readChallenge(
      "riff-raiders",
      {
        members: members("a"),
        challengeStreak: 4,
        lastCompletedWeek: LAST_WEEK,
      },
      "a",
      NOW,
    );

    expect(challenge.streak).toBe(5);
  });

  it("does not bank the same week twice", async () => {
    logSessions("a", SESSIONS_PER_MEMBER);

    const stored = {
      members: members("a"),
      challengeStreak: 3,
      lastCompletedWeek: THIS_WEEK,
    };
    const challenge = await readChallenge("riff-raiders", stored, "a", NOW);

    expect(challenge.streak).toBe(3);
    // Nothing was written, because there was nothing new to bank.
    expect(banked()).toBeUndefined();
  });

  it("shows a broken streak as broken before the guild plays again", async () => {
    const challenge = await readChallenge(
      "riff-raiders",
      {
        members: members("a"),
        challengeStreak: 7,
        // Two weeks back: the run is over the moment this week began.
        lastCompletedWeek: weekIdOf(
          new Date(weekStart(NOW).getTime() - 8 * 86_400_000),
        ),
      },
      "a",
      NOW,
    );

    expect(challenge.streak).toBe(0);
    expect(challenge.isComplete).toBe(false);
  });

  it("keeps last week's streak on screen until this week is decided", async () => {
    const challenge = await readChallenge(
      "riff-raiders",
      {
        members: members("a"),
        challengeStreak: 2,
        lastCompletedWeek: LAST_WEEK,
      },
      "a",
      NOW,
    );

    expect(challenge.streak).toBe(2);
    expect(challenge.isComplete).toBe(false);
  });

  it("says what each member put in, not only the total", async () => {
    logSessions("a", 3);
    logSessions("b", 1);

    const challenge = await readChallenge(
      "riff-raiders",
      { members: members("a", "b", "c") },
      "a",
      NOW,
    );

    // Every member is named, including the one who has not played: the roster
    // reads its rows straight off this.
    expect(challenge.perMember).toEqual({
      a: { sessions: 3, hours: {}, done: 1, total: 1 },
      b: { sessions: 1, hours: {}, done: 0, total: 1 },
      c: { sessions: 0, hours: {}, done: 0, total: 1 },
    });
  });

  it("holds a floor for a guild nobody has joined", async () => {
    const challenge = await readChallenge(
      "riff-raiders",
      { members: [] },
      "a",
      NOW,
    );

    expect(challenge.objectives[0].target).toBeGreaterThan(0);
    expect(challenge.isComplete).toBe(false);
  });
});

describe("readChallenge on a bought rank", () => {
  const tier = GUILD_CHALLENGE_TIERS[1];
  const sessionsAsk = tier.objectives[0].perMember;
  const techniqueAsk = tier.objectives[1].perMember;

  const onRankTwo = (extra: Record<string, any> = {}) => ({
    members: members("a", "b"),
    challengeTier: 1,
    ...extra,
  });

  it("asks for every goal the rank carries, scaled by the roster", async () => {
    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.tier).toBe(1);
    expect(challenge.tierName).toBe(tier.name);
    expect(challenge.reward).toBe(tier.reward);
    expect(
      challenge.objectives.map((objective) => [
        objective.metric,
        objective.perMember,
        objective.target,
      ]),
    ).toEqual([
      ["sessions", sessionsAsk, 2 * sessionsAsk],
      ["technique", techniqueAsk, 2 * techniqueAsk],
    ]);
  });

  it("measures a category goal out of the practice timer", async () => {
    logSessions("a", sessionsAsk, { technique: techniqueAsk });
    logSessions("b", sessionsAsk, { technique: techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.objectives[1].progress).toBe(2 * techniqueAsk);
    expect(challenge.objectives[1].mine).toBe(techniqueAsk);
    expect(challenge.isComplete).toBe(true);
    expect(challenge.cleared).toBe(2);
  });

  it("adds the part-hours up before it rounds them", async () => {
    // 0.95h each reads as 0.9h on its own, but the guild has 1.9h, not 1.8h.
    logSessions("a", sessionsAsk, { technique: 0.95 });
    logSessions("b", sessionsAsk, { technique: 0.95 });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.objectives[1].mine).toBe(0.9);
    expect(challenge.objectives[1].progress).toBe(1.9);
  });

  it("pays nobody on the rank every guild starts on", async () => {
    logSessions("a", 9);

    const challenge = await readChallenge(
      "riff-raiders",
      { members: members("a") },
      "a",
      NOW,
    );

    expect(challenge.isComplete).toBe(true);
    expect(challenge.reward).toBe(0);
    expect(challenge.canClaim).toBe(false);
  });

  it("will not pay a member the guild carried", async () => {
    // The week is cleared, but every minute in it belongs to somebody else.
    logSessions("b", 2 * sessionsAsk, { technique: 2 * techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.isComplete).toBe(true);
    expect(challenge.myShareDone).toBe(false);
    expect(challenge.canClaim).toBe(false);
  });

  it("will not pay a member who logged the sessions but skipped the category", async () => {
    // The guild's totals are met — b covered the technique for both of them —
    // and a's own week is still a goal short.
    logSessions("a", sessionsAsk);
    logSessions("b", sessionsAsk, { technique: 2 * techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.isComplete).toBe(true);
    expect(challenge.objectives[0].mineComplete).toBe(true);
    expect(challenge.objectives[1].mineComplete).toBe(false);
    expect(challenge.myShareDone).toBe(false);
    expect(challenge.canClaim).toBe(false);
    expect(challenge.perMember.a).toMatchObject({ done: 1, total: 2 });
  });

  it("will not pay a member whose guild has not cleared the week", async () => {
    logSessions("a", sessionsAsk, { technique: techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.isComplete).toBe(false);
    expect(challenge.myShareDone).toBe(true);
    expect(challenge.canClaim).toBe(false);
  });

  it("pays a member who did their own share of a cleared week", async () => {
    logSessions("a", sessionsAsk, { technique: techniqueAsk });
    logSessions("b", sessionsAsk, { technique: techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo(),
      "a",
      NOW,
    );

    expect(challenge.isComplete).toBe(true);
    expect(challenge.canClaim).toBe(true);
    expect(challenge.claimed).toBe(false);
  });

  it("pays that member once, not once a page load", async () => {
    logSessions("a", sessionsAsk, { technique: techniqueAsk });
    logSessions("b", sessionsAsk, { technique: techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo({ challengeClaims: { a: THIS_WEEK } }),
      "a",
      NOW,
    );

    expect(challenge.claimed).toBe(true);
    expect(challenge.canClaim).toBe(false);
  });

  it("comes round again the week after the one already taken", async () => {
    logSessions("a", sessionsAsk, { technique: techniqueAsk });
    logSessions("b", sessionsAsk, { technique: techniqueAsk });

    const challenge = await readChallenge(
      "riff-raiders",
      onRankTwo({ challengeClaims: { a: LAST_WEEK } }),
      "a",
      NOW,
    );

    expect(challenge.claimed).toBe(false);
    expect(challenge.canClaim).toBe(true);
  });
});
