import { describe, expect, it } from "vitest";

import {
  addUsage,
  callCostUsd,
  emptyUsage,
  estimateCostUsd,
  formatUsd,
  PRICING_USD_PER_1M,
  UsageLedger,
} from "./usage";

describe("usage ledger", () => {
  it("sums partial usage records field by field", () => {
    const ledger = new UsageLedger();
    ledger.add({
      inputTokens: 10_000,
      outputTokens: 2_000,
      reasoningTokens: 500,
      calls: 1,
    });
    ledger.add({ inputTokens: 5_000, cachedInputTokens: 4_000, calls: 1 });
    ledger.add({ embeddingTokens: 300, calls: 1 });

    expect(ledger.totals()).toEqual({
      inputTokens: 15_000,
      cachedInputTokens: 4_000,
      outputTokens: 2_000,
      reasoningTokens: 500,
      embeddingTokens: 300,
      calls: 3,
      costUsd: 0,
    });
  });

  it("bills cached prompt tokens at the cached rate, not twice", () => {
    const usage = addUsage(emptyUsage(), {
      inputTokens: 1_000_000,
      cachedInputTokens: 400_000,
      outputTokens: 100_000,
      embeddingTokens: 1_000_000,
    });

    const expected =
      600_000 * PRICING_USD_PER_1M.input +
      400_000 * PRICING_USD_PER_1M.cachedInput +
      100_000 * PRICING_USD_PER_1M.output +
      1_000_000 * PRICING_USD_PER_1M.embedding;

    expect(estimateCostUsd(usage)).toBeCloseTo(expected / 1_000_000, 6);
    expect(estimateCostUsd(emptyUsage())).toBe(0);
  });

  it("prices each call at the model that answered it", () => {
    const usage = {
      inputTokens: 1_000_000,
      cachedInputTokens: 0,
      outputTokens: 1_000_000,
    };
    expect(callCostUsd("gpt-5.6-sol", usage)).toBeCloseTo(24, 6);
    expect(callCostUsd("gpt-5-mini", usage)).toBeCloseTo(2.25, 6);
    // Unknown models fall back to the default rates rather than to zero.
    expect(callCostUsd("gpt-unknown", usage)).toBeCloseTo(2.25, 6);
  });

  it("trusts the recorded per-call cost over re-pricing the tokens", () => {
    const usage = addUsage(emptyUsage(), {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      embeddingTokens: 1_000_000,
      costUsd: 24,
    });
    expect(estimateCostUsd(usage)).toBeCloseTo(24.02, 6);
  });

  it("formats small amounts with enough digits to be readable", () => {
    expect(formatUsd(0.0042)).toBe("$0.0042");
    expect(formatUsd(0.1234)).toBe("$0.12");
  });
});
