import { beforeEach, describe, expect, it, vi } from "vitest";

/** A one-collection fake Firestore: tickets and users, with a real-enough transaction. */
const docs: Record<string, Record<string, any>> = {};
const chargeOk = { value: true };
const charged: number[] = [];

// Data is captured at read time, as a real snapshot does — a write later in the
// same transaction must not show through it.
const snapshot = (path: string) => {
  const data = docs[path];
  return { exists: path in docs, data: () => data, ref: { __path: path } };
};

const ref = (path: string) => ({
  __path: path,
  get: async () => snapshot(path),
  update: async (patch: Record<string, unknown>) => {
    docs[path] = { ...docs[path], ...patch };
  },
});

const tx = {
  get: async (target: { __path: string }) => snapshot(target.__path),
  set: (target: { __path: string }, value: Record<string, unknown>) => {
    docs[target.__path] = value;
  },
  update: (target: { __path: string }, patch: Record<string, unknown>) => {
    docs[target.__path] = { ...docs[target.__path], ...patch };
  },
  delete: (target: { __path: string }) => {
    delete docs[target.__path];
  },
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {
    collection: (name: string) => ({
      doc: (id: string) => ref(`${name}/${id}`),
    }),
    runTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  },
}));

vi.mock("lib/support/tokenWallet", () => ({
  userRef: (uid: string) => ref(`users/${uid}`),
  chargeTokens: (_tx: unknown, user: { data: () => any }, cost: number) => {
    if (!chargeOk.value) return false;
    charged.push(cost);
    const data = user.data() ?? {};
    const wallet = data.supporterTokens ?? { spent: 0, granted: 0 };
    docs[`users/${data.uid}`] = {
      ...data,
      supporterTokens: { spent: wallet.spent + cost, granted: wallet.granted },
    };
    return true;
  },
  describeWallet: (data: any) => ({
    left: 30 - (data?.supporterTokens?.spent ?? 0),
    spent: data?.supporterTokens?.spent ?? 0,
  }),
}));

const {
  isTicketExpired,
  markTicketProgress,
  openTicket,
  readTicket,
  refundTicket,
  storeTicketDraft,
  storeTicketStructure,
  TICKET_TTL_MS,
  ticketId,
} = await import("./generationTicket");
const { ROADMAP_GENERATION_COST } =
  await import("feature/supporterPanel/constants/supporterPanel.constants");

const resetStore = () => {
  Object.keys(docs).forEach((key) => delete docs[key]);
  docs["users/u1"] = {
    uid: "u1",
    isSupport: true,
    supporterTokens: { spent: 0, granted: 0 },
  };
  chargeOk.value = true;
  charged.length = 0;
};

const structure = {
  phases: [],
  review: { issues: [], suggestions: [], isValid: true, revised: false },
  unknownExerciseIds: [],
};
const usage = {
  inputTokens: 1,
  cachedInputTokens: 0,
  outputTokens: 1,
  reasoningTokens: 0,
  embeddingTokens: 0,
  calls: 1,
};

describe("generation tickets", () => {
  beforeEach(resetStore);

  it("keys a ticket by player, goal and level, ignoring case and spacing of the goal", () => {
    expect(ticketId("u1", "  Play like SRV ", "Intermediate")).toBe(
      ticketId("u1", "play like srv", "Intermediate"),
    );
    expect(ticketId("u1", "Play like SRV", "Intermediate")).not.toBe(
      ticketId("u1", "Play like SRV", "Beginner"),
    );
    expect(ticketId("u2", "Play like SRV", "Intermediate")).not.toBe(
      ticketId("u1", "Play like SRV", "Intermediate"),
    );
  });

  it("charges the wallet once and opens a ticket with a roadmap id", async () => {
    const result = await openTicket("u1", "Play like SRV", "Intermediate");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.charged).toBe(true);
    expect(result.ticket.tokensCharged).toBe(ROADMAP_GENERATION_COST);
    expect(result.ticket.roadmapId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.ticket.structure).toBeNull();
    expect(charged).toEqual([ROADMAP_GENERATION_COST]);
    // The wallet reported back already reflects the charge.
    expect(result.wallet.left).toBe(30 - ROADMAP_GENERATION_COST);
  });

  it("reuses a fresh ticket for the same goal without charging again", async () => {
    const first = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!first.ok) throw new Error("expected ok");
    await storeTicketStructure(first.ticket.id, structure as any, usage);

    const second = await openTicket("u1", "play like srv", "Intermediate");

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.charged).toBe(false);
    expect(second.ticket.roadmapId).toBe(first.ticket.roadmapId);
    expect(second.ticket.structure).toEqual(structure);
    expect(charged).toHaveLength(1);
  });

  it("picks up a generation still running, but opens a new one after it finished", async () => {
    const first = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!first.ok) throw new Error("expected ok");
    const key = `roadmapGenerations/${first.ticket.id}`;

    docs[key].job = { status: "running" };
    const again = await openTicket("u1", "Play like SRV", "Intermediate");
    expect(again.ok && again.charged).toBe(false);

    docs[key].job = { status: "done" };
    const another = await openTicket("u1", "Play like SRV", "Intermediate");
    expect(another.ok && another.charged).toBe(true);
    expect(another.ok && another.ticket.roadmapId).not.toBe(
      first.ticket.roadmapId,
    );
    expect(charged).toHaveLength(2);
  });

  it("charges again once the old ticket has expired", async () => {
    const first = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!first.ok) throw new Error("expected ok");
    docs[`roadmapGenerations/${first.ticket.id}`].createdAt = new Date(
      Date.now() - TICKET_TTL_MS - 1000,
    ).toISOString();

    const second = await openTicket("u1", "Play like SRV", "Intermediate");

    expect(second.ok && second.charged).toBe(true);
    expect(charged).toHaveLength(2);
    expect(second.ok && second.ticket.roadmapId).not.toBe(
      first.ticket.roadmapId,
    );
  });

  it("answers 402 and writes nothing when the wallet cannot cover it", async () => {
    chargeOk.value = false;

    const result = await openTicket("u1", "Play like SRV", "Intermediate");

    expect(result).toEqual({
      ok: false,
      status: 402,
      error: "Not enough tokens left",
    });
    expect(
      Object.keys(docs).filter((k) => k.startsWith("roadmapGenerations/")),
    ).toEqual([]);
  });

  it("refunds exactly what the ticket charged and removes it, once", async () => {
    const opened = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!opened.ok) throw new Error("expected ok");
    expect(docs["users/u1"].supporterTokens.spent).toBe(
      ROADMAP_GENERATION_COST,
    );

    await refundTicket(opened.ticket);
    await refundTicket(opened.ticket);

    expect(docs["users/u1"].supporterTokens.spent).toBe(0);
    expect(docs[`roadmapGenerations/${opened.ticket.id}`]).toBeUndefined();
  });

  it("knows a ticket's age", () => {
    const fresh = { createdAt: new Date().toISOString() } as any;
    const stale = {
      createdAt: new Date(Date.now() - TICKET_TTL_MS - 1).toISOString(),
    } as any;
    expect(isTicketExpired(fresh)).toBe(false);
    expect(isTicketExpired(stale)).toBe(true);
  });
});

