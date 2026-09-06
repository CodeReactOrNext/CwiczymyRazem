import { honorForFame } from "feature/guilds/utils/guildHonor.utils";
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
  FieldValue: { increment: (by: number) => ({ __increment: by }) },
}));

const { depositFame } = await import("./guildTreasury");

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

const seedMember = (uid: string, fame: number) =>
  store.set(`users/${uid}`, {
    displayName: uid,
    guildId: "riff-raiders",
    statistics: { fame },
  });

const guild = () => store.get("guilds/riff-raiders") ?? {};
const fameOf = (uid: string): number =>
  store.get(`users/${uid}`)?.statistics?.fame ?? 0;

const seedGuild = (extra: Record<string, any> = {}) =>
  store.set("guilds/riff-raiders", {
    name: "Riff Raiders",
    founderUid: "ann",
    ...extra,
  });

beforeEach(() => {
  store.clear();
  seedMember("ann", 1000);
  seedMember("bob", 1000);
  seedGuild();
});

describe("depositFame", () => {
  it("moves Fame out of the member and into the guild", async () => {
    expect(await depositFame(session("bob"), 300)).toEqual({
      ok: true,
      paid: 300,
    });

    expect(guild().treasury.fame).toBe(300);
    expect(fameOf("bob")).toBe(700);
  });

  it("keeps the credit for who filled it, member by member", async () => {
    await depositFame(session("ann"), 200);
    await depositFame(session("bob"), 50);
    await depositFame(session("ann"), 100);

    expect(guild().treasury.fame).toBe(350);
    expect(guild().treasury.deposits).toEqual({ ann: 300, bob: 50 });
  });

  it("refuses more than the member holds, and writes nothing", async () => {
    const result = await depositFame(session("bob"), 1001);

    expect(result).toMatchObject({ ok: false, status: 402 });
    expect(guild().treasury).toBeUndefined();
    expect(fameOf("bob")).toBe(1000);
  });

  it("refuses an amount that is not an amount", async () => {
    for (const amount of [0, -50, "lots", null]) {
      expect(await depositFame(session("bob"), amount)).toMatchObject({
        ok: false,
        status: 400,
      });
    }

    expect(fameOf("bob")).toBe(1000);
  });

  it("refuses somebody who is not in a guild", async () => {
    store.set("users/nomad", {
      displayName: "nomad",
      statistics: { fame: 99 },
    });

    expect(await depositFame(session("nomad"), 10)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("credits honor for every Fame put in, at the rate", async () => {
    await depositFame(session("ann"), 250);

    expect(guild().honor.ann).toEqual({ earned: honorForFame(250) });
    // Nothing is written when the deposit is refused.
    await depositFame(session("bob"), 5_000);
    expect(guild().honor.bob).toBeUndefined();
  });
});
