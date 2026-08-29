import {
  IDEA_COST,
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import {
  canSpend,
  EMPTY_WALLET,
  spendFromWallet,
  tokensEarned,
  tokensFromDonation,
  tokensLeft,
  walletFromStored,
} from "feature/supporterPanel/utils/supporterTokens";
import { describe, expect, it } from "vitest";

const wallet = (spent: number, granted = 0) => ({ spent, granted });

describe("what a donation buys", () => {
  it("pays a fixed rate for every whole dollar, once", () => {
    expect(tokensFromDonation(1)).toBe(TOKENS_PER_DOLLAR);
    expect(tokensFromDonation(25)).toBe(25 * TOKENS_PER_DOLLAR);
  });

  it("ignores the cents, and nonsense from Firestore", () => {
    expect(tokensFromDonation(5.9)).toBe(5 * TOKENS_PER_DOLLAR);
    expect(tokensFromDonation(-3)).toBe(0);
    expect(tokensFromDonation(NaN)).toBe(0);
  });

  it("pays the badge alone, so a hand-marked supporter still has a say", () => {
    expect(tokensEarned(0, EMPTY_WALLET, true)).toBe(SUPPORTER_WELCOME_TOKENS);
  });

  it("gives the welcome tokens to the badge, not to anyone who asks", () => {
    expect(tokensEarned(0, EMPTY_WALLET, false)).toBe(0);
    expect(tokensEarned(3, EMPTY_WALLET, false)).toBe(3 * TOKENS_PER_DOLLAR);
  });
});

describe("the pile does not refill", () => {
  it("counts every token ever spent against it", () => {
    const earned = tokensEarned(5, EMPTY_WALLET, true);

    expect(tokensLeft(5, wallet(0), true)).toBe(earned);
    expect(tokensLeft(5, wallet(20), true)).toBe(earned - 20);
  });

  it("never reads below zero, however the ledger got there", () => {
    expect(tokensLeft(0, wallet(9_000), true)).toBe(0);
  });

  it("treats a missing wallet as untouched", () => {
    expect(tokensLeft(10, null, true)).toBe(tokensEarned(10, null, true));
    expect(tokensLeft(10, undefined, true)).toBe(
      tokensEarned(10, undefined, true),
    );
  });
});

describe("canSpend", () => {
  it("allows what the wallet covers", () => {
    expect(canSpend(1, EMPTY_WALLET, IDEA_COST, true)).toBe(true);
  });

  it("refuses once the wallet is spent out", () => {
    const earned = tokensEarned(0, EMPTY_WALLET, true);

    expect(canSpend(0, wallet(earned), 1, true)).toBe(false);
    expect(canSpend(0, wallet(earned - 1), 1, true)).toBe(true);
  });

  it("rejects nonsense costs", () => {
    expect(canSpend(10, EMPTY_WALLET, 0, true)).toBe(false);
    expect(canSpend(10, EMPTY_WALLET, -5, true)).toBe(false);
    expect(canSpend(10, EMPTY_WALLET, 1.5, true)).toBe(false);
  });
});

describe("a hand-written grant", () => {
  it("adds to the pile on top of what the donation buys", () => {
    expect(tokensLeft(2, wallet(0, 30), true)).toBe(
      tokensEarned(2, EMPTY_WALLET, true) + 30,
    );
  });

  it("is spent down like any other token, and does not expire", () => {
    const after = spendFromWallet(wallet(0, 30), 12);

    expect(after).toEqual({ spent: 12, granted: 30 });
    expect(tokensLeft(0, after, true)).toBe(SUPPORTER_WELCOME_TOKENS + 30 - 12);
  });
});

describe("spendFromWallet", () => {
  it("adds to the lifetime total", () => {
    expect(spendFromWallet(wallet(7), 5)).toEqual({ spent: 12, granted: 0 });
  });

  it("starts a wallet that was never written", () => {
    expect(spendFromWallet(null, 5)).toEqual({ spent: 5, granted: 0 });
  });
});

describe("a wallet from the monthly era", () => {
  it("opens the new economy with nothing spent", () => {
    // Its `spent` counted one calendar month, and the months before it were
    // wiped rather than added up — there is no lifetime total to carry over.
    expect(
      walletFromStored({ period: "2026-07", spent: 14, granted: 0 }),
    ).toEqual({ spent: 0, granted: 0 });
  });

  it("keeps a grant it was given", () => {
    expect(
      walletFromStored({ period: "2026-08", spent: 3, granted: 25 }),
    ).toEqual({ spent: 0, granted: 25 });
  });

  it("reads a current wallet as it stands", () => {
    expect(walletFromStored({ spent: 40, granted: 5 })).toEqual({
      spent: 40,
      granted: 5,
    });
  });

  it("survives an empty or broken document", () => {
    expect(walletFromStored(undefined)).toEqual(EMPTY_WALLET);
    expect(walletFromStored({ spent: "lots" })).toEqual(EMPTY_WALLET);
  });
});
