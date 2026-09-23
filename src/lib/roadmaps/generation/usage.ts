/**
 * Token usage of one generation, summed across every model call it made —
 * what a roadmap actually costs, measured rather than guessed. Every route in
 * the pipeline returns one of these next to its payload, and the queue adds
 * them up per roadmap.
 */
export interface TokenUsage {
  /** Prompt tokens, including the cached ones. */
  inputTokens: number;
  /** Prompt tokens served from the prompt cache (billed at the cached rate). */
  cachedInputTokens: number;
  /** Visible output + reasoning tokens, both billed as output. */
  outputTokens: number;
  /** The reasoning share of outputTokens, for the record. */
  reasoningTokens: number;
  /** Embedding tokens (lesson search), billed separately. */
  embeddingTokens: number;
  /** How many model calls went into this. */
  calls: number;
  /**
   * What the chat calls cost in USD, priced per call at the model that
   * actually answered — the pipeline mixes models, so the token counts above
   * cannot be priced after the fact. Embeddings are not in it; see
   * `estimateCostUsd`. 0 on usage recorded before this existed.
   */
  costUsd?: number;
}

export const emptyUsage = (): TokenUsage => ({
  inputTokens: 0,
  cachedInputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  embeddingTokens: 0,
  calls: 0,
  costUsd: 0,
});

export const addUsage = (
  a: TokenUsage,
  b: Partial<TokenUsage>,
): TokenUsage => ({
  inputTokens: a.inputTokens + (b.inputTokens ?? 0),
  cachedInputTokens: a.cachedInputTokens + (b.cachedInputTokens ?? 0),
  outputTokens: a.outputTokens + (b.outputTokens ?? 0),
  reasoningTokens: a.reasoningTokens + (b.reasoningTokens ?? 0),
  embeddingTokens: a.embeddingTokens + (b.embeddingTokens ?? 0),
  calls: a.calls + (b.calls ?? 0),
  costUsd: (a.costUsd ?? 0) + (b.costUsd ?? 0),
});

/** Accumulates the usage of every call made while it is passed around. */
export class UsageLedger {
  private total = emptyUsage();

  add(usage: Partial<TokenUsage>) {
    this.total = addUsage(this.total, usage);
  }

  totals(): TokenUsage {
    return { ...this.total };
  }
}

/**
 * USD per 1M tokens for the default chat model (gpt-5-mini) and for
 * text-embedding-3-small, which the lesson search uses. Checked against
 * OpenAI's pricing page on 2026-09-23 — update here when a price moves.
 */
export const PRICING_USD_PER_1M = {
  input: 0.25,
  cachedInput: 0.025,
  output: 2.0,
  embedding: 0.02,
} as const;

type ChatPricing = { input: number; cachedInput: number; output: number };

/** Every chat model the pipeline may call, priced per 1M tokens (2026-09-23). */
export const MODEL_PRICING_USD_PER_1M: Record<string, ChatPricing> = {
  "gpt-5-mini": { input: 0.25, cachedInput: 0.025, output: 2.0 },
  "gpt-5-nano": { input: 0.05, cachedInput: 0.005, output: 0.4 },
  "gpt-5.4": { input: 2.5, cachedInput: 0.25, output: 15.0 },
  "gpt-5.6-sol": { input: 4.0, cachedInput: 0.4, output: 20.0 },
};

/** One call's cost in USD; an unknown model is priced at the default rates. */
export const callCostUsd = (
  model: string,
  usage: Pick<TokenUsage, "inputTokens" | "cachedInputTokens" | "outputTokens">,
): number => {
  const price = MODEL_PRICING_USD_PER_1M[model] ?? PRICING_USD_PER_1M;
  const uncached = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  return (
    (uncached * price.input +
      usage.cachedInputTokens * price.cachedInput +
      usage.outputTokens * price.output) /
    1_000_000
  );
};

/**
 * What a usage total costs in USD: the per-call chat cost when it was
 * recorded, else the chat tokens at the default rates (usage from before the
 * pipeline mixed models) — plus the embeddings either way.
 */
export const estimateCostUsd = (usage: TokenUsage): number => {
  const chat = usage.costUsd ? usage.costUsd : callCostUsd("gpt-5-mini", usage);
  return (
    chat + (usage.embeddingTokens * PRICING_USD_PER_1M.embedding) / 1_000_000
  );
};

export const formatUsd = (usd: number): string =>
  usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`;
