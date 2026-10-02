import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A small in-memory Firestore: documents keyed by path, dotted-path updates,
 * merge sets, and the two FieldValues the settlement writes. Enough to watch
 * what a settlement pays — not a general fake.
 */
const store = new Map<string, Record<string, any>>();
let autoId = 0;

const ARRAY_UNION = Symbol("arrayUnion");

const setPath = (target: Record<string, any>, path: string, value: unknown) => {
  const keys = path.split(".");
  let node = target;
  for (const key of keys.slice(0, -1)) node = node[key] ??= {};
  const last = keys[keys.length - 1];
  if (value && typeof value === "object" && ARRAY_UNION in value) {
    const values = (value as Record<symbol, unknown[]>)[ARRAY_UNION];
    node[last] = [...new Set([...(node[last] ?? []), ...values])];
  } else {
    node[last] = value;
  }
};

const snapshot = (path: string) => ({
  exists: store.has(path),
  data: () => store.get(path),
});

const docsIn = (path: string) =>
  [...store.entries()]
    .filter(
      ([key]) =>
        key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"),
    )
    .map(([, data]) => data);

function collectionRef(path: string): any {
  const docRef = (docPath: string) => ({
    path: docPath,
    get: async () => snapshot(docPath),
    collection: (name: string) => collectionRef(`${docPath}/${name}`),
  });
  return {
    doc: (id?: string) => docRef(`${path}/${id ?? `auto-${++autoId}`}`),
    orderBy: (field: string) => ({
      limit: (n: number) => ({
        get: async () => ({
          docs: docsIn(path)
            .sort((a, b) => b[field] - a[field])
            .slice(0, n)
            .map((data) => ({ data: () => data })),
        }),
      }),
    }),
    count: () => ({
      get: async () => ({ data: () => ({ count: docsIn(path).length }) }),
    }),
  };
}

const write = (path: string, data: Record<string, any>, merge: boolean) => {
  const next = merge ? { ...(store.get(path) ?? {}) } : {};
  for (const [key, value] of Object.entries(data)) setPath(next, key, value);
  store.set(path, next);
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {
    collection: (name: string) => collectionRef(name),
    runTransaction: async (fn: (t: any) => Promise<unknown>) =>
      fn({
        get: async (ref: any) => snapshot(ref.path),
        set: (
          ref: any,
          data: Record<string, any>,
          options?: { merge?: boolean },
        ) => write(ref.path, data, !!options?.merge),
        update: (ref: any, data: Record<string, any>) =>
          write(ref.path, data, true),
      }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    arrayUnion: (...values: unknown[]) => ({ [ARRAY_UNION]: values }),
    serverTimestamp: () => "server-timestamp",
  },
}));

const { settleDailyBoard } = await import("./settleDailyBoard");
const { getDailyPrize } = await import("./dailyPrize");

const DAY = "2026-10-01";
const boardOf = (day: string) => `dailyExerciseLeaderboards/${day}`;
const BOARD = boardOf(DAY);

const addEntry = (userId: string, score: number, updatedAt = 1, day = DAY) =>
  store.set(`${boardOf(day)}/entries/${userId}`, {
    userId,
    displayName: userId,
    avatar: "",
    lvl: 1,
    score,
    accuracy: 95,
    updatedAt,
  });

const user = (uid: string) => store.get(`users/${uid}`)!;
const notifications = () =>
  [...store.entries()]
    .filter(([key]) => key.startsWith("notifications/"))
    .map(([, data]) => data);
/** Mods in the stash plus parts in the wallet — everything a prize can be. */
const prizesOf = (uid: string) =>
  (user(uid).arsenal?.salvagedMods?.length ?? 0) +
  (user(uid).arsenal?.parts ?? []).reduce((sum: number, p: { qty: number }) => sum + p.qty, 0);

