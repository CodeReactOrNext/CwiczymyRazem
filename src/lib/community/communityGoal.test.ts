import {
  COMMUNITY_GOAL_FAME_REWARD,
  GOAL_CANDIDATES,
} from "feature/communityGoal/data/goalCatalog";
import {
  previousWeekId,
  weekIdOf,
  weekStart,
} from "feature/communityGoal/utils/goalWeek";
import { SUPPORTER_WELCOME_TOKENS } from "feature/supporterPanel/constants/supporterPanel.constants";
import type { SupporterSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Firestore. The interesting part is the aggregate layer: progress is
 * *measured* from practice reports rather than stored, so the tests seed
 * reports and let the module count them, exactly as production does.
 */
const store = new Map<string, Record<string, any>>();

/** The slice of a practice report the goals are measured over. */
interface TimeSumary {
  sumTime: number;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
}

/** Practice reports as [ownerUid, reportDate, timeSumary]. */
let reports: Array<[string, Date, TimeSumary]> = [];

interface Ref {
  __path: string;
  id: string;
}

const ref = (path: string): Ref => ({
  __path: path,
  id: path.split("/").slice(1).join("/"),
});

const snapshot = (path: string) => ({
  id: ref(path).id,
  ref: ref(path),
  exists: store.has(path),
  data: () => store.get(path),
});

const applyPatch = (
  base: Record<string, any>,
  patch: Record<string, any>,
): Record<string, any> => {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    // Dotted paths are how the claim marks itself and pays the Fame.
    const segments = key.split(".");
    let target = next;
    while (segments.length > 1) {
      const segment = segments.shift()!;
      target[segment] = { ...(target[segment] ?? {}) };
      target = target[segment];
    }
    const leaf = segments[0];
    target[leaf] =
      value && typeof value === "object" && "__increment" in value
        ? (target[leaf] ?? 0) + value.__increment
        : value && typeof value === "object" && "__merge" in value
          ? { ...(target[leaf] ?? {}), ...value.__merge }
          : value;
  }
  return next;
};

const write = (target: Ref, value: Record<string, any>) =>
  store.set(target.__path, applyPatch(store.get(target.__path) ?? {}, value));

/** Reports inside [from, to) — the same window the module asks Firestore for. */
const reportsIn = (from: Date, to: Date, owner?: string) =>
  reports.filter(
    ([uid, when]) =>
      when >= from && when < to && (owner === undefined || uid === owner),
  );

/** Resolves "timeSumary.hearingTime" against a seeded report. */
const fieldValue = (row: TimeSumary, path: string): number =>
  Number(
    path
      .split(".")
      .reduce<any>(
        (value, segment) => (segment === "timeSumary" ? row : value?.[segment]),
        row,
      ),
  ) || 0;

const windowQuery = (owner?: string) => {
  let from = new Date(0);
  let to = new Date(8.64e15);

  const query = {
    where: (_field: string, op: string, value: Date) => {
      if (op === ">=") from = value;
      if (op === "<") to = value;
      return query;
    },
    limit: () => query,
    get: async () => {
      const rows = reportsIn(from, to, owner);
      return { empty: rows.length === 0, docs: rows.map(() => snapshot("x")) };
    },
    count: () => ({
      get: async () => ({
        data: () => ({ count: reportsIn(from, to, owner).length }),
      }),
    }),
    /**
     * Answers whatever the caller asked for, so the production split across two
     * queries (Firestore caps a query at five aggregations) is exercised as
     * written rather than assumed.
     */
    aggregate: (spec: Record<string, any>) => ({
      get: async () => {
        const rows = reportsIn(from, to, owner);
        return {
          data: () =>
            Object.fromEntries(
              Object.entries(spec).map(([key, aggregate]) => [
                key,
                aggregate.__count
                  ? rows.length
                  : rows.reduce(
                      (sum, [, , times]) =>
                        sum + fieldValue(times, aggregate.__sum),
                      0,
                    ),
              ]),
            ),
        };
      },
    }),
  };

  return query;
};

