import { findCosmetic } from "feature/guilds/data/guildCosmetics";
import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake Firestore: document refs, immediate transactions, and a real batch. */
const store = new Map<string, Record<string, any>>();

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

const DELETE = { __delete: true };

/**
 * A dotted key in `update()` is a *field path* — `statistics.fame` writes the
 * nested number rather than a key with a full stop in its name. Nothing here
 * spends through one any more, but the badge re-stamp can clear a field, so the
 * fake still walks the path and honours a delete sentinel.
 */
const setPath = (target: Record<string, any>, path: string, value: unknown) => {
  const keys = path.split(".");
  const leaf = keys.pop()!;
  let cursor = target;

  for (const key of keys) {
    cursor[key] = { ...(cursor[key] ?? {}) };
    cursor = cursor[key];
  }

  if (value && typeof value === "object" && "__delete" in (value as object)) {
    delete cursor[leaf];
  } else {
    cursor[leaf] = value;
  }
};

const applyPatch = (
  base: Record<string, any>,
  patch: Record<string, any>,
): Record<string, any> => {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) setPath(next, key, value);
  return next;
};

const write = (target: Ref, value: Record<string, any>) =>
  store.set(target.__path, applyPatch(store.get(target.__path) ?? {}, value));

const collectionApi = (name: string) => ({
  doc: (id: string) => {
    const docRef = ref(`${name}/${id}`);
    return { ...docRef, get: async () => snapshot(docRef.__path) };
  },
});

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => collectionApi(name),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) =>
      fn({
        get: async (target: Ref) => snapshot(target.__path),
        set: (target: Ref, value: Record<string, any>) =>
          store.set(target.__path, value),
        update: (target: Ref, patch: Record<string, any>) =>
          write(target, patch),
        delete: (target: Ref) => store.delete(target.__path),
      }),
    // The roster re-stamp writes through a batch rather than the transaction —
    // see `guildBadge.ts` for why — so the fake has to know about one.
    batch: () => {
      const queued: [Ref, Record<string, any>][] = [];
      return {
        update: (target: Ref, patch: Record<string, any>) =>
          queued.push([target, patch]),
        commit: async () =>
          queued.forEach(([target, patch]) => write(target, patch)),
      };
    },
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => new Date("2026-08-28T00:00:00.000Z"),
    delete: () => DELETE,
  },
}));

const { equipCosmetic } = await import("./guildCosmetics");

const EMBER = findCosmetic("accent:ember")!;
const COBALT = findCosmetic("accent:cobalt")!;
const HALO = findCosmetic("banner:halo")!;

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: `${uid} the player`,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

const seedPlayer = (uid: string, fame: number, guildId?: string) =>
  store.set(`users/${uid}`, {
    displayName: uid,
    statistics: { fame },
    ...(guildId ? { guildId } : {}),
  });

const seedGuild = (extra: Record<string, any> = {}) =>
  store.set("guilds/riff-raiders", {
    name: "Riff Raiders",
    tag: "RIF",
    founderUid: "founder",
    members: [
      { uid: "founder", displayName: "founder", avatar: null },
      { uid: "member", displayName: "member", avatar: null },
    ],
    ...extra,
  });

const guild = () => store.get("guilds/riff-raiders") ?? {};
const fameOf = (uid: string): number =>
  store.get(`users/${uid}`)?.statistics?.fame ?? 0;
const badgeOf = (uid: string) => store.get(`users/${uid}`)?.guildBadge;

beforeEach(() => {
  store.clear();
  seedPlayer("founder", 5_000, "riff-raiders");
  seedPlayer("member", 5_000, "riff-raiders");
  seedPlayer("stranger", 5_000);
  seedGuild();
});

describe("equipCosmetic", () => {
  it("puts on anything in the catalog and charges nothing for it", async () => {
    expect(await equipCosmetic(session("founder"), HALO.id)).toEqual({
      ok: true,
    });

    expect(guild().cosmetics.banner).toBe(HALO.id);
    expect(fameOf("founder")).toBe(5_000);
  });

  it("changes one slot and leaves the others as they were", async () => {
    await equipCosmetic(session("founder"), EMBER.id);
    await equipCosmetic(session("founder"), HALO.id);

    expect(guild().cosmetics).toEqual({
      accent: EMBER.id,
      banner: HALO.id,
      frame: "frame:plain",
    });
  });

  it("re-stamps the badge on every member, founder or not", async () => {
    await equipCosmetic(session("founder"), EMBER.id);

    for (const uid of ["founder", "member"]) {
      expect(badgeOf(uid)).toEqual({
        guildId: "riff-raiders",
        tag: "RIF",
        accent: EMBER.id,
        frame: "frame:plain",
      });
    }
  });

  it("refuses a member who did not found the guild", async () => {
    // Free is not the same as everybody's: two people with different taste
    // would otherwise flip the guild's colour all afternoon for nothing.
    expect(await equipCosmetic(session("member"), EMBER.id)).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(guild().cosmetics).toBeUndefined();
  });

  it("drops what the paid-for kit used to write, on the next change", async () => {
    seedGuild({
      cosmetics: {
        accent: COBALT.id,
        banner: "banner:none",
        frame: "frame:plain",
        unlocked: [COBALT.id],
        funders: { [COBALT.id]: { uid: "member", fame: 300 } },
      },
    });

    await equipCosmetic(session("founder"), EMBER.id);

    expect(guild().cosmetics).toEqual({
      accent: EMBER.id,
      banner: "banner:none",
      frame: "frame:plain",
    });
  });

  it("refuses an id the catalog has never heard of", async () => {
    expect(
      await equipCosmetic(session("founder"), "accent:gold"),
    ).toMatchObject({ ok: false, status: 400 });
    expect(guild().cosmetics).toBeUndefined();
  });

  it("refuses what is already on, so a no-op is not a write", async () => {
    await equipCosmetic(session("founder"), COBALT.id);

    expect(await equipCosmetic(session("founder"), COBALT.id)).toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it("refuses somebody who is not in a guild at all", async () => {
    expect(await equipCosmetic(session("stranger"), EMBER.id)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("goes back to the item every guild starts in", async () => {
    await equipCosmetic(session("founder"), COBALT.id);

    expect(await equipCosmetic(session("founder"), "accent:steel")).toEqual({
      ok: true,
    });
    expect(guild().cosmetics.accent).toBe("accent:steel");
  });
});
