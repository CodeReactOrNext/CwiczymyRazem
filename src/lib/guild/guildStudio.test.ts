import {
  STUDIO_ITEM_COSTS,
  STUDIO_ROOM_COSTS,
} from "feature/guilds/data/guildStudio";
import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake Firestore: dotted field paths, increments, immediate transactions. */
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
    target[leaf] =
      value && typeof value === "object" && "__increment" in value
        ? (target[leaf] ?? 0) + value.__increment
        : value;
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
  FieldValue: { increment: (by: number) => ({ __increment: by }) },
}));

// The week's queries are not under test here; only what buying and reading
// the stored studio do.
vi.mock("lib/guild/guildQuests", () => ({
  liveStreak: () => 0,
  REPORT_POINTS_FIELD: "totalPoints",
  REPORT_TIME_FIELDS: { time: "timeSumary.sumTime" },
}));

const { buyStudioStep, readPurchase, readStudio, weekStartOf } =
  await import("./guildStudio");

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

const guild = () => store.get("guilds/riff-raiders") ?? {};

const seedGuild = (extra: Record<string, any> = {}) =>
  store.set("guilds/riff-raiders", {
    name: "Riff Raiders",
    founderUid: "ann",
    members: [{ uid: "ann", displayName: "ann", avatar: null }],
    ...extra,
  });

beforeEach(() => {
  store.clear();
  store.set("users/ann", { displayName: "ann", guildId: "riff-raiders" });
  store.set("users/bob", { displayName: "bob", guildId: "riff-raiders" });
});

describe("readStudio", () => {
  it("reads a guild that never bought anything as the empty garage", () => {
    expect(readStudio({})).toEqual({ roomLevel: 1, items: {} });
  });

  it("drops unknown pieces and anything above what the room allows", () => {
    expect(
      readStudio({
        studio: { roomLevel: 2, items: { amp: 4, drums: 1, spaceship: 3 } },
      }),
    ).toEqual({ roomLevel: 2, items: { amp: 2, drums: 1 } });
    expect(readStudio({ studio: { roomLevel: 99 } }).roomLevel).toBe(4);
  });
});

describe("weekStartOf", () => {
  it("is Monday midnight UTC, Mondays included", () => {
    expect(weekStartOf(new Date("2026-11-05T15:00:00Z")).toISOString()).toBe(
      "2026-11-02T00:00:00.000Z",
    );
    expect(weekStartOf(new Date("2026-11-02T00:00:00Z")).toISOString()).toBe(
      "2026-11-02T00:00:00.000Z",
    );
    expect(weekStartOf(new Date("2026-11-08T23:59:00Z")).toISOString()).toBe(
      "2026-11-02T00:00:00.000Z",
    );
  });
});

describe("readPurchase", () => {
  it("takes the room or a piece the catalog knows, and nothing else", () => {
    expect(readPurchase({ kind: "room" })).toEqual({ kind: "room" });
    expect(readPurchase({ kind: "item", id: "amp" })).toEqual({
      kind: "item",
      id: "amp",
    });
    expect(readPurchase({ kind: "item", id: "spaceship" })).toBeNull();
    expect(readPurchase({})).toBeNull();
  });
});

describe("buyStudioStep", () => {
  it("builds a piece out of the guild's Fame, whoever in the guild asks", async () => {
    seedGuild({ treasury: { fame: 500 } });

    expect(
      await buyStudioStep(session("bob"), { kind: "item", id: "amp" }),
    ).toEqual({ ok: true, paid: STUDIO_ITEM_COSTS[0], level: 1 });
    expect(guild().studio).toEqual({ roomLevel: 1, items: { amp: 1 } });
    expect(guild().treasury.fame).toBe(500 - STUDIO_ITEM_COSTS[0]);
    expect(guild().treasury.spent).toBe(STUDIO_ITEM_COSTS[0]);
  });

  it("leaves the deposits the quests count alone", async () => {
    seedGuild({ treasury: { fame: 500, deposits: { ann: 500 } } });
    await buyStudioStep(session("ann"), { kind: "item", id: "amp" });
    expect(guild().treasury.deposits).toEqual({ ann: 500 });
  });

  it("moves the room up a level", async () => {
    seedGuild({ treasury: { fame: STUDIO_ROOM_COSTS[0] } });
    expect(await buyStudioStep(session("ann"), { kind: "room" })).toEqual({
      ok: true,
      paid: STUDIO_ROOM_COSTS[0],
      level: 2,
    });
    expect(guild().studio.roomLevel).toBe(2);
    expect(guild().treasury.fame).toBe(0);
  });

  it("refuses when the guild cannot pay, and writes nothing", async () => {
    seedGuild({ treasury: { fame: STUDIO_ITEM_COSTS[0] - 1 } });
    expect(
      await buyStudioStep(session("ann"), { kind: "item", id: "amp" }),
    ).toMatchObject({ ok: false, status: 402 });
    expect(guild().studio).toBeUndefined();
  });

  it("refuses a step the room does not allow yet", async () => {
    seedGuild({
      treasury: { fame: 10_000 },
      studio: { roomLevel: 1, items: { amp: 1 } },
    });
    expect(
      await buyStudioStep(session("ann"), { kind: "item", id: "amp" }),
    ).toMatchObject({ ok: false, status: 409 });
    expect(guild().treasury.fame).toBe(10_000);
  });

  it("refuses somebody who is not in a guild", async () => {
    seedGuild({ treasury: { fame: 500 } });
    store.set("users/nomad", { displayName: "nomad" });
    expect(
      await buyStudioStep(session("nomad"), { kind: "room" }),
    ).toMatchObject({ ok: false, status: 400 });
  });
});
