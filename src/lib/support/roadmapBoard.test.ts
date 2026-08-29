import {
  IDEA_COST,
  MAX_BACKING_PER_IDEA,
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { DEFAULT_ROADMAP_IDEA_ICON } from "feature/supporterPanel/types/supporterPanel.types";
import type { SupporterSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Firestore covering exactly what the board does: document refs, one
 * unfiltered collection read, and transactions whose writes apply immediately
 * (nothing here runs concurrently).
 */
const store = new Map<string, Record<string, any>>();
let autoId = 0;

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
    next[key] =
      value && typeof value === "object" && "__increment" in value
        ? (next[key] ?? 0) + value.__increment
        : value;
  }
  return next;
};

const write = (target: Ref, value: Record<string, any>) =>
  store.set(target.__path, applyPatch(store.get(target.__path) ?? {}, value));

const collectionApi = (name: string) => ({
  doc: (id?: string) => {
    const docRef = ref(`${name}/${id ?? `auto-${++autoId}`}`);
    return {
      ...docRef,
      get: async () => snapshot(docRef.__path),
      update: async (patch: Record<string, any>) => write(docRef, patch),
    };
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
    getAll: async (...refs: Ref[]) => refs.map((one) => snapshot(one.__path)),
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
  FieldValue: {
    serverTimestamp: () => new Date("2026-08-28T00:00:00.000Z"),
    increment: (by: number) => ({ __increment: by }),
  },
}));

const { backIdea, createIdea, readBoard, setIdeaStatus } =
  await import("./roadmapBoard");

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

/** What a lifetime donation of `usd` leaves a supporter holding. */
const walletOf = (usd: number) =>
  SUPPORTER_WELCOME_TOKENS + usd * TOKENS_PER_DOLLAR;

/** A supporter with a given lifetime donation and a fresh, untouched wallet. */
const seedSupporter = (supportTotal = 10) =>
  store.set("users/u1", { supportTotal, displayName: "Ola", isSupport: true });

const spentSoFar = (): number =>
  store.get("users/u1")?.supporterTokens?.spent ?? 0;

/** serverTimestamp() lands as a Date in the fake; the reader wants toDate(). */
const asStored = (iso: string) => ({ toDate: () => new Date(iso) });

const seedIdea = (id: string, fields: Record<string, any> = {}) =>
  store.set(`roadmapIdeas/${id}`, {
    title: id,
    description: "",
    status: "open",
    authorUid: "someone",
    authorName: "Someone",
    voteCount: 0,
    backerCount: 0,
    createdAt: asStored("2026-01-01T00:00:00.000Z"),
    ...fields,
  });

const postedIdea = (): Record<string, any> | undefined =>
  [...store.entries()].find(([path]) => path.startsWith("roadmapIdeas/"))?.[1];

beforeEach(() => {
  store.clear();
  autoId = 0;
});

describe("readBoard", () => {
  beforeEach(() => seedSupporter());

  it("ranks the most backed idea first", async () => {
    seedIdea("quiet", { voteCount: 1 });
    seedIdea("loud", { voteCount: 9 });

    const board = await readBoard(session());

    expect(board.ideas.map((idea) => idea.id)).toEqual(["loud", "quiet"]);
  });

  it("breaks a tie in favour of whoever posted first", async () => {
    seedIdea("late", {
      voteCount: 2,
      createdAt: asStored("2026-05-01T00:00:00.000Z"),
    });
    seedIdea("early", {
      voteCount: 2,
      createdAt: asStored("2026-01-01T00:00:00.000Z"),
    });

    const board = await readBoard(session());

    expect(board.ideas.map((idea) => idea.id)).toEqual(["early", "late"]);
  });

  it("defaults the icon on ideas posted before icons existed", async () => {
    seedIdea("old-one");

    const board = await readBoard(session());

    expect(board.ideas[0].icon).toBe(DEFAULT_ROADMAP_IDEA_ICON);
  });

  it("names everyone behind an idea, heaviest backing first", async () => {
    seedIdea("idea-1", { voteCount: 4, backerCount: 2 });
    store.set("roadmapVotes/u1", {
      name: "Ola",
      avatar: null,
      votes: { "idea-1": 1 },
    });
    store.set("roadmapVotes/u2", {
      name: "Marek",
      avatar: "https://pic/marek",
      votes: { "idea-1": 3 },
    });

    const board = await readBoard(session());

    expect(board.ideas[0].backers).toEqual([
      { uid: "u2", name: "Marek", avatar: "https://pic/marek", weight: 3 },
      { uid: "u1", name: "Ola", avatar: null, weight: 1 },
    ]);
  });

  it("names a backer whose vote predates the cached name", async () => {
    seedIdea("idea-1", { voteCount: 2, backerCount: 1 });
    store.set("users/u2", {
      displayName: "Marek",
      avatar: "https://pic/marek",
    });
    store.set("roadmapVotes/u2", { votes: { "idea-1": 2 } });

    const board = await readBoard(session());

    expect(board.ideas[0].backers).toEqual([
      { uid: "u2", name: "Marek", avatar: "https://pic/marek", weight: 2 },
    ]);
  });

  it("keeps a backing of nothing off the list", async () => {
    seedIdea("idea-1");
    store.set("roadmapVotes/u2", { name: "Marek", votes: { "idea-1": 0 } });

    const board = await readBoard(session());

    expect(board.ideas[0].backers).toEqual([]);
  });

  it("reports the wallet the donation bought", async () => {
    const board = await readBoard(session());

    expect(board.wallet.earned).toBe(walletOf(10));
    expect(board.wallet.left).toBe(walletOf(10));
    expect(board.wallet.fromDonation).toBe(10 * TOKENS_PER_DOLLAR);
  });

  it("counts spending against the pile for good", async () => {
    store.set("users/u1", {
      supportTotal: 10,
      isSupport: true,
      supporterTokens: { spent: 40, granted: 0 },
    });

    const board = await readBoard(session());

    expect(board.wallet.spent).toBe(40);
    expect(board.wallet.left).toBe(walletOf(10) - 40);
  });

  it("opens a wallet left over from the monthly era with nothing spent", async () => {
    store.set("users/u1", {
      supportTotal: 10,
      isSupport: true,
      supporterTokens: { period: "1999-01", spent: 99 },
    });

    const board = await readBoard(session());

    expect(board.wallet.spent).toBe(0);
    expect(board.wallet.left).toBe(walletOf(10));
  });
});

