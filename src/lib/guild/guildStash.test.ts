import type { StashDeposit } from "feature/guilds/types/stash.types";
import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake Firestore with subcollections, ordered log reads and transactions. */
const store = new Map<string, Record<string, any>>();
let autoId = 0;

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
    // Dotted paths are how the arsenal is written ("arsenal.inventory").
    const segments = key.split(".");
    let target = next;
    while (segments.length > 1) {
      const segment = segments.shift()!;
      target[segment] = { ...(target[segment] ?? {}) };
      target = target[segment];
    }
    target[segments[0]] = value;
  }
  return next;
};

const childrenOf = (prefix: string) =>
  [...store.keys()].filter(
    (path) =>
      path.startsWith(`${prefix}/`) &&
      !path.slice(prefix.length + 1).includes("/"),
  );

const collectionApi = (prefix: string): any => ({
  doc: (id?: string) => {
    const path = `${prefix}/${id ?? `auto-${++autoId}`}`;
    return {
      ...ref(path),
      get: async () => snapshot(path),
      collection: (sub: string) => collectionApi(`${path}/${sub}`),
    };
  },
  orderBy: () => collectionApi(prefix),
  limit: () => collectionApi(prefix),
  select: () => collectionApi(prefix),
  get: async () => ({ docs: childrenOf(prefix).map((path) => snapshot(path)) }),
});

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => collectionApi(name),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) =>
      fn({
        // A document by path, or a query — the deposit reads the whole shelf to
        // work out whether the piece it is about to hang has a row to hang in.
        get: async (target: any) =>
          target.__path ? snapshot(target.__path) : target.get(),
        set: (target: Ref, value: Record<string, any>) =>
          store.set(target.__path, value),
        update: (target: Ref, patch: Record<string, any>) =>
          store.set(
            target.__path,
            applyPatch(store.get(target.__path) ?? {}, patch),
          ),
        delete: (target: Ref) => store.delete(target.__path),
      }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => new Date("2026-08-29T00:00:00.000Z") },
}));

const { depositItem, readStash, takeItem } = await import("./guildStash");

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

/** id 1 is a real guitar in the game's own definitions. */
const GUITAR = { id: "inst-1", guitarId: 1, condition: 90 };

/** The deposit most of these tests make: the seeded guitar, whole. */
const GIVE_GUITAR: StashDeposit = {
  kind: "guitar",
  inventoryItemId: "inst-1",
};

const seedOwner = (uid: string, extra: Record<string, any> = {}) =>
  store.set(`users/${uid}`, {
    displayName: uid,
    guildId: "riff-raiders",
    arsenal: { inventory: [GUITAR], effectInventory: [], ...extra },
  });

const shelf = () =>
  [...store.keys()].filter((p) => p.startsWith("guilds/riff-raiders/stash/"));

const inventoryOf = (uid: string): any[] =>
  store.get(`users/${uid}`)?.arsenal?.inventory ?? [];

beforeEach(() => {
  store.clear();
  autoId = 0;
  seedOwner("giver");
  store.set("users/taker", {
    displayName: "taker",
    guildId: "riff-raiders",
    arsenal: { inventory: [], effectInventory: [] },
  });
  store.set("guilds/riff-raiders", {
    members: [
      { uid: "giver", displayName: "giver", avatar: null },
      { uid: "taker", displayName: "taker", avatar: null },
    ],
  });
});