const collectionApi = (name: string) => ({
  doc: (id: string) => {
    const docRef = ref(`${name}/${id}`);
    return {
      ...docRef,
      get: async () => snapshot(docRef.__path),
      set: async (value: Record<string, any>) => write(docRef, value),
      update: async (patch: Record<string, any>) => write(docRef, patch),
      collection: (sub: string) =>
        sub === "exerciseData" ? windowQuery(docRef.id) : collectionApi(sub),
    };
  },
  /** Only ever asked for the supporter roster: users where isSupport == true. */
  where: (field: string, _op: string, value: unknown) => ({
    get: async () => ({
      docs: [...store.entries()]
        .filter(
          ([path, data]) =>
            path.startsWith(`${name}/`) && data?.[field] === value,
        )
        .map(([path]) => snapshot(path)),
    }),
  }),
});

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => collectionApi(name),
    collectionGroup: () => windowQuery(),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) =>
      fn({
        get: async (target: Ref) => snapshot(target.__path),
        set: (target: Ref, value: Record<string, any>) => write(target, value),
        update: (target: Ref, patch: Record<string, any>) =>
          write(target, patch),
      }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  AggregateField: {
    sum: (field: string) => ({ __sum: field }),
    count: () => ({ __count: true }),
  },
  FieldValue: {
    serverTimestamp: () => new Date("2026-08-28T00:00:00.000Z"),
    increment: (by: number) => ({ __increment: by }),
  },
}));

const {
  claimReward,
  ensureCurrentGoal,
  readState,
  resetProgressCache,
  voteOnBallot,
} = await import("./communityGoal");

const NOW = new Date("2026-08-28T12:00:00.000Z"); // a Friday
const WEEK = weekIdOf(NOW);
const LAST_WEEK = previousWeekId(NOW);
const HOUR_MS = 3_600_000;

const session = (
  overrides: Partial<SupporterSession> = {},
): SupporterSession => ({
  uid: "u1",
  supportTotal: 10,
  displayName: "Ola",
  avatar: null,
  isOwner: false,
  ...overrides,
});

/** A report's time split, defaulting everything into the untyped remainder. */
const times = (
  sumTime: number,
  categories: Partial<Omit<TimeSumary, "sumTime">> = {},
): TimeSumary => ({
  sumTime,
  techniqueTime: 0,
  theoryTime: 0,
  hearingTime: 0,
  creativityTime: 0,
  ...categories,
});

/** A report logged `dayOffset` days into the current week. */
const logReport = (
  uid: string,
  dayOffset: number,
  timeSumary: TimeSumary = times(HOUR_MS),
) =>
  reports.push([
    uid,
    new Date(weekStart(NOW).getTime() + dayOffset * 24 * 60 * 60 * 1000),
    timeSumary,
  ]);

/** A report logged `hoursBack` hours before this week began. */
const logLastWeek = (
  uid: string,
  hoursBack: number,
  timeSumary: TimeSumary = times(HOUR_MS),
) =>
  reports.push([
    uid,
    new Date(weekStart(NOW).getTime() - hoursBack * HOUR_MS),
    timeSumary,
  ]);

/** Puts the badge on a user, which is what lets their practice move the bar. */
const markSupporter = (uid: string, extra: Record<string, any> = {}) =>
  store.set(uid.startsWith("users/") ? uid : `users/${uid}`, {
    displayName: uid,
    isSupport: true,
    ...extra,
  });

const seedGoal = (target: number, metric = "sessions") =>
  store.set(`communityGoals/${WEEK}`, {
    candidateId: "sessions-push",
    metric,
    label: `Log ${target} practice sessions together`,
    icon: "sessions",
    target,
  });

/** What ran in the week before this one — the thing that sits the ballot out. */
const seedLastWeeksGoal = (candidateId: string) =>
  store.set(`communityGoals/${LAST_WEEK}`, { candidateId });

beforeEach(() => {
  store.clear();
  reports = [];
  markSupporter("u1", { supportTotal: 10, displayName: "Ola" });
  markSupporter("u2", { displayName: "Bartek" });
  // Progress and the roster are both memoised in production; each case seeds
  // different reports for the same window, so the memos have to go between them.
  resetProgressCache();
});

