import {
  getRecordingContract,
  getRecordingTier,
  RECORDING_BANK_PAY,
  RECORDING_FULL_SHARE_TAKES,
  RECORDING_TAKES_PER_DAY,
  sessionBpm,
} from "feature/guilds/data/guildRecording";
import { drawClient } from "feature/guilds/utils/guildRecording.utils";
import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake Firestore: dotted field paths, increments, deletes, immediate transactions. */
const store = new Map<string, Record<string, any>>();

interface Ref {
  __path: string;
  id: string;
}

const ref = (path: string): Ref => ({ __path: path, id: path.split("/")[1] });

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
    if (value && typeof value === "object" && "__delete" in value)
      delete target[leaf];
    else if (value && typeof value === "object" && "__increment" in value)
      target[leaf] = (target[leaf] ?? 0) + value.__increment;
    else target[leaf] = value;
  }
  return next;
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => ({
      doc: (id: string) => {
        const docRef = ref(`${name}/${id}`);
        return { ...docRef, get: async () => snapshot(docRef.__path) };
      },
    }),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) =>
      fn({
        get: async (target: Ref) => snapshot(target.__path),
        update: (target: Ref, patch: Record<string, any>) =>
          store.set(
            target.__path,
            applyPatch(store.get(target.__path) ?? {}, patch),
          ),
      }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  AggregateField: { count: () => ({}), sum: () => ({}) },
  FieldValue: {
    increment: (by: number) => ({ __increment: by }),
    delete: () => ({ __delete: true }),
  },
}));

// The studio's weekly queries pull the quest module in; none of it is used here.
vi.mock("lib/guild/guildQuests", () => ({
  liveStreak: () => 0,
  REPORT_POINTS_FIELD: "totalPoints",
  REPORT_TIME_FIELDS: { time: "timeSumary.sumTime" },
}));

const {
  bookRecording,
  claimRecordingPay,
  deliverRecording,
  readGuildRecording,
  readTake,
  submitRecordingTake,
} = await import("./guildRecording");

const player = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

const guild = () => store.get("guilds/riff-raiders") ?? {};
const DAY = 86_400_000;
/** A seed that draws The Rust Buckets, whose parts the takes below name. */
const RUST = (() => {
  for (let seed = 1; seed < 5000; seed++)
    if (drawClient(seed).id === "rust-buckets") return seed;
  throw new Error("no seed draws the client");
})();
const TRACK_BPM = sessionBpm(getRecordingContract("rust-buckets")!, 1);
// Off the balance table, so a rebalance moves these with it.
const T1 = getRecordingTier(1);
const DAILY = RECORDING_TAKES_PER_DAY;
const NOW = new Date("2026-11-11T12:00:00Z");
const later = (days: number) => new Date(NOW.getTime() + days * DAY);

const seedGuild = (extra: Record<string, any> = {}) =>
  store.set("guilds/riff-raiders", {
    name: "Riff Raiders",
    founderUid: "ann",
    members: ["ann", "bob", "cat"].map((uid) => ({
      uid,
      displayName: uid,
      avatar: null,
    })),
    treasury: { fame: 10_000, spent: 0 },
    ...extra,
  });

// At the tempo a tier-one session of this client is cut at: full points.
const take = (partId: string, accuracy = 90, bpm = TRACK_BPM) => ({
  partId,
  accuracy,
  bpm,
  notes: 80,
});

/**
 * The open session with every tape most of the way there, as after days of
 * takes: a tape wants many of them, and the tests below only play the last few.
 */
const nearlyFull = () => {
  const { recording } = guild();
  store.set("guilds/riff-raiders", {
    ...guild(),
    recording: {
      ...recording,
      tape: Object.fromEntries(
        Object.entries(recording.targets as Record<string, number>).map(
          ([id, target]) => [id, target - 100],
        ),
      ),
    },
  });
};

beforeEach(() => {
  store.clear();
  for (const uid of ["ann", "bob", "cat"])
    store.set(`users/${uid}`, {
      displayName: uid,
      guildId: "riff-raiders",
      statistics: { fame: 100 },
    });
  store.set("users/loner", { displayName: "loner" });
  seedGuild();
});