describe("depositItem", () => {
  it("moves the instance off the owner and onto the shelf", async () => {
    expect(
      await depositItem(session("giver"), "riff-raiders", GIVE_GUITAR),
    ).toEqual({ ok: true });

    expect(inventoryOf("giver")).toHaveLength(0);
    expect(shelf()).toHaveLength(1);
  });

  it("unequips what it takes, so no rate survives the item", async () => {
    seedOwner("giver", {
      equippedItemId: "inst-1",
      equippedGuitarId: 1,
      rig: { guitarSlots: ["inst-1", null], pedalboardItems: [] },
    });

    await depositItem(session("giver"), "riff-raiders", GIVE_GUITAR);

    const arsenal = store.get("users/giver")?.arsenal;
    expect(arsenal.equippedItemId).toBeNull();
    expect(arsenal.equippedGuitarId).toBeNull();
    expect(arsenal.rig.guitarSlots).toEqual([null, null]);
    // The rig level is recomputed off what is left, not left standing.
    expect(store.get("users/giver")?.rigLevel).toBe(0);
  });

  it("refuses somebody who is not in the guild", async () => {
    store.set("users/outsider", {
      displayName: "outsider",
      arsenal: { inventory: [GUITAR] },
    });

    const result = await depositItem(
      session("outsider"),
      "riff-raiders",
      GIVE_GUITAR,
    );

    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(shelf()).toHaveLength(0);
  });

  it("refuses an item the depositor does not own", async () => {
    const result = await depositItem(session("giver"), "riff-raiders", {
      kind: "guitar",
      inventoryItemId: "not-mine",
    });

    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("will not strip a pedal off a wired board", async () => {
    store.set("users/giver", {
      displayName: "giver",
      guildId: "riff-raiders",
      arsenal: {
        inventory: [],
        effectInventory: [{ id: "pedal-1", effectId: 1 }],
        rig: { guitarSlots: [], pedalboardItems: [{ itemId: "pedal-1" }] },
      },
    });

    const result = await depositItem(session("giver"), "riff-raiders", {
      kind: "effect",
      inventoryItemId: "pedal-1",
    });

    expect(result).toMatchObject({ ok: false, status: 409 });
  });
});

describe("takeItem", () => {
  beforeEach(async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_GUITAR);
  });

  it("hands the instance to the taker and clears the shelf", async () => {
    const entryId = ref(shelf()[0]).id;

    expect(await takeItem(session("taker"), "riff-raiders", entryId)).toEqual({
      ok: true,
    });

    expect(inventoryOf("taker")).toHaveLength(1);
    expect(inventoryOf("taker")[0]).toMatchObject({ guitarId: 1, isNew: true });
    expect(shelf()).toHaveLength(0);
  });

  it("marks the model discovered for the taker", async () => {
    const entryId = ref(shelf()[0]).id;
    await takeItem(session("taker"), "riff-raiders", entryId);

    expect(store.get("users/taker")?.arsenal?.dexGuitars).toContain(1);
  });

  it("cannot be taken twice — one instance, one owner", async () => {
    const entryId = ref(shelf()[0]).id;
    await takeItem(session("taker"), "riff-raiders", entryId);

    const second = await takeItem(session("giver"), "riff-raiders", entryId);

    expect(second).toMatchObject({ ok: false, status: 404 });
    expect(inventoryOf("giver")).toHaveLength(0);
  });

  it("refuses somebody outside the guild", async () => {
    store.set("users/outsider", { displayName: "outsider", arsenal: {} });
    const entryId = ref(shelf()[0]).id;

    expect(
      await takeItem(session("outsider"), "riff-raiders", entryId),
    ).toMatchObject({ ok: false, status: 403 });
    expect(shelf()).toHaveLength(1);
  });
});

describe("the ledger", () => {
  it("counts what each member gave and took", async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_GUITAR);
    const entryId = ref(shelf()[0]).id;
    await takeItem(session("taker"), "riff-raiders", entryId);

    const stash = await readStash(
      "riff-raiders",
      store.get("guilds/riff-raiders")!.members,
    );

    const giver = stash.tallies.find((t) => t.uid === "giver")!;
    const taker = stash.tallies.find((t) => t.uid === "taker")!;

    expect(giver).toMatchObject({ deposited: 1, taken: 0 });
    expect(taker).toMatchObject({ deposited: 0, taken: 1 });
  });

  it("lists a member who has done neither, which is the point", async () => {
    const stash = await readStash(
      "riff-raiders",
      store.get("guilds/riff-raiders")!.members,
    );

    expect(stash.tallies).toHaveLength(2);
    expect(stash.tallies.every((t) => t.deposited === 0 && t.taken === 0)).toBe(
      true,
    );
  });

  it("records both sides of every move in the log", async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_GUITAR);
    const entryId = ref(shelf()[0]).id;
    await takeItem(session("taker"), "riff-raiders", entryId);

    const stash = await readStash("riff-raiders", []);

    expect(stash.log.map((entry) => entry.action).sort()).toEqual([
      "deposit",
      "take",
    ]);
  });
});