describe("ensureCurrentGoal", () => {
  it("counts only the sessions inside this week", async () => {
    seedGoal(10);
    logReport("u1", 0);
    logReport("u2", 3);
    // Last week and next week must not leak into the bar.
    reports.push([
      "u3",
      new Date(weekStart(NOW).getTime() - 1),
      times(HOUR_MS),
    ]);

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.progress).toBe(2);
    expect(goal.isComplete).toBe(false);
  });

  it("completes once the community reaches the target", async () => {
    seedGoal(2);
    logReport("u1", 0);
    logReport("u2", 1);

    expect((await ensureCurrentGoal(NOW)).isComplete).toBe(true);
  });

  it("counts supporters only — a plain player's practice does not move the bar", async () => {
    seedGoal(2);
    logReport("u1", 0);
    // No user document, so no badge: this player watches the run, they are not in it.
    logReport("u9", 1);
    logReport("u9", 2);

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.progress).toBe(1);
    expect(goal.isComplete).toBe(false);
  });

  it("sums hours across the roster before flooring them", async () => {
    // Half an hour each: floored per supporter this reads 0, floored once it reads 1.
    seedGoal(1, "minutes");
    logReport("u1", 0, times(1_800_000));
    logReport("u2", 1, times(1_800_000));

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.progress).toBe(1);
  });

  it("measures a category goal against that category's time alone", async () => {
    seedGoal(2, "hearing");
    // Three hours logged, only two of them ear training.
    logReport("u1", 0, times(2 * HOUR_MS, { hearingTime: HOUR_MS }));
    logReport("u2", 1, times(HOUR_MS, { hearingTime: HOUR_MS }));

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.progress).toBe(2);
    expect(goal.isComplete).toBe(true);
  });

  it("opens a goal from the ballot, targeting a stretch over last week", async () => {
    store.set(`communityGoalBallots/${WEEK}`, {
      tallies: { "technique-hours": 3, "hours-push": 1 },
    });
    // Ten hours of technique last week; the candidate stretches by 1.5.
    for (let i = 0; i < 10; i++) {
      logLastWeek("u2", i + 1, times(HOUR_MS, { techniqueTime: HOUR_MS }));
    }

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.candidateId).toBe("technique-hours");
    expect(goal.metric).toBe("technique");
    expect(goal.target).toBe(15); // ceil(10 × 1.5)
    expect(store.get(`communityGoals/${WEEK}`)?.baseline).toBe(10);
  });

  it("sizes a week with no history off the roster", async () => {
    store.set(`communityGoalBallots/${WEEK}`, {
      tallies: { "sessions-push": 2 },
    });

    const goal = await ensureCurrentGoal(NOW);

    // Two supporters at 5 sessions each is under the candidate's own floor.
    expect(goal.target).toBe(12);
    expect(store.get(`communityGoals/${WEEK}`)?.roster).toBe(2);
  });

  it("never lets the roster floor run away from what the roster actually does", async () => {
    store.set(`communityGoalBallots/${WEEK}`, {
      tallies: { "sessions-push": 2 },
    });
    // A big roster that logged four sessions between them: the roster-sized
    // floor must not become the target, or the week is lost before it starts.
    for (let i = 3; i <= 12; i++) markSupporter(`u${i}`);
    for (let i = 0; i < 4; i++) logLastWeek("u2", i + 1);

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.target).toBe(8); // ceil(4 × 1.8), not the roster's 60
  });

  it("drops the goal that ran last week off the ballot, even if it won the tally", async () => {
    seedLastWeeksGoal("sessions-push");
    store.set(`communityGoalBallots/${WEEK}`, {
      tallies: { "sessions-push": 9, "theory-hours": 1 },
    });

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.candidateId).toBe("theory-hours");
  });

  it("falls back to the default goal when nobody voted", async () => {
    const goal = await ensureCurrentGoal(NOW);

    expect(goal.candidateId).toBe("sessions-push");
    expect(goal.target).toBeGreaterThan(0);
  });

  it("falls back past the default when the default is the one sitting out", async () => {
    seedLastWeeksGoal("sessions-push");

    const goal = await ensureCurrentGoal(NOW);

    expect(goal.candidateId).not.toBe("sessions-push");
    expect(goal.target).toBeGreaterThan(0);
  });
});

describe("the reward", () => {
  beforeEach(() => {
    seedGoal(1);
    logReport("u1", 0);
  });

  it("pays a player who practised in the completed week", async () => {
    const result = await claimReward("u1", false, NOW);

    expect(result.ok).toBe(true);
    expect(store.get("users/u1")?.statistics?.fame).toBe(
      COMMUNITY_GOAL_FAME_REWARD,
    );
    expect(store.get("users/u1")?.communityGoalClaims?.[WEEK]).toBeTruthy();
  });

  it("pays once, however many times the button is pressed", async () => {
    await claimReward("u1", false, NOW);
    const second = await claimReward("u1", false, NOW);

    expect(second).toMatchObject({ ok: false, status: 409 });
    expect(store.get("users/u1")?.statistics?.fame).toBe(
      COMMUNITY_GOAL_FAME_REWARD,
    );
  });

  it("refuses a player who did not practise this week", async () => {
    store.set("users/u2", { displayName: "Nobody" });

    const result = await claimReward("u2", false, NOW);

    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(store.get("users/u2")?.statistics?.fame).toBeUndefined();
  });

  it("pays a plain player, who could not run it but was there", async () => {
    store.set("users/u9", { displayName: "Plain" });
    logReport("u9", 1);

    const result = await claimReward("u9", false, NOW);

    expect(result.ok).toBe(true);
    expect(store.get("users/u9")?.statistics?.fame).toBe(
      COMMUNITY_GOAL_FAME_REWARD,
    );
  });

  it("refuses while the goal is still short", async () => {
    seedGoal(999);

    const result = await claimReward("u1", false, NOW);

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(store.get("users/u1")?.statistics?.fame).toBeUndefined();
  });
});