describe("a generation in two halves", () => {
  beforeEach(resetStore);

  it("opens on the draft stage with nothing drafted yet", async () => {
    const opened = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!opened.ok) throw new Error("expected ok");

    expect(opened.ticket.draft).toBeNull();
    expect(opened.ticket.draftUsage).toBeNull();
    expect(opened.ticket.progress).toMatchObject({ stage: "draft" });
  });

  it("keeps the draft so a second attempt reviews it instead of paying again", async () => {
    const first = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!first.ok) throw new Error("expected ok");
    const draft = [{ title: "Phase 1", steps: [] }] as any;

    await storeTicketDraft(first.ticket.id, draft, usage);
    const second = await openTicket("u1", "play like SRV  ", "Intermediate");

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.charged).toBe(false);
    expect(second.ticket.draft).toEqual(draft);
    expect(second.ticket.draftUsage).toEqual(usage);
    expect(charged).toHaveLength(1);
  });

  it("records the rewrite, which is the one stage the browser cannot see", async () => {
    const opened = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!opened.ok) throw new Error("expected ok");

    await markTicketProgress(opened.ticket.id, "review");
    expect((await readTicket(opened.ticket.id))?.progress?.stage).toBe(
      "review",
    );

    await markTicketProgress(opened.ticket.id, "revise");
    const ticket = await readTicket(opened.ticket.id);
    expect(ticket?.progress?.stage).toBe("revise");
    expect(ticket?.progress?.updatedAt).toEqual(expect.any(String));
  });

  it("closes the ticket when the skeleton lands, keeping what the review alone cost", async () => {
    const opened = await openTicket("u1", "Play like SRV", "Intermediate");
    if (!opened.ok) throw new Error("expected ok");
    const reviewUsage = { ...usage, calls: 2 };

    await storeTicketStructure(
      opened.ticket.id,
      structure as any,
      usage,
      reviewUsage,
    );

    const ticket = await readTicket(opened.ticket.id);
    expect(ticket?.structure).toEqual(structure);
    expect(ticket?.usage).toEqual(usage);
    expect(ticket?.reviewUsage).toEqual(reviewUsage);
    expect(ticket?.progress?.stage).toBe("done");
  });

  it("has nothing to say about a ticket that was never opened", async () => {
    expect(await readTicket("u1_nothing")).toBeNull();
  });
});

describe("a private roadmap", () => {
  beforeEach(resetStore);

  it("costs more and is its own ticket next to the public one for the same goal", async () => {
    const { ROADMAP_PRIVATE_GENERATION_COST } =
      await import("feature/supporterPanel/constants/supporterPanel.constants");
    docs["users/u1"].supporterTokens = { spent: 0, granted: 20 };

    const secret = await openTicket(
      "u1",
      "Play like SRV",
      "Intermediate",
      "private",
    );
    const open = await openTicket(
      "u1",
      "Play like SRV",
      "Intermediate",
      "public",
    );

    expect(secret.ok && secret.ticket.tokensCharged).toBe(
      ROADMAP_PRIVATE_GENERATION_COST,
    );
    expect(secret.ok && secret.ticket.visibility).toBe("private");
    expect(open.ok && open.ticket.tokensCharged).toBe(ROADMAP_GENERATION_COST);
    expect(open.ok && open.ticket.id).not.toBe(secret.ok && secret.ticket.id);
    expect(charged).toEqual([
      ROADMAP_PRIVATE_GENERATION_COST,
      ROADMAP_GENERATION_COST,
    ]);
  });
});
