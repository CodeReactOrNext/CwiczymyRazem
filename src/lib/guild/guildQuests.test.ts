import {
  GUILD_QUEST_CHAPTERS,
  questsOfChapter,
} from "feature/guilds/data/guildQuests";
import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Firestore with what this module needs: documents under dotted paths,
 * `where` filters with ==, >= and > on nested fields, count and sum
 * aggregations over them, plain reads of subcollections, and immediate
 * transactions with increments and array unions.
 */
const store = new Map<string, Record<string, any>>();

type Filter = [field: string, op: string, value: unknown];

const getPath = (data: Record<string, any>, path: string): unknown =>
  path.split(".").reduce<any>((node, key) => node?.[key], data);

const ordinal = (value: unknown): number | string =>
  value instanceof Date ? value.getTime() : (value as number | string);

const matches = (data: Record<string, any>, filters: Filter[]): boolean =>
  filters.every(([field, op, value]) => {
    const have = getPath(data, field);
    if (have === undefined || have === null) return false;
    const a = ordinal(have);
    const b = ordinal(value);
    if (op === "==") return a === b;
    if (op === ">=") return a >= b;
    if (op === ">") return a > b;
    throw new Error(`fake firestore: unsupported op ${op}`);
  });

/** Direct children of a collection path, as [id, data]. */
const docsIn = (prefix: string): Array<[string, Record<string, any>]> =>
  [...store.entries()]
    .filter(([path]) => {
      if (!path.startsWith(`${prefix}/`)) return false;
      return !path.slice(prefix.length + 1).includes("/");
    })
    .map(([path, data]) => [path.slice(prefix.length + 1), data]);

type Aggregation = { kind: "count" } | { kind: "sum"; field: string };

const query = (prefix: string, filters: Filter[] = []): any => ({
  where: (field: string, op: string, value: unknown) =>
    query(prefix, [...filters, [field, op, value]]),
  get: async () => ({
    docs: docsIn(prefix)
      .filter(([, data]) => matches(data, filters))
      .map(([id, data]) => ({ id, data: () => data })),
  }),
  aggregate: (spec: Record<string, Aggregation>) => ({
    get: async () => ({
      data: () => {
        const rows = docsIn(prefix).filter(([, data]) =>
          matches(data, filters),
        );
        return Object.fromEntries(
          Object.entries(spec).map(([alias, aggregation]) => [
            alias,
            aggregation.kind === "count"
              ? rows.length
              : rows.reduce(
                  (sum, [, data]) =>
                    sum + (Number(getPath(data, aggregation.field)) || 0),
                  0,
                ),
          ]),
        );
      },
    }),
  }),
});

interface Ref {
  __path: string;
  id: string;
}

const ref = (path: string): Ref => ({
  __path: path,
  id: path.split("/").pop()!,
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
    const segments = key.split(".");
    let target = next;
    while (segments.length > 1) {
      const segment = segments.shift()!;
      target[segment] = { ...(target[segment] ?? {}) };
      target = target[segment];
    }
    const leaf = segments[0];
    if (value && typeof value === "object" && "__increment" in value) {
      target[leaf] = (target[leaf] ?? 0) + value.__increment;
    } else if (value && typeof value === "object" && "__union" in value) {
      target[leaf] = [...new Set([...(target[leaf] ?? []), ...value.__union])];
    } else {
      target[leaf] = value;
    }
  }
  return next;
};

const write = (target: Ref, patch: Record<string, any>) =>
  store.set(target.__path, applyPatch(store.get(target.__path) ?? {}, patch));

const docApi = (path: string) => ({
  ...ref(path),
  get: async () => snapshot(path),
  update: async (patch: Record<string, any>) => write(ref(path), patch),
  collection: (name: string) => query(`${path}/${name}`),
});

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => ({
      ...query(name),
      doc: (id: string) => docApi(`${name}/${id}`),
    }),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) =>
      fn({
        get: async (target: Ref) => snapshot(target.__path),
        update: (target: Ref, patch: Record<string, any>) =>
          write(target, patch),
      }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    increment: (by: number) => ({ __increment: by }),
    arrayUnion: (...values: unknown[]) => ({ __union: values }),
  },
  AggregateField: {
    count: () => ({ kind: "count" }),
    sum: (field: string) => ({ kind: "sum", field }),
  },
}));

