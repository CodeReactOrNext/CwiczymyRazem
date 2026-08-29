import {
  GUILD_BASE_SEATS,
  GUILD_FOUNDING_COST,
  GUILD_SEAT_COST_STEP,
  GUILD_SEAT_UPGRADE_COST,
  GUILD_SEATS_PER_UPGRADE,
  GUILD_STASH_BASE_ROWS,
  GUILD_STASH_ROWS_PER_UPGRADE,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake Firestore: document refs, one collection read, immediate transactions. */
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

const applyPatch = (
  base: Record<string, any>,
  patch: Record<string, any>,
): Record<string, any> => {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && "__delete" in value) {
      delete next[key];
    } else if (value && typeof value === "object" && "__increment" in value) {
      next[key] = (next[key] ?? 0) + value.__increment;
    } else {
      next[key] = value;
    }
  }
  return next;
};

const write = (target: Ref, value: Record<string, any>) =>
  store.set(target.__path, applyPatch(store.get(target.__path) ?? {}, value));

const collectionApi = (name: string) => ({
  doc: (id: string) => {
    const docRef = ref(`${name}/${id}`);
    return { ...docRef, get: async () => snapshot(docRef.__path) };
  },
  limit: () => ({
    get: async () => ({
      docs: [...store.keys()]
        .filter((path) => path.startsWith(`${name}/`))
        .map((path) => snapshot(path)),
    }),
  }),
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
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => new Date("2026-08-28T00:00:00.000Z"),
    increment: (by: number) => ({ __increment: by }),
    delete: () => DELETE,
  },
}));

const { foundGuild, joinGuild, leaveGuild, readGuilds } =
  await import("./guilds");

const session = (
  uid: string,
  overrides: Partial<PlayerSession> = {},
): PlayerSession => ({
  uid,
  supportTotal: 100,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: true,
  ...overrides,
});

const seedPlayer = (uid: string, extra: Record<string, any> = {}) =>
  store.set(`users/${uid}`, { displayName: uid, supportTotal: 100, ...extra });

const spentBy = (uid: string): number =>
  store.get(`users/${uid}`)?.supporterTokens?.spent ?? 0;

beforeEach(() => {
  store.clear();
  seedPlayer("founder");
  seedPlayer("player");
});

const found = (uid = "founder", name = "Riff Raiders", tag = "RIF") =>
  foundGuild(session(uid), { name, tag, description: "we practise loud" });

describe("foundGuild", () => {
  it("claims the name, the tag and the founder's seat in one go", async () => {
    expect(await found()).toEqual({ ok: true });

    expect(store.get("guilds/riff-raiders")).toMatchObject({
      name: "Riff Raiders",
      tag: "RIF",
      founderUid: "founder",
    });
    expect(store.get("guildTags/RIF")).toMatchObject({
      guildId: "riff-raiders",
    });
    expect(store.get("users/founder")?.guildId).toBe("riff-raiders");
    expect(spentBy("founder")).toBe(GUILD_FOUNDING_COST);
  });

  it("refuses a name already taken, and charges nothing for the attempt", async () => {
    await found();

    const result = await found("player", "  riff   RAIDERS  ", "OTH");

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(spentBy("player")).toBe(0);
    expect(store.get("users/player")?.guildId).toBeUndefined();
  });

  it("refuses a tag already taken", async () => {
    await found();

    const result = await found("player", "Other Name", "rif");

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(store.get("guilds/other-name")).toBeUndefined();
    expect(spentBy("player")).toBe(0);
  });

  it("refuses a founder who is already in a guild", async () => {
    await found();

    const result = await found("founder", "Second Band", "SEC");

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(store.get("guilds/second-band")).toBeUndefined();
  });

  it("refuses when the wallet cannot cover it", async () => {
    store.set("users/player", {
      displayName: "player",
      supportTotal: 0,
      isSupport: true,
      supporterTokens: { spent: 99, granted: 0 },
    });

    const result = await found("player", "Broke Crew", "BRK");

    expect(result).toMatchObject({ ok: false, status: 402 });
    expect(store.get("guilds/broke-crew")).toBeUndefined();
    // Nothing was claimed on the way to failing.
    expect(store.get("guildTags/BRK")).toBeUndefined();
  });

  it("keeps a crest that came out of our own bucket", async () => {
    const logo = `https://firebasestorage.googleapis.com/v0/b/${
      process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET ?? "test-bucket"
    }/o/guildLogos%2Fabc?alt=media&token=1`;

    expect(
      await foundGuild(session("founder"), {
        name: "Riff Raiders",
        tag: "RIF",
        description: "",
        logo,
      }),
    ).toEqual({ ok: true });

    expect(store.get("guilds/riff-raiders")?.logo).toBe(logo);
  });

  it("refuses a picture hosted anywhere else, and charges nothing", async () => {
    const result = await foundGuild(session("founder"), {
      name: "Riff Raiders",
      tag: "RIF",
      description: "",
      logo: "https://example.com/crest.png",
    });

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(store.get("guilds/riff-raiders")).toBeUndefined();
    expect(spentBy("founder")).toBe(0);
  });

  it("founds without one — the picture is optional", async () => {
    expect(await found()).toEqual({ ok: true });
    expect(store.get("guilds/riff-raiders")?.logo).toBeNull();
  });

  it("rejects a name that is not a name before touching the wallet", async () => {
    const result = await found("player", "!!!", "AAA");

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(spentBy("player")).toBe(0);
  });
});

