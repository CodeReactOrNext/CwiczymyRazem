import OpenAI from "openai";

import { callCostUsd, type UsageLedger } from "./usage";

/**
 * Anything that stops a generation from producing usable content. The routes
 * turn it into a real error status — a roadmap with empty descriptions is not
 * a roadmap, and the queue has to know.
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/** The workhorse: step descriptions, quizzes, refining, matching. */
export const GENERATION_MODEL = "gpt-5-mini";

/**
 * The roadmap's skeleton — the draft, the review and the rewrite. The plan's
 * quality is decided here (which phases, which steps, in what order), so it
 * gets the stronger model; the step texts written from it stay on the
 * workhorse. About 35 cents a roadmap instead of 8 (measured: $0.31–0.36),
 * against a price of 25 tokens ($2.50 of donations).
 */
export const STRUCTURE_MODEL = "gpt-5.6-sol";

export type ReasoningEffort = "minimal" | "low" | "medium" | "high";

interface CompleteJsonParams {
  system: string;
  user: string;
  /** Name and strict schema for structured output. */
  schemaName: string;
  schema: Record<string, unknown>;
  /**
   * Visible + reasoning tokens together. The reasoning models spend part of
   * this thinking, so every caller budgets well above the size of its output.
   */
  maxTokens: number;
  reasoningEffort: ReasoningEffort;
  /** Where this call's token usage is recorded, when the caller keeps count. */
  ledger?: UsageLedger;
  /** Which model answers; the workhorse when omitted. */
  model?: string;
}

let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new GenerationError("OPENAI_API_KEY is not set", 500);
  if (!client) client = new OpenAI({ apiKey });
  return client;
};

/**
 * One structured-output call. Truncation and unparseable content are errors,
 * never a silently empty object: the old pipeline answered 200 with blank
 * fields on every failure, which is how 782 of 903 generated steps ended up
 * with no description.
 */
export async function completeJson<T>(params: CompleteJsonParams): Promise<T> {
  const {
    system,
    user,
    schemaName,
    schema,
    maxTokens,
    reasoningEffort,
    ledger,
    model: requestedModel = GENERATION_MODEL,
  } = params;

  const request = (model: string) =>
    getClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
      max_completion_tokens: maxTokens,
      reasoning_effort: reasoningEffort,
    });

  let model = requestedModel;
  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    try {
      completion = await request(model);
    } catch (error) {
      // A stronger model that refuses the request outright — unknown to this
      // key, or not taking one of the parameters — falls back to the
      // workhorse rather than failing a roadmap somebody paid for.
      const status = (error as { status?: number }).status;
      if (model === GENERATION_MODEL || (status !== 400 && status !== 404)) {
        throw error;
      }
      console.warn(
        `[completeJson] ${model} refused (${status}), falling back to ${GENERATION_MODEL}:`,
        (error as Error).message,
      );
      model = GENERATION_MODEL;
      completion = await request(model);
    }
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = (error as Error).message ?? "OpenAI request failed";
    throw new GenerationError(`OpenAI: ${message}`, status === 429 ? 429 : 502);
  }

  // Recorded before any of the checks below: a truncated or refused call was
  // still billed, and a cost figure that skips failures would flatter itself.
  const usage = completion.usage;
  if (ledger && usage) {
    const counted = {
      inputTokens: usage.prompt_tokens ?? 0,
      cachedInputTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    };
    ledger.add({
      ...counted,
      reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? 0,
      calls: 1,
      costUsd: callCostUsd(model, counted),
    });
  }

  const choice = completion.choices?.[0];
  if (choice?.finish_reason === "length") {
    throw new GenerationError(
      `OpenAI stopped at the token budget (${maxTokens}) before finishing "${schemaName}"`,
    );
  }
  if (choice?.message?.refusal) {
    throw new GenerationError(`OpenAI refused: ${choice.message.refusal}`);
  }

  const content = choice?.message?.content;
  if (!content)
    throw new GenerationError(`OpenAI returned no content for "${schemaName}"`);

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new GenerationError(
      `OpenAI returned invalid JSON for "${schemaName}"`,
    );
  }
}
