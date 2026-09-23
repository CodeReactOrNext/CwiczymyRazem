import { beforeEach, describe, expect, it, vi } from "vitest";

/** A one-collection fake Firestore with a real-enough transaction. */
const docs: Record<string, Record<string, any>> = {};

const snapshot = (path: string) => {
  const data = docs[path];
  return { exists: path in docs, data: () => data, ref: { __path: path } };
};

const tx = {
  get: async (target: { __path: string }) => snapshot(target.__path),
  update: (target: { __path: string }, patch: Record<string, unknown>) => {
    docs[target.__path] = { ...docs[target.__path], ...patch };
  },
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        __path: `${name}/${id}`,
        get: async () => snapshot(`${name}/${id}`),
      }),
    }),
    runTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  },
}));

const { refundTokens, spendTokens } = await import("./tokenWallet");

beforeEach(() => {
  Object.keys(docs).forEach((key) => delete docs[key]);
  docs["users/u1"] = {
    uid: "u1",
    isSupport: true,
    supportTotal: 0,
    supporterTokens: { spent: 4, granted: 0 },
  };
});

describe("spendTokens", () => {
  it("charges the stored wallet and answers with what is left", async () => {
    // A badge alone is worth 10; 4 are gone, so 6 remain and 2 can go.
    const outcome = await spendTokens("u1", 2);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.wallet.spent).toBe(6);
    expect(outcome.wallet.left).toBe(4);
    expect(docs["users/u1"].supporterTokens.spent).toBe(6);
  });

  it("refuses and writes nothing when the wallet cannot cover it", async () => {
    const outcome = await spendTokens("u1", 50);

    expect(outcome).toEqual({
      ok: false,
      status: 402,
      error: "Not enough tokens left",
    });
    expect(docs["users/u1"].supporterTokens.spent).toBe(4);
  });

  it("refuses a user that does not exist", async () => {
    const outcome = await spendTokens("nobody", 1);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.status).toBe(404);
  });
});

describe("refundTokens", () => {
  it("gives a charge back, never below zero", async () => {
    await refundTokens("u1", 3);
    expect(docs["users/u1"].supporterTokens.spent).toBe(1);

    await refundTokens("u1", 10);
    expect(docs["users/u1"].supporterTokens.spent).toBe(0);
  });

  it("ignores a nonsense amount and a missing user", async () => {
    await refundTokens("u1", 0);
    await refundTokens("u1", -2);
    expect(docs["users/u1"].supporterTokens.spent).toBe(4);

    await expect(refundTokens("nobody", 3)).resolves.toBeUndefined();
  });
});
