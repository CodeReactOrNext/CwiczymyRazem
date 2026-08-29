import {
  GUILD_MAX_SEAT_UPGRADES,
  GUILD_SEAT_COST_STEP,
  GUILD_SEAT_UPGRADE_COST,
  GUILD_STASH_ROW_COST,
} from "feature/supporterPanel/constants/supporterPanel.constants";
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
    // Dotted paths are how a pot and a pledge are written.
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

const { fundUpgrade } = await import("./guildFunding");

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 100,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: true,
});

const seedMember = (uid: string, extra: Record<string, any> = {}) =>
  store.set(`users/${uid}`, {
    displayName: uid,
    supportTotal: 100,
    guildId: "riff-raiders",
    ...extra,
  });

const guild = () => store.get("guilds/riff-raiders") ?? {};

const spentBy = (uid: string): number =>
  store.get(`users/${uid}`)?.supporterTokens?.spent ?? 0;

beforeEach(() => {
  store.clear();
  seedMember("ann");
  seedMember("bob");
  store.set("guilds/riff-raiders", { name: "Riff Raiders" });
});

describe("fundUpgrade", () => {
  it("holds the tokens in the pot until they cover the step", async () => {
    expect(await fundUpgrade(session("ann"), "seats", 2)).toEqual({
      ok: true,
      paid: 2,
      unlocked: false,
    });

    expect(guild().funds.seats.pot).toBe(2);
    expect(guild().seatUpgrades).toBeUndefined();
    expect(spentBy("ann")).toBe(2);
  });

  it("buys the step on the contribution that fills the pot", async () => {
    await fundUpgrade(session("ann"), "seats", GUILD_SEAT_UPGRADE_COST - 1);

    expect(await fundUpgrade(session("bob"), "seats", 1)).toEqual({
      ok: true,
      paid: 1,
      unlocked: true,
    });

    expect(guild().seatUpgrades).toBe(1);
    // Emptied for the next one, which nobody has paid anything towards.
    expect(guild().funds.seats.pot).toBe(0);
  });

  it("takes only what is still owed, however much is offered", async () => {
    await fundUpgrade(session("ann"), "seats", 3);

    const result = await fundUpgrade(session("bob"), "seats", 1000);

    expect(result).toEqual({
      ok: true,
      paid: GUILD_SEAT_UPGRADE_COST - 3,
      unlocked: true,
    });
    expect(spentBy("bob")).toBe(GUILD_SEAT_UPGRADE_COST - 3);
  });

  it("keeps the credit for a step after the step is bought", async () => {
    await fundUpgrade(session("ann"), "seats", GUILD_SEAT_UPGRADE_COST);
    await fundUpgrade(session("ann"), "seats", 2);

    expect(guild().funds.seats.pledges.ann).toBe(GUILD_SEAT_UPGRADE_COST + 2);
    expect(guild().funds.seats.pot).toBe(2);
  });

  it("charges the rising price for the step after that", async () => {
    await fundUpgrade(session("ann"), "seats", GUILD_SEAT_UPGRADE_COST);
    await fundUpgrade(session("ann"), "seats", 1000);

    expect(guild().seatUpgrades).toBe(2);
    expect(spentBy("ann")).toBe(
      GUILD_SEAT_UPGRADE_COST + GUILD_SEAT_UPGRADE_COST + GUILD_SEAT_COST_STEP,
    );
  });

  it("grows the shelf off its own pot", async () => {
    expect(
      await fundUpgrade(session("ann"), "stashRows", GUILD_STASH_ROW_COST),
    ).toMatchObject({ ok: true, unlocked: true });

    expect(guild().stashUpgrades).toBe(1);
    // The two pots are separate: paying for a row buys no seats.
    expect(guild().seatUpgrades).toBeUndefined();
  });

  it("refuses an amount that is not one", async () => {
    for (const tokens of [0, -3, Number.NaN]) {
      expect(await fundUpgrade(session("ann"), "seats", tokens)).toMatchObject({
        ok: false,
        status: 400,
      });
    }
    expect(spentBy("ann")).toBe(0);
  });

  it("refuses somebody who is not in a guild", async () => {
    store.set("users/stray", { displayName: "stray", supportTotal: 100 });

    expect(await fundUpgrade(session("stray"), "seats", 1)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("refuses a wallet that cannot cover it, and takes nothing", async () => {
    seedMember("broke", {
      supportTotal: 0,
      isSupport: true,
      supporterTokens: { spent: 99, granted: 0 },
    });

    expect(await fundUpgrade(session("broke"), "seats", 4)).toMatchObject({
      ok: false,
      status: 402,
    });
    expect(guild().funds).toBeUndefined();
  });

  it("stops at the ceiling, and charges nothing for asking", async () => {
    store.set("guilds/riff-raiders", {
      ...guild(),
      seatUpgrades: GUILD_MAX_SEAT_UPGRADES,
    });

    expect(await fundUpgrade(session("ann"), "seats", 5)).toMatchObject({
      ok: false,
      status: 409,
    });
    expect(spentBy("ann")).toBe(0);
  });
});