/**
 * Parts and mods are the other two things a stash holds, and neither moves the
 * way an instance does: a part is an amount off a wallet, a mod is a row in a
 * different array. Both are worth their own coverage — the wallet maths is the
 * easiest thing here to get wrong in a member's favour.
 */
describe("loose stash: parts", () => {
  const GIVE_SCREWS = (qty: number) =>
    ({ kind: "part", partId: "screws", tier: "Standard", qty }) as const;

  const walletOf = (uid: string): any[] =>
    store.get(`users/${uid}`)?.arsenal?.parts ?? [];

  beforeEach(() => {
    store.set("users/giver", {
      displayName: "giver",
      guildId: "riff-raiders",
      arsenal: {
        inventory: [],
        effectInventory: [],
        parts: [{ partId: "screws", tier: "Standard", qty: 20 }],
      },
    });
  });

  it("takes only the amount asked for off the wallet", async () => {
    expect(
      await depositItem(session("giver"), "riff-raiders", GIVE_SCREWS(8)),
    ).toEqual({ ok: true });

    expect(walletOf("giver")).toEqual([
      { partId: "screws", tier: "Standard", qty: 12 },
    ]);
    expect(shelf()).toHaveLength(1);
    expect(store.get(shelf()[0])?.item).toMatchObject({ qty: 8 });
  });

  it("stacks onto what is already on the shelf rather than beside it", async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_SCREWS(8));
    await depositItem(session("giver"), "riff-raiders", GIVE_SCREWS(5));

    expect(shelf()).toHaveLength(1);
    expect(store.get(shelf()[0])?.item).toMatchObject({ qty: 13 });
    expect(walletOf("giver")).toEqual([
      { partId: "screws", tier: "Standard", qty: 7 },
    ]);
  });

  it("refuses more than the member is holding", async () => {
    const result = await depositItem(
      session("giver"),
      "riff-raiders",
      GIVE_SCREWS(21),
    );

    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(shelf()).toHaveLength(0);
  });

  it("hands over a slice and leaves the rest on the shelf", async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_SCREWS(10));
    const entryId = ref(shelf()[0]).id;

    expect(
      await takeItem(session("taker"), "riff-raiders", entryId, 4),
    ).toEqual({ ok: true });

    expect(walletOf("taker")).toEqual([
      { partId: "screws", tier: "Standard", qty: 4 },
    ]);
    expect(store.get(shelf()[0])?.item).toMatchObject({ qty: 6 });
  });

  it("empties the socket when the whole stack is taken", async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_SCREWS(10));
    const entryId = ref(shelf()[0]).id;

    await takeItem(session("taker"), "riff-raiders", entryId);

    expect(walletOf("taker")).toEqual([
      { partId: "screws", tier: "Standard", qty: 10 },
    ]);
    expect(shelf()).toHaveLength(0);
  });

  it("never hands over more than is on the shelf", async () => {
    await depositItem(session("giver"), "riff-raiders", GIVE_SCREWS(3));
    const entryId = ref(shelf()[0]).id;

    await takeItem(session("taker"), "riff-raiders", entryId, 999);

    expect(walletOf("taker")).toEqual([
      { partId: "screws", tier: "Standard", qty: 3 },
    ]);
    expect(shelf()).toHaveLength(0);
  });
});