describe("joinGuild", () => {
  beforeEach(async () => {
    await found();
  });

  it("seats a player and points them at the guild", async () => {
    expect(await joinGuild(session("player"), "riff-raiders")).toEqual({
      ok: true,
    });

    const members = store.get("guilds/riff-raiders")?.members ?? [];
    expect(members.map((m: any) => m.uid)).toEqual(["founder", "player"]);
    expect(store.get("users/player")?.guildId).toBe("riff-raiders");
  });

  it("is free — joining never touches the wallet", async () => {
    await joinGuild(session("player"), "riff-raiders");

    expect(spentBy("player")).toBe(0);
  });

  it("refuses somebody already in a guild", async () => {
    await joinGuild(session("player"), "riff-raiders");

    // A founder needs a wallet of their own, or there is no second guild to
    // refuse them entry to.
    seedPlayer("other");
    await foundGuild(session("other"), { name: "Second Band", tag: "SEC" });

    const result = await joinGuild(session("player"), "second-band");
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(store.get("users/player")?.guildId).toBe("riff-raiders");
  });

  it("does not seat the same person twice", async () => {
    await joinGuild(session("player"), "riff-raiders");
    // The pointer now blocks a second attempt, and the roster stays as it was.
    await joinGuild(session("player"), "riff-raiders");

    expect(store.get("guilds/riff-raiders")?.members).toHaveLength(2);
  });

  it("refuses once every seat is taken", async () => {
    // Fill the room the founder is already sitting in.
    const roster = Array.from({ length: GUILD_BASE_SEATS }, (_, index) => ({
      uid: `seated-${index}`,
      displayName: `seated-${index}`,
      avatar: null,
    }));
    store.set("guilds/riff-raiders", {
      ...store.get("guilds/riff-raiders"),
      members: roster,
    });

    const result = await joinGuild(session("player"), "riff-raiders");

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(store.get("users/player")?.guildId).toBeUndefined();
  });

  it("takes them once the guild has bought the room", async () => {
    const roster = Array.from({ length: GUILD_BASE_SEATS }, (_, index) => ({
      uid: `seated-${index}`,
      displayName: `seated-${index}`,
      avatar: null,
    }));
    store.set("guilds/riff-raiders", {
      ...store.get("guilds/riff-raiders"),
      members: roster,
      seatUpgrades: 1,
    });

    expect(await joinGuild(session("player"), "riff-raiders")).toEqual({
      ok: true,
    });
  });

  it("404s on a guild that is gone", async () => {
    expect(await joinGuild(session("player"), "ghosts")).toMatchObject({
      ok: false,
      status: 404,
    });
  });
});

describe("leaveGuild", () => {
  beforeEach(async () => {
    await found();
  });

  it("takes a member off the roster and frees them to join elsewhere", async () => {
    await joinGuild(session("player"), "riff-raiders");

    expect(await leaveGuild(session("player"))).toEqual({ ok: true });
    expect(store.get("guilds/riff-raiders")?.members).toHaveLength(1);
    expect(store.get("users/player")?.guildId).toBeUndefined();
  });

  it("will not let the founder walk out on people", async () => {
    await joinGuild(session("player"), "riff-raiders");

    expect(await leaveGuild(session("founder"))).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(store.get("guilds/riff-raiders")).toBeDefined();
  });

  it("disbands the guild when the founder is the last one out", async () => {
    expect(await leaveGuild(session("founder"))).toEqual({ ok: true });

    expect(store.get("guilds/riff-raiders")).toBeUndefined();
    // The tag goes back into circulation with the name.
    expect(store.get("guildTags/RIF")).toBeUndefined();
    expect(store.get("users/founder")?.guildId).toBeUndefined();
  });

  it("clears a pointer left behind by a guild that vanished", async () => {
    store.delete("guilds/riff-raiders");

    expect(await leaveGuild(session("founder"))).toEqual({ ok: true });
    expect(store.get("users/founder")?.guildId).toBeUndefined();
  });

  it("says so when there is nothing to leave", async () => {
    expect(await leaveGuild(session("player"))).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("readGuilds", () => {
  it("reads the room a guild has bought, and the pots it is filling", async () => {
    await found();
    await joinGuild(session("player"), "riff-raiders");
    store.set("guilds/riff-raiders", {
      ...store.get("guilds/riff-raiders"),
      seatUpgrades: 1,
      stashUpgrades: 2,
      funds: { seats: { pot: 3, pledges: { founder: 9 } } },
    });

    // Read as the member rather than the founder: a founder's read also pulls
    // the application queue, which the fake Firestore has no subcollections for.
    const state = await readGuilds(session("player"));

    expect(state.guilds[0]).toMatchObject({
      memberLimit: GUILD_BASE_SEATS + GUILD_SEATS_PER_UPGRADE,
      seatUpgrades: 1,
      stashRowLimit: GUILD_STASH_BASE_ROWS + 2 * GUILD_STASH_ROWS_PER_UPGRADE,
      stashUpgrades: 2,
    });
    expect(state.guilds[0].funds.seats).toMatchObject({
      pot: 3,
      cost: GUILD_SEAT_UPGRADE_COST + GUILD_SEAT_COST_STEP,
      pledges: { founder: 9 },
    });
  });

  it("ranks the biggest first and reports where the caller stands", async () => {
    await found();
    seedPlayer("other");
    await foundGuild(session("other"), { name: "Quiet Ones", tag: "QUI" });
    await joinGuild(session("player"), "riff-raiders");

    const state = await readGuilds(session("player"));

    expect(state.guilds.map((g) => g.id)).toEqual([
      "riff-raiders",
      "quiet-ones",
    ]);
    expect(state.guilds[0].memberCount).toBe(2);
    expect(state.myGuildId).toBe("riff-raiders");
    expect(state.foundingCost).toBe(GUILD_FOUNDING_COST);
  });
});