/** The first day from October 2026 whose prize is of `kind`. */
const firstDayWith = (kind: "mod" | "part") => {
  for (let i = 0; i < 60; i++) {
    const day = new Date(Date.UTC(2026, 9, 1) + i * 86_400_000).toISOString().slice(0, 10);
    if (getDailyPrize(day).kind === kind) return day;
  }
  throw new Error(`no ${kind} day`);
};

describe("settleDailyBoard", () => {
  beforeEach(() => {
    store.clear();
    store.set(BOARD, { exerciseId: "ex_1" });
    for (const uid of ["cookie", "kafar", "apoth"])
      store.set(`users/${uid}`, { displayName: uid, arsenal: {} });
  });

  it("pays the #1 exactly one prize, and tells them", async () => {
    addEntry("cookie", 142_982);
    addEntry("kafar", 422_780);
    addEntry("apoth", 109_272);

    await settleDailyBoard(DAY);

    expect(prizesOf("kafar")).toBe(1);
    expect(prizesOf("cookie")).toBe(0);
    expect(prizesOf("apoth")).toBe(0);
    expect(store.get(BOARD)).toMatchObject({
      settled: true,
      winner: { userId: "kafar", prize: getDailyPrize(DAY) },
    });
    expect(notifications()).toEqual([
      expect.objectContaining({
        userId: "kafar",
        type: "daily_exercise_win",
        dayKey: DAY,
        isRead: false,
      }),
    ]);
  });

  it("puts a mod day's mod in the stash, exactly as the card showed it", async () => {
    const day = firstDayWith("mod");
    store.set(boardOf(day), { exerciseId: "ex_1" });
    addEntry("cookie", 300, 1, day);
    addEntry("kafar", 100, 1, day);

    await settleDailyBoard(day);

    const prize = getDailyPrize(day);
    if (prize.kind !== "mod") throw new Error("expected a mod day");
    expect(user("cookie").arsenal.salvagedMods).toEqual([
      expect.objectContaining({
        id: `daily:${day}:${prize.featureId}`,
        featureId: prize.featureId,
        kind: prize.modKind,
        points: prize.points,
      }),
    ]);
  });

  it("puts a part day's Legendary part in the parts wallet, stacking with what is there", async () => {
    const day = firstDayWith("part");
    const prize = getDailyPrize(day);
    if (prize.kind !== "part") throw new Error("expected a part day");
    store.set(boardOf(day), { exerciseId: "ex_1" });
    store.set("users/cookie", {
      displayName: "cookie",
      arsenal: { parts: [{ partId: prize.partId, tier: "Legendary", qty: 2 }] },
    });
    addEntry("cookie", 300, 1, day);
    addEntry("kafar", 100, 1, day);

    await settleDailyBoard(day);

    expect(user("cookie").arsenal.parts).toEqual([
      { partId: prize.partId, tier: "Legendary", qty: 3 },
    ]);
  });

  it("pays once, however many times the board is settled", async () => {
    addEntry("cookie", 200);
    addEntry("kafar", 100);

    await settleDailyBoard(DAY);
    await settleDailyBoard(DAY);

    expect(prizesOf("cookie")).toBe(1);
    expect(notifications()).toHaveLength(1);
  });

  it("gives a tie to whoever set the score first", async () => {
    addEntry("cookie", 500, 20);
    addEntry("kafar", 500, 10);

    await settleDailyBoard(DAY);

    expect(prizesOf("kafar")).toBe(1);
    expect(prizesOf("cookie")).toBe(0);
  });

  it("closes a board nobody else played without paying anyone", async () => {
    addEntry("cookie", 900);

    await settleDailyBoard(DAY);

    expect(prizesOf("cookie")).toBe(0);
    expect(store.get(BOARD)).toMatchObject({ settled: true, winner: null });
    expect(notifications()).toHaveLength(0);
  });

  it("leaves a day nobody played alone", async () => {
    store.delete(BOARD);

    await settleDailyBoard(DAY);

    expect(store.has(BOARD)).toBe(false);
    expect(notifications()).toHaveLength(0);
  });
});
