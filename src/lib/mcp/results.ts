import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { McpQuotaError } from "./auth";

/** Public site the links in tool answers point at. */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest"
).replace(/\/$/, "");

export const appLink = (path: string) => `${APP_URL}${path}`;

/**
 * A tool answer. The data goes as JSON text — every client reads text, and the
 * model is better at a compact JSON blob than at prose it has to parse back.
 */
export const jsonResult = (data: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});

/** A refusal the model should read and act on, not a crash. */
export const errorResult = (message: string): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

/**
 * Annotations of every tool that changes the player's account. Claude asks the
 * player before each call to a destructive tool; the directory review requires
 * every tool to say which kind it is. Closed world: riff.quest's own data only.
 */
export const WRITE_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
} as const;

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
  "create_practice_plan",
  "update_practice_plan",
  "add_song_to_list",
  "set_exercise_goal",
  "create_exercise",
  "update_exercise",
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