describe("readGuildRecording", () => {
  it("shows a guild that never recorded the first tier open and nothing else", async () => {
    const result = await readGuildRecording(player("ann"), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.view.session).toBeNull();
    expect(result.view.bank).toBe(10_000);
    expect(result.view.tiers.map((c) => c.unlocked)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(result.view.tiers[0].fee).toBe(2_000);
  });

  it("refuses somebody with no guild", async () => {
    expect(await readGuildRecording(player("loner"), NOW)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("bookRecording", () => {
  it("takes the fee out of the treasury and opens the session", async () => {
    const result = await bookRecording(player("bob"), 1, NOW, RUST);
    expect(result.ok).toBe(true);
    expect(guild().treasury).toEqual({ fame: 8_000, spent: 2_000 });
    expect(guild().recording).toMatchObject({
      contractId: "rust-buckets",
      lap: 1,
      openedBy: "bob",
      fee: 2_000,
      tape: { riff: 0, bass: 0, hook: 0 },
    });
    if (result.ok)
      expect(result.view.session).toMatchObject({
        contractId: "rust-buckets",
        rating: "shelved",
        me: { takes: 0, takesLeft: DAILY },
      });
  });

  it("draws a different client for the next session on the same tier", async () => {
    await bookRecording(player("ann"), 1, NOW, RUST);
    await readGuildRecording(player("ann"), later(8));
    expect(guild().recordingLast.contractId).toBe("rust-buckets");
    // The very same seed again: whoever it draws, it is not the last client.
    await bookRecording(player("ann"), 1, later(8), RUST);
    expect(guild().recording.contractId).not.toBe("rust-buckets");
  });

  it("draws the session a seed of its own, and keeps the one it is given", async () => {
    await bookRecording(player("ann"), 1, NOW, 123_456);
    expect(guild().recording.seed).toBe(123_456);

    seedGuild();
    const first = await bookRecording(player("ann"), 1, NOW);
    const drawn = guild().recording.seed;
    expect(Number.isInteger(drawn)).toBe(true);
    if (first.ok) expect(first.view.session!.seed).toBe(drawn);

    seedGuild();
    await bookRecording(player("ann"), 1, NOW);
    expect(guild().recording.seed).not.toBe(drawn);
  });

  it("refuses a second session, a locked client and an empty treasury", async () => {
    await bookRecording(player("ann"), 1, NOW, RUST);
    expect(await bookRecording(player("ann"), 1, NOW, RUST)).toMatchObject({
      ok: false,
      status: 409,
    });

    seedGuild();
    expect(await bookRecording(player("ann"), 2, NOW)).toMatchObject({
      ok: false,
      status: 409,
    });
    expect(await bookRecording(player("ann"), 9, NOW)).toMatchObject({
      ok: false,
      status: 400,
    });
    // A tier is what is booked: a client's name is not one.
    expect(
      await bookRecording(player("ann"), "rust-buckets", NOW),
    ).toMatchObject({ ok: false, status: 400 });

    seedGuild({ treasury: { fame: 500 } });
    expect(await bookRecording(player("ann"), 1, NOW, RUST)).toMatchObject({
      ok: false,
      status: 402,
    });
    expect(guild().recording).toBeUndefined();
  });
});

describe("submitRecordingTake", () => {
  beforeEach(async () => {
    await bookRecording(player("ann"), 1, NOW, RUST);
  });

  it("lays a kept take on its part's tape and counts it against the day", async () => {
    const result = await submitRecordingTake(player("bob"), take("riff"), NOW);
    expect(result).toMatchObject({
      ok: true,
      take: { kept: true, points: 90, takesLeft: DAILY - 1 },
    });
    expect(guild().recording.tape.riff).toBe(90);
    expect(guild().recording.crew.bob).toMatchObject({ takes: 1, points: 90 });
    // What the client's mood and the list of last takes go by.
    expect(guild().recording.partTakes.riff).toEqual({
      takes: 1,
      accuracy: 90,
    });
    expect(guild().recording.log).toMatchObject([
      { uid: "bob", partId: "riff", accuracy: 90, points: 90 },
    ]);
    if (result.ok)
      expect(result.view.session).toMatchObject({
        takes: 1,
        accuracy: 90,
        mood: "grinning",
        recent: [{ displayName: "bob", partId: "riff" }],
      });
  });

  it("answers a scrapped take without using one up", async () => {
    const result = await submitRecordingTake(
      player("bob"),
      take("riff", 30),
      NOW,
    );
    expect(result).toMatchObject({
      ok: true,
      take: { kept: false, reason: "scrapped", takesLeft: DAILY },
    });
    expect(guild().recording.tape.riff).toBe(0);
  });

  it("stops at the day's takes and starts again the next day", async () => {
    for (let i = 0; i < DAILY; i++)
      await submitRecordingTake(player("bob"), take("riff"), NOW);
    const onTape = guild().recording.tape.riff;
    expect(
      await submitRecordingTake(player("bob"), take("riff"), NOW),
    ).toMatchObject({ take: { kept: false, reason: "no-takes" } });
    expect(guild().recording.tape.riff).toBe(onTape);
    expect(guild().recording.crew.bob.takes).toBe(DAILY);

    expect(
      await submitRecordingTake(player("bob"), take("hook"), later(1)),
    ).toMatchObject({ take: { kept: true, takesLeft: DAILY - 1 } });
  });

  it("clamps the tempo a take claims and refuses a part the track does not have", async () => {
    expect(
      await submitRecordingTake(player("bob"), take("riff", 100, 9_999), NOW),
    ).toMatchObject({ take: { points: 130 } });
    expect(
      await submitRecordingTake(player("bob"), take("spaceship"), NOW),
    ).toMatchObject({ ok: false, status: 400 });
  });

  it("gives more takes a day to a guild with a sofa", async () => {
    seedGuild({
      studio: { roomLevel: 3, items: { sofa: 3 } },
      recording: guild().recording,
    });
    const result = await submitRecordingTake(player("bob"), take("riff"), NOW);
    // One more a day than the bare room gives, one of them just used.
    expect(result).toMatchObject({ take: { takesLeft: DAILY } });
  });
});

describe("the end of a session", () => {
  beforeEach(async () => {
    await bookRecording(player("ann"), 1, NOW, RUST);
  });

  it("settles by itself once the week is up, on whoever looks next", async () => {
    nearlyFull();
    // Two clean takes a part, across three days so the day's limit is not hit.
    for (const [day, partId] of [
      [0, "riff"],
      [1, "bass"],
      [2, "hook"],
    ] as const) {
      await submitRecordingTake(player("ann"), take(partId, 100), later(day));
      await submitRecordingTake(player("bob"), take(partId, 100), later(day));
    }
    const result = await readGuildRecording(player("cat"), later(8));
    expect(guild().recording).toBeUndefined();
    expect(guild().recordings.t1).toMatchObject({
      best: "record",
      count: 1,
    });
    // What was left after the fee, plus the client's cheque — and a fifth on
    // top: every take was spotless, and a client that happy tips.
    expect(guild().recordingLast).toMatchObject({
      mood: "speechless",
      accuracy: 100,
    });
    const cheque = Math.round(T1.fee * RECORDING_BANK_PAY.record * 1.2);
    expect(guild().treasury.fame).toBe(10_000 - T1.fee + cheque);
    // Three takes each: paid, but only for the share of the work they did.
    const share = Math.round((T1.fame * 3) / RECORDING_FULL_SHARE_TAKES);
    expect(guild().recordingPay).toEqual({ ann: share, bob: share });
    if (result.ok) {
      expect(result.view.session).toBeNull();
      expect(result.view.last).toMatchObject({ rating: "record", pay: 0 });
      expect(result.view.tiers[1].unlocked).toBe(true);
    }
  });

  it("shelves a session nobody played, and leaves the next client locked", async () => {
    await readGuildRecording(player("ann"), later(8));
    expect(guild().recordings.t1).toMatchObject({
      best: "shelved",
      count: 0,
    });
    expect(guild().treasury.fame).toBe(8_000);
    const result = await readGuildRecording(player("ann"), later(8));
    if (result.ok) expect(result.view.tiers[1].unlocked).toBe(false);
  });

  it("turns away a take that comes after the week", async () => {
    const result = await submitRecordingTake(
      player("bob"),
      take("riff"),
      later(8),
    );
    expect(result).toMatchObject({
      ok: true,
      take: { kept: false, reason: "over" },
    });
    expect(guild().recording).toBeUndefined();
  });

  it("lets the booker hand a finished track over early, and nobody else", async () => {
    expect(await deliverRecording(player("ann"), NOW)).toMatchObject({
      ok: false,
      status: 403,
    });
    nearlyFull();
    for (const [day, partId] of [
      [0, "riff"],
      [1, "bass"],
      [2, "hook"],
    ] as const) {
      await submitRecordingTake(player("bob"), take(partId, 100), later(day));
      await submitRecordingTake(player("cat"), take(partId, 100), later(day));
    }
    expect(await deliverRecording(player("bob"), later(2))).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(await deliverRecording(player("ann"), later(2))).toMatchObject({
      ok: true,
    });
    expect(guild().recording).toBeUndefined();
    expect(guild().recordings.t1.best).toBe("record");
  });

  it("brings the client back with a new lap after a release", async () => {
    store.set("guilds/riff-raiders", {
      ...guild(),
      recording: undefined,
      recordings: { t1: { best: "gold", count: 1, at: 1 } },
    });
    await bookRecording(player("ann"), 1, NOW, RUST);
    expect(guild().recording.lap).toBe(2);
  });
});

describe("claimRecordingPay", () => {
  it("pays what is owed once and clears the tab", async () => {
    seedGuild({ recordingPay: { ann: 240, bob: 80 } });
    expect(await claimRecordingPay(player("ann"), NOW)).toMatchObject({
      ok: true,
      fame: 240,
    });
    expect(store.get("users/ann")!.statistics.fame).toBe(340);
    expect(guild().recordingPay).toEqual({ bob: 80 });
    expect(await claimRecordingPay(player("ann"), NOW)).toMatchObject({
      ok: false,
      status: 409,
    });
    expect(store.get("users/ann")!.statistics.fame).toBe(340);
  });
});

describe("readTake", () => {
  it("takes numbers and a part, and nothing else", () => {
    expect(
      readTake({ partId: "riff", accuracy: 90, bpm: 92, notes: 80 }),
    ).toEqual({ partId: "riff", accuracy: 90, bpm: 92, notes: 80 });
    expect(
      readTake({ partId: "riff", accuracy: "90", bpm: 92, notes: 80 }),
    ).toBeNull();
    expect(readTake({ accuracy: 90, bpm: 92, notes: 80 })).toBeNull();
    expect(
      readTake({ partId: "riff", accuracy: 90, bpm: 0, notes: 80 }),
    ).toBeNull();
    expect(
      readTake({ partId: "riff", accuracy: NaN, bpm: 92, notes: 80 }),
    ).toBeNull();
  });
});
