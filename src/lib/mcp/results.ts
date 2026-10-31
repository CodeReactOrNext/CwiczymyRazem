import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { McpQuotaError } from "./auth";

/** Public site the links in tool answers point at. */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest"
).replace(/\/$/, "");

export const appLink = (path: string) => `${APP_URL}${path}`;

/**
 * A tool answer. The data goes twice: as JSON text, which every client reads,
 * and as `structuredContent`, which clients that understand output schemas
 * (and code-execution clients) take without parsing the text back. It is
 * always an object — `structuredContent` can't be a bare array.
 */
export const jsonResult = (data: Record<string, unknown>): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
  structuredContent: data,
});

/** A refusal the model should read and act on, not a crash. */
export const errorResult = (message: string): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

/**
 * Annotations of every tool that only reads. Spelled out in full: a missing
 * `openWorldHint` means "true" in the spec, and these tools never leave
 * riff.quest's own data.
 */
export const READ_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Annotations of every tool that changes the player's account. Claude asks the
 * player before each call to a destructive tool; the directory review requires
 * every tool to say which kind it is. Closed world: riff.quest's own data only.
 */
export const WRITE_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
} as const;

/** A write that, repeated with the same arguments, leaves the account as the first call did. */
export const IDEMPOTENT_WRITE_TOOL_ANNOTATIONS = {
  ...WRITE_TOOL_ANNOTATIONS,
  idempotentHint: true,
} as const;

/**
 * The most text one answer may carry. A long history or a 64-measure tab can
 * run far past it, and a client pastes the whole answer into the model's
 * context — so lists are cut to fit and say so.
 */
export const MCP_CHARACTER_LIMIT = 25_000;

/**
 * A tool's input: an argument it doesn't know is an error, not silently
 * dropped — a misspelt filter would otherwise come back as unfiltered results
 * the model takes for filtered ones.
 */
export const strictInput = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).strict();

/** `offset` / `limit` inputs of every tool that lists things. */
export const pageInput = (defaultLimit: number, maxLimit: number) => ({
  offset: z
    .number()
    .int()
    .min(0)
    .max(10_000)
    .optional()
    .describe("Items to skip, for the next page"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(maxLimit)
    .optional()
    .describe(`Default ${defaultLimit}`),
});

/** One page of an already-sorted list, with what a client needs to ask for the next. */
export function pageOf<T>(
  items: T[],
  offset: number | undefined,
  limit: number,
) {
  const start = offset ?? 0;
  const page = items.slice(start, start + limit);
  const hasMore = start + page.length < items.length;
  return {
    items: page,
    meta: {
      total: items.length,
      count: page.length,
      offset: start,
      hasMore,
      ...(hasMore ? { nextOffset: start + page.length } : {}),
    },
  };
}

/**
 * A result whose `key` list is cut down — from the end — until the whole
 * answer fits in MCP_CHARACTER_LIMIT. A cut answer says how much it left out
 * and how to get the rest (`hint`).
 */
export function fittedResult<T>(
  build: (items: T[]) => Record<string, unknown>,
  items: T[],
  hint: string,
): CallToolResult {
  const fits = (count: number) =>
    JSON.stringify(build(items.slice(0, count))).length <= MCP_CHARACTER_LIMIT;
  if (fits(items.length)) return jsonResult(build(items));
  let low = 0;
  let high = items.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle - 1;
  }
  return jsonResult({
    ...build(items.slice(0, low)),
    truncated: true,
    truncation: `Showing ${low} of ${items.length} — the answer would be too long. ${hint}`,
  });
}

/** A tool's own "no" — bad id, nothing to change — said to the model as is. */
export class McpToolError extends Error {}

/**
 * What went wrong underneath, in words the model can act on. Firestore errors
 * carry a gRPC status code (number or name); anything else is unexpected.
 */
const describeFailure = (error: unknown) => {
  const code = (error as { code?: unknown } | null)?.code;
  switch (code) {
    case 4:
    case "deadline-exceeded":
    case 14:
    case "unavailable":
      return {
        reason: "the riff.quest database didn't answer in time",
        retry: true,
      };
    case 8:
    case "resource-exhausted":
      return {
        reason: "the riff.quest database is over its request limit right now",
        retry: true,
      };
    case 10:
    case "aborted":
      return {
        reason: "another change to the same data happened at the same moment",
        retry: true,
      };
    default:
      return {
        reason: "an unexpected error on the riff.quest server",
        retry: false,
      };
  }
};

/**
 * Runs a tool body and turns the errors a player can do something about into
 * answers. Anything else is logged with a reference the answer quotes, so a
 * player reporting it can be matched to the log — internals never leave.
 */
const WRITE_TOOLS = new Set([
  "riffquest_create_practice_plan",
  "riffquest_update_practice_plan",
  "riffquest_add_song_to_list",
  "riffquest_set_exercise_goal",
  "riffquest_create_exercise",
  "riffquest_update_exercise",
]);

export async function runTool(
  name: string,
  body: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  const isWrite = WRITE_TOOLS.has(name);
  try {
    return await body();
  } catch (error) {
    if (error instanceof McpQuotaError || error instanceof McpToolError) {
      return errorResult(error.message);
    }
    const reference = Math.random().toString(36).slice(2, 10);
    console.error(`[mcp] ${name} failed (ref ${reference})`, error);
    const { reason, retry } = describeFailure(error);
    return errorResult(
      [
        `${name} didn't complete: ${reason}.`,
        retry
          ? "Retrying in a few seconds should work."
          : "Retrying is unlikely to help.",
        isWrite
          ? "The change may or may not have been saved — check with the matching list tool before trying again."
          : "",
        `Reference: ${reference} (for riff.quest support).`,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
}

export const msToMinutes = (ms: number | undefined | null) =>
  Math.round(((ms ?? 0) / 60_000) * 10) / 10;