const syncGuildBadges = vi.fn(async (_guildId: string) => {});
vi.mock("lib/guild/guildBadge", () => ({
  syncGuildBadges: (guildId: string) => syncGuildBadges(guildId),
}));

const { claimQuestRewards, readQuestBoard, resetQuestCache } =
  await import("./guildQuests");

const HOUR = 3_600_000;
const FOUNDED = new Date("2026-01-01T00:00:00.000Z");
const NOW = new Date("2026-03-15T12:00:00.000Z");
const GUILD = "riff-raiders";

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

const members = (...uids: string[]) =>
  uids.map((uid) => ({ uid, displayName: uid, avatar: null }));

const seedGuild = (extra: Record<string, any> = {}) => {
  const data = {
    name: "Riff Raiders",
    founderUid: "ann",
    members: members("ann", "bob"),
    createdAt: { toDate: () => FOUNDED },
    ...extra,
  };
  store.set(`guilds/${GUILD}`, data);
  return data;
};

const seedMember = (uid: string, statistics: Record<string, any> = {}) =>
  store.set(`users/${uid}`, {
    displayName: uid,
    guildId: GUILD,
    statistics: { fame: 100, ...statistics },
  });

/**
 * Logs `count` reports for a member, each `hours` long, with the time filed
 * under one practice category, starting the day after the guild was founded.
 */
const logSessions = (
  uid: string,
  count: number,
  hours: number,
  category: "techniqueTime" | "theoryTime" | "hearingTime" | "creativityTime",
  options: { from?: Date; points?: number } = {},
) => {
  const from = options.from ?? new Date(FOUNDED.getTime() + 24 * HOUR);
  for (let i = 0; i < count; i++) {
    const at = new Date(from.getTime() + i * 2 * HOUR);
    store.set(`users/${uid}/exerciseData/${at.toISOString()}`, {
      reportDate: at,
      totalPoints: options.points ?? 0,
      timeSumary: { sumTime: hours * HOUR, [category]: hours * HOUR },
    });
  }
};

const guild = () => store.get(`guilds/${GUILD}`) ?? {};
const fameOf = (uid: string): number =>
  store.get(`users/${uid}`)?.statistics?.fame ?? 0;

const read = (uid = "ann") => readQuestBoard(GUILD, guild(), uid, NOW);

const firstChapterIds = questsOfChapter(0).map((quest) => quest.id);

beforeEach(() => {
  store.clear();
  resetQuestCache();
  syncGuildBadges.mockClear();
  seedMember("ann");
  seedMember("bob");
  seedGuild();
});