describe("the ballot", () => {
  it("charges a token and puts it behind the option", async () => {
    seedGoal(10);

    const result = await voteOnBallot(session(), "hours-push", NOW);

    expect(result.ok).toBe(true);
    expect(store.get("users/u1")?.supporterTokens).toEqual({
      spent: 1,
      granted: 0,
    });
  });

  it("refuses an option that is not on the ballot", async () => {
    const result = await voteOnBallot(session(), "free-money", NOW);

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(store.get("users/u1")?.supporterTokens).toBeUndefined();
  });

  it("refuses the goal that is running, because it sits the next one out", async () => {
    seedGoal(10); // seeded as sessions-push

    const result = await voteOnBallot(session(), "sessions-push", NOW);

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(store.get("users/u1")?.supporterTokens).toBeUndefined();
  });

  it("refuses once the wallet is spent out", async () => {
    seedGoal(10);
    store.set("users/u1", {
      supportTotal: 0,
      isSupport: true,
      supporterTokens: { spent: SUPPORTER_WELCOME_TOKENS },
    });

    const result = await voteOnBallot(
      session({ supportTotal: 0 }),
      "hours-push",
      NOW,
    );

    expect(result).toMatchObject({ ok: false, status: 402 });
  });
});

describe("readState", () => {
  it("offers the reward only to a player who was there", async () => {
    seedGoal(1);
    logReport("u1", 0);

    const mine = await readState("u1", false, NOW);
    const theirs = await readState("u2", false, NOW);

    expect(mine.reward.claimable).toBe(true);
    expect(theirs.reward.claimable).toBe(false);
    expect(theirs.reward.missedTheWeek).toBe(true);
  });

  it("stops offering it once taken", async () => {
    seedGoal(1);
    logReport("u1", 0);
    await claimReward("u1", false, NOW);

    const state = await readState("u1", false, NOW);

    expect(state.reward.claimed).toBe(true);
    expect(state.reward.claimable).toBe(false);
  });

  it("leaves the running goal off next week's ballot", async () => {
    seedGoal(10); // sessions-push

    const state = await readState("u1", false, NOW);

    expect(state.ballot.satOut).toBe("sessions-push");
    expect(state.ballot.options).toHaveLength(GOAL_CANDIDATES.length - 1);
    expect(
      state.ballot.options.some(
        (option) => option.candidateId === "sessions-push",
      ),
    ).toBe(false);
  });

  it("prices every option with a real number rather than an ellipsis", async () => {
    seedGoal(10);
    // Six hours of ear training last week, so the option quotes ceil(6 × 1.5).
    for (let i = 0; i < 6; i++) {
      logLastWeek("u2", i + 1, times(HOUR_MS, { hearingTime: HOUR_MS }));
    }

    const state = await readState("u1", false, NOW);
    const hearing = state.ballot.options.find(
      (option) => option.candidateId === "hearing-hours",
    )!;

    expect(hearing.target).toBe(9);
    expect(hearing.label).toBe("Put in 9 hours of ear training together");
    expect(hearing.unit).toBe("hours of ear training");
    expect(state.ballot.options.every((option) => option.target > 0)).toBe(
      true,
    );
    expect(state.ballot.supporters).toBe(2);
  });

  it("prices off the running week once it has overtaken the last one", async () => {
    seedGoal(10);
    logLastWeek("u2", 1); // one session last week
    for (let i = 0; i < 8; i++) logReport("u1", 0); // eight already this week

    const state = await readState("u1", false, NOW);
    const hours = state.ballot.options.find(
      (option) => option.candidateId === "hours-push",
    )!;

    // The sessions option is the one that just ran, so depth is what shows the
    // effect: eight hours logged this week against one last week.
    expect(hours.target).toBe(Math.ceil(8 * 1.35)); // 11, not 2
  });
});