describe("loose stash: rescued mods", () => {
  const MOD = {
    id: "mod-1",
    featureId: "coil-split",
    kind: "guitar",
    points: 2,
    sourceName: "Some Guitar",
    salvagedAt: 0,
  };

  const modsOf = (uid: string): any[] =>
    store.get(`users/${uid}`)?.arsenal?.salvagedMods ?? [];

  beforeEach(() => {
    store.set("users/giver", {
      displayName: "giver",
      guildId: "riff-raiders",
      arsenal: { inventory: [], effectInventory: [], salvagedMods: [MOD] },
    });
  });

  it("moves the mod off the owner and onto the shelf", async () => {
    expect(
      await depositItem(session("giver"), "riff-raiders", {
        kind: "mod",
        modId: "mod-1",
      }),
    ).toEqual({ ok: true });

    expect(modsOf("giver")).toHaveLength(0);
    expect(store.get(shelf()[0])).toMatchObject({ kind: "mod" });
  });

  it("hands it to the taker", async () => {
    await depositItem(session("giver"), "riff-raiders", {
      kind: "mod",
      modId: "mod-1",
    });

    await takeItem(session("taker"), "riff-raiders", ref(shelf()[0]).id);

    expect(modsOf("taker")).toHaveLength(1);
    expect(modsOf("taker")[0]).toMatchObject({ featureId: "coil-split" });
    expect(shelf()).toHaveLength(0);
  });

  it("re-issues an id the taker is already using", async () => {
    store.set("users/taker", {
      displayName: "taker",
      guildId: "riff-raiders",
      arsenal: { inventory: [], effectInventory: [], salvagedMods: [MOD] },
    });

    await depositItem(session("giver"), "riff-raiders", {
      kind: "mod",
      modId: "mod-1",
    });
    await takeItem(session("taker"), "riff-raiders", ref(shelf()[0]).id);

    const ids = modsOf("taker").map((mod) => mod.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("refuses a mod the depositor does not hold", async () => {
    const result = await depositItem(session("giver"), "riff-raiders", {
      kind: "mod",
      modId: "nope",
    });

    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});

/**
 * The shelf is only as many rows as the guild has paid for. Twelve sockets to a
 * row, a guitar hanging across two of them — the same arrangement the tab draws,
 * counted on the server so a full shelf cannot be talked into taking one more.
 */
describe("a shelf with a limit", () => {
  const fillRows = (sockets: number) => {
    for (let index = 0; index < sockets; index++) {
      store.set(`guilds/riff-raiders/stash/e${index}`, {
        kind: "effect",
        name: "Pedal",
        item: { id: `fx-${index}`, effectId: 1 },
      });
    }
  };

  const buyRows = (rows: number) =>
    store.set("guilds/riff-raiders", {
      ...store.get("guilds/riff-raiders"),
      stashUpgrades: rows,
    });

  it("refuses the piece that would need a row nobody paid for", async () => {
    // Two rows come free, and twenty-four pedals fill them exactly.
    fillRows(24);

    const result = await depositItem(
      session("giver"),
      "riff-raiders",
      GIVE_GUITAR,
    );

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(result).toMatchObject({ error: expect.stringContaining("full") });
    // The guitar never left the giver's hands.
    expect(inventoryOf("giver")).toHaveLength(1);
    expect(shelf()).toHaveLength(24);
  });

  it("hangs it in a row the guild bought", async () => {
    fillRows(24);
    buyRows(1);

    expect(
      await depositItem(session("giver"), "riff-raiders", GIVE_GUITAR),
    ).toEqual({ ok: true });

    expect(shelf()).toHaveLength(25);
  });

  it("lets a stack top up a socket that is already on a full shelf", async () => {
    fillRows(23);
    store.set("users/giver", {
      displayName: "giver",
      guildId: "riff-raiders",
      arsenal: {
        inventory: [],
        effectInventory: [],
        parts: [{ partId: "screws", tier: "Standard", qty: 20 }],
      },
    });
    await depositItem(session("giver"), "riff-raiders", {
      kind: "part",
      partId: "screws",
      tier: "Standard",
      qty: 5,
    });
    expect(shelf()).toHaveLength(24);

    // The shelf is full, but this lands on the stack that is already there.
    expect(
      await depositItem(session("giver"), "riff-raiders", {
        kind: "part",
        partId: "screws",
        tier: "Standard",
        qty: 5,
      }),
    ).toEqual({ ok: true });

    expect(shelf()).toHaveLength(24);
    expect(
      store.get("guilds/riff-raiders/stash/part-screws-Standard")?.item,
    ).toMatchObject({ qty: 10 });
  });
});