describe("readQuestBoard", () => {
  it("measures the first chapter and banks what is already cleared", async () => {
    seedMember("cid");
    seedGuild({ members: members("ann", "bob", "cid") });
    logSessions("ann", 60, 1, "techniqueTime");
    logSessions("bob", 50, 0.5, "theoryTime");
    logSessions("cid", 5, 0.5, "hearingTime");

    const board = await read();

    expect(board.level).toBe(4);
    expect(board.chapter).toMatchObject({ index: 0, name: "Warm-up" });
    expect(board.active).toHaveLength(5);

    const byId = Object.fromEntries(
      board.active.map((quest) => [quest.id, quest]),
    );
    expect(byId["sessions-100"]).toMatchObject({
      progress: 115,
      target: 100,
      isComplete: true,
      mine: 60,
    });
    expect(byId["hours-50"]).toMatchObject({ progress: 87.5, mine: 60 });
    expect(byId["technique-10"]).toMatchObject({ progress: 60, mine: 60 });
    expect(byId["members-sessions-5-x3"]).toMatchObject({
      progress: 3,
      target: 3,
      isComplete: true,
      each: { mine: 60, target: 5, done: true },
    });
    expect(byId["treasury-300"]).toMatchObject({
      progress: 0,
      target: 300,
      isComplete: false,
      mine: 0,
      doneAt: null,
    });

    // Banked on the document with the roster frozen beside each.
    expect(Object.keys(guild().quests).sort()).toEqual(
      [
        "members-sessions-5-x3",
        "hours-50",
        "sessions-100",
        "technique-10",
      ].sort(),
    );
    expect(guild().quests["sessions-100"]).toEqual({
      at: NOW.toISOString(),
      roster: ["ann", "bob", "cid"],
    });
    expect(byId["sessions-100"].doneAt).toBe(NOW.toISOString());

    // The level rides on every member's badge.
    expect(syncGuildBadges).toHaveBeenCalledTimes(1);
    expect(syncGuildBadges).toHaveBeenCalledWith(GUILD);
  });

  it("counts nothing from before the guild was founded", async () => {
    logSessions("ann", 200, 1, "techniqueTime", {
      from: new Date("2025-06-01T00:00:00.000Z"),
    });

    const board = await read();

    expect(board.level).toBe(0);
    expect(board.active.find((q) => q.id === "sessions-100")).toMatchObject({
      progress: 0,
      isComplete: false,
    });
    expect(guild().quests).toBeUndefined();
    expect(syncGuildBadges).not.toHaveBeenCalled();
  });

  it("opens the next chapter in the same read once all five are cleared", async () => {
    seedMember("cid");
    logSessions("ann", 60, 1, "techniqueTime");
    logSessions("bob", 50, 0.5, "theoryTime");
    logSessions("cid", 5, 0.5, "hearingTime");
    seedGuild({
      members: members("ann", "bob", "cid"),
      treasury: { fame: 300, deposits: { ann: 200, bob: 100 } },
    });

    const board = await read();

    // Five from the first chapter, and Bob's 25h of theory already clears one
    // of the second's — measured in the same read, not the next one.
    expect(board.level).toBe(6);
    expect(board.chapter).toMatchObject({ index: 1, name: "Rehearsal" });
    expect(board.active.map((quest) => quest.id)).toEqual(
      questsOfChapter(1).map((quest) => quest.id),
    );
    expect(board.active.find((q) => q.id === "sessions-250")).toMatchObject({
      progress: 115,
      target: 250,
      isComplete: false,
      doneAt: null,
    });
    expect(board.active.find((q) => q.id === "theory-25")).toMatchObject({
      progress: 25,
      isComplete: true,
      doneAt: NOW.toISOString(),
    });
    expect(board.done.map((quest) => quest.id).sort()).toEqual(
      [...firstChapterIds, "theory-25"].sort(),
    );
    // Two writes, one re-stamp of the roster.
    expect(syncGuildBadges).toHaveBeenCalledTimes(1);
  });

  it("tells a member where they stand on a quest that counts members", async () => {
    logSessions("ann", 10, 1, "techniqueTime");
    logSessions("bob", 3, 1, "hearingTime");

    const board = await read("bob");
    const each = board.active.find((q) => q.id === "members-sessions-5-x3");

    // The target is the catalog's three, not the two on the roster: a guild
    // this small recruits its way there rather than being handed it.
    expect(each).toMatchObject({
      progress: 1,
      target: 3,
      isComplete: false,
      each: { ask: "5 sessions", mine: 3, target: 5, done: false },
    });
  });

  it("is not held shut by a member who never plays", async () => {
    seedMember("cid");
    seedMember("dee");
    seedGuild({ members: members("ann", "bob", "cid", "dee") });
    logSessions("ann", 6, 1, "techniqueTime");
    logSessions("bob", 6, 1, "techniqueTime");
    logSessions("cid", 6, 1, "techniqueTime");

    const board = await read("dee");
    const regulars = board.active.find((q) => q.id === "members-sessions-5-x3");

    expect(regulars).toMatchObject({
      progress: 3,
      target: 3,
      isComplete: true,
      each: { mine: 0, done: false },
    });
  });

  it("counts a streak only while it is alive", async () => {
    seedGuild({
      members: members("ann", "bob", "cid", "dee"),
      quests: Object.fromEntries(
        firstChapterIds.map((id) => [id, { at: "2026-02-01", roster: [] }]),
      ),
    });
    seedMember("ann", { streakDays: 12, lastPracticeLocalDay: "2026-03-15" });
    seedMember("bob", { streakDays: 9, lastPracticeLocalDay: "2026-03-14" });
    // Stopped a week ago: the stored number is stale.
    seedMember("cid", { streakDays: 40, lastPracticeLocalDay: "2026-03-07" });
    // Older account with only the counter.
    seedMember("dee", { actualDayWithoutBreak: 7 });

    const board = await read("cid");
    const streak = board.active.find((q) => q.id === "streak-7-x3");

    expect(streak).toMatchObject({
      progress: 3,
      target: 3,
      isComplete: true,
      each: { mine: 0, target: 7, done: false },
    });
  });

  it("hands the roster every member's sessions and hours since founding", async () => {
    logSessions("ann", 4, 1.5, "creativityTime");

    const board = await read();

    expect(board.perMember).toEqual({
      ann: { sessions: 4, hours: 6 },
      bob: { sessions: 0, hours: 0 },
    });
    expect(board.since).toBe(FOUNDED.toISOString());
  });

  it("says what the caller can take, and only for quests they were there for", async () => {
    seedGuild({
      quests: {
        "sessions-100": { at: "2026-02-01", roster: ["ann"] },
        "hours-50": { at: "2026-02-02", roster: ["ann", "bob"] },
      },
      questClaims: { ann: ["hours-50"] },
    });
    const reward = GUILD_QUEST_CHAPTERS[0].reward;

    expect((await read("ann")).claimable).toEqual({
      fame: reward,
      quests: 1,
    });
    expect((await read("bob")).claimable).toEqual({
      fame: reward,
      quests: 1,
    });
  });

  it("opens a second lap, doubled, once every quest is behind the guild", async () => {
    const firstLap = [...Array(10).keys()].flatMap((chapter) =>
      questsOfChapter(chapter),
    );
    seedGuild({
      quests: Object.fromEntries(
        firstLap.map((quest) => [
          quest.id,
          { at: "2026-02-01", roster: ["ann"] },
        ]),
      ),
      // Ann has taken all fifty already, so what is claimable below is only
      // what the second lap adds.
      questClaims: { ann: firstLap.map((quest) => quest.id) },
    });
    // Enough sessions for the doubled First Hundred, spread thin enough that
    // nothing else on the doubled first chapter clears with it.
    logSessions("ann", 210, 0.1, "hearingTime");

    const board = await read();

    expect(board.level).toBe(51);
    expect(board.lap).toBe(2);
    expect(board.lapCleared).toBe(1);
    expect(board.chapter).toMatchObject({
      index: 0,
      name: "Warm-up",
      reward: GUILD_QUEST_CHAPTERS[0].reward * 2,
    });

    const first = board.active.find((q) => q.id === "sessions-100@2");
    expect(first).toMatchObject({
      questId: "sessions-100",
      lap: 2,
      name: "First Hundred II",
      target: 200,
      progress: 210,
      isComplete: true,
      reward: GUILD_QUEST_CHAPTERS[0].reward * 2,
      doneAt: NOW.toISOString(),
    });
    expect(board.active.find((q) => q.id === "hours-50@2")).toMatchObject({
      target: 100,
      isComplete: false,
    });

    // Banked under the lap's key, with the roster of today.
    expect(guild().quests["sessions-100@2"]).toEqual({
      at: NOW.toISOString(),
      roster: ["ann", "bob"],
    });
    expect(board.claimable).toEqual({
      fame: GUILD_QUEST_CHAPTERS[0].reward * 2,
      quests: 1,
    });
  });
});