describe("createIdea", () => {
  beforeEach(() => seedSupporter());

  it("posts the idea and burns the tokens in one go", async () => {
    const result = await createIdea(session(), {
      title: "  Tempo-aware metronome  ",
      description: "  follows the tab  ",
      icon: "tone",
    });

    expect(result.ok).toBe(true);
    expect(spentSoFar()).toBe(IDEA_COST);
    expect(postedIdea()).toMatchObject({
      title: "Tempo-aware metronome",
      description: "follows the tab",
      status: "open",
      icon: "tone",
      authorUid: "u1",
      voteCount: 0,
    });
  });

  it("refuses an idea the wallet cannot cover", async () => {
    store.set("users/u1", {
      supportTotal: 0,
      isSupport: true,
      supporterTokens: { spent: SUPPORTER_WELCOME_TOKENS },
    });

    const result = await createIdea(session({ supportTotal: 0 }), {
      title: "Free lunch",
    });

    expect(result).toMatchObject({ ok: false, status: 402 });
    expect(postedIdea()).toBeUndefined();
  });

  it("falls back to the default icon instead of storing junk", async () => {
    await createIdea(session(), { title: "Sneaky", icon: "<script>" as never });

    expect(postedIdea()?.icon).toBe(DEFAULT_ROADMAP_IDEA_ICON);
  });

  it("rejects an empty title before charging anything", async () => {
    const result = await createIdea(session(), { title: "   " });

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(spentSoFar()).toBe(0);
  });
});

describe("backIdea", () => {
  beforeEach(() => {
    seedSupporter();
    seedIdea("idea-1");
  });

  it("charges a token per point of weight and counts the backer once", async () => {
    await backIdea(session(), "idea-1", 1);

    expect(store.get("roadmapIdeas/idea-1")).toMatchObject({
      voteCount: 1,
      backerCount: 1,
    });
    expect(spentSoFar()).toBe(1);

    await backIdea(session(), "idea-1", 2);

    expect(store.get("roadmapIdeas/idea-1")).toMatchObject({
      voteCount: 3,
      backerCount: 1,
    });
    expect(spentSoFar()).toBe(3);
  });

  it("caches the backer's name so the board can show who voted", async () => {
    const result = await backIdea(session(), "idea-1", 2);

    expect(store.get("roadmapVotes/u1")).toMatchObject({
      name: "Ola",
      avatar: null,
    });
    if (!result.ok) throw new Error(result.error);
    expect(result.board.ideas[0].backers).toEqual([
      { uid: "u1", name: "Ola", avatar: null, weight: 2 },
    ]);
  });

  it("stops one person from owning a row", async () => {
    const result = await backIdea(
      session({ supportTotal: 100 }),
      "idea-1",
      MAX_BACKING_PER_IDEA + 1,
    );

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(store.get("roadmapIdeas/idea-1")?.voteCount).toBe(0);
    expect(spentSoFar()).toBe(0);
  });

  it("refuses to spend a wallet that is gone", async () => {
    store.set("users/u1", {
      supportTotal: 0,
      isSupport: true,
      supporterTokens: { spent: SUPPORTER_WELCOME_TOKENS },
    });

    const result = await backIdea(session({ supportTotal: 0 }), "idea-1", 1);

    expect(result).toMatchObject({ ok: false, status: 402 });
    expect(store.get("roadmapIdeas/idea-1")?.voteCount).toBe(0);
  });

  it("rejects a backing that isn't a positive whole number", async () => {
    expect(await backIdea(session(), "idea-1", 0)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(await backIdea(session(), "idea-1", -1)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(spentSoFar()).toBe(0);
  });

  it("404s on an idea that is gone, without charging", async () => {
    const result = await backIdea(session(), "ghost", 1);

    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(spentSoFar()).toBe(0);
  });
});

describe("setIdeaStatus", () => {
  beforeEach(() => {
    seedSupporter();
    seedIdea("idea-1");
  });

  it("lets the owner move an idea along", async () => {
    const result = await setIdeaStatus(
      session({ isOwner: true }),
      "idea-1",
      "shipped",
    );

    expect(result.ok).toBe(true);
    expect(store.get("roadmapIdeas/idea-1")?.status).toBe("shipped");
  });

  it("refuses everyone else, badge or not", async () => {
    const result = await setIdeaStatus(session(), "idea-1", "shipped");

    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(store.get("roadmapIdeas/idea-1")?.status).toBe("open");
  });

  it("rejects a status that isn't on the board", async () => {
    const result = await setIdeaStatus(
      session({ isOwner: true }),
      "idea-1",
      "whatever" as never,
    );

    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});