describe("claimQuestRewards", () => {
  const reward = GUILD_QUEST_CHAPTERS[0].reward;

  beforeEach(() => {
    seedGuild({
      quests: {
        "sessions-100": { at: "2026-02-01", roster: ["ann"] },
        "hours-50": { at: "2026-02-02", roster: ["ann", "bob"] },
      },
    });
  });

  it("pays everything waiting in one go, and remembers it", async () => {
    const result = await claimQuestRewards(session("ann"));

    expect(result).toEqual({ ok: true, fame: 2 * reward, quests: 2 });
    expect(fameOf("ann")).toBe(100 + 2 * reward);
    expect(guild().questClaims.ann.sort()).toEqual([
      "hours-50",
      "sessions-100",
    ]);
  });

  it("pays only for the quests the member was on the roster for", async () => {
    const result = await claimQuestRewards(session("bob"));

    expect(result).toEqual({ ok: true, fame: reward, quests: 1 });
    expect(fameOf("bob")).toBe(100 + reward);
    expect(guild().questClaims.bob).toEqual(["hours-50"]);
  });

  it("refuses a second claim, and pays nothing", async () => {
    await claimQuestRewards(session("ann"));

    expect(await claimQuestRewards(session("ann"))).toMatchObject({
      ok: false,
      status: 409,
    });
    expect(fameOf("ann")).toBe(100 + 2 * reward);
  });

  it("refuses somebody who is not in a guild", async () => {
    store.set("users/cid", { displayName: "cid", statistics: { fame: 0 } });

    expect(await claimQuestRewards(session("cid"))).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
