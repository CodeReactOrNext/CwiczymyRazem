import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getServerDateKey } from "utils/converter/getServerDateKey";

import { firestore } from "./db";
import { mcpResource, originOf, sameResource } from "./oauth/config";
import {
  hashMcpToken,
  looksLikeMcpToken,
  MCP_TOKENS_COLLECTION,
  MCP_USAGE_COLLECTION,
  type McpScope,
  type McpTokenDoc,
} from "./tokens";

/**
 * Who a tool call acts for. Every tool reads and writes `uid`'s data only —
 * no tool takes a user id as input. The server runs on the Admin SDK, which
 * firestore.rules don't apply to, so this is the whole of the access control.
 */
export interface McpContext {
  uid: string;
  tokenId: string;
  scopes: McpScope[];
}

/** HTTP requests one token may make in a minute — every MCP message is one. */
export const MCP_REQUESTS_PER_MINUTE = 60;
/** Writes a player may make through MCP in a day, across all their tokens. */
export const MCP_WRITES_PER_DAY = 20;
/** Of those, how many may create a new exercise. */
export const MCP_EXERCISES_PER_DAY = 10;

export type McpAuthResult =
  | { ok: true; context: McpContext }
  | { ok: false; status: 401 | 429; error: string };

const bearer = (request: Request) => {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, value] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && value ? value.trim() : null;
};

/**
 * The rate limit's step for one request. No transaction: every MCP message is
 * a request, and a client calling tools in parallel would have its
 * transactions on the one token doc collide and retry. An atomic increment
 * doesn't — at the price of a few requests over the limit in a burst, which a
 * rate limit can live with.
 */
export const countRequest = (
  minute: McpTokenDoc["minute"],
  now: Date,
): { allowed: false } | { allowed: true; update: Record<string, unknown> } => {
  const bucket = Math.floor(now.getTime() / 60_000);
  const sameMinute = minute?.bucket === bucket;
  if (sameMinute && minute.count >= MCP_REQUESTS_PER_MINUTE) {
    return { allowed: false };
  }
  return {
    allowed: true,
    update: sameMinute
      ? { "minute.count": FieldValue.increment(1) }
      : { minute: { bucket, count: 1 } },
  };
};

export async function authenticateMcpRequest(
  request: Request,
  now: Date = new Date(),
): Promise<McpAuthResult> {
  const token = bearer(request);
  if (!token || !looksLikeMcpToken(token)) {
    return { ok: false, status: 401, error: "Missing or malformed token" };
  }

  const tokenId = hashMcpToken(token);
  const ref = firestore.collection(MCP_TOKENS_COLLECTION).doc(tokenId);

  const data = (await ref.get()).data() as McpTokenDoc | undefined;
  if (!data || data.revokedAt) {
    return { ok: false, status: 401, error: "Unknown or revoked token" };
  }
  // OAuth access tokens are short-lived and bound to this server (RFC 8707):
  // a token issued for another resource is no token here.
  if (data.expiresAt && data.expiresAt.toMillis() <= now.getTime()) {
    return { ok: false, status: 401, error: "Token expired" };
  }
  if (
    data.resource &&
    !sameResource(data.resource, mcpResource(originOf(request)))
  ) {
    return {
      ok: false,
      status: 401,
      error: "Token was issued for another server",
    };
  }

  const usage = countRequest(data.minute, now);
  if (!usage.allowed) {
    return { ok: false, status: 429, error: "Too many requests — slow down" };
  }
  await ref.update({ ...usage.update, lastUsedAt: Timestamp.fromDate(now) });
  return {
    ok: true,
    context: { uid: data.uid, tokenId, scopes: data.scopes ?? ["read"] },
  };
}

export class McpQuotaError extends Error {}

/** What a write leaves of the day's allowance — every write answer carries it. */
export interface WriteQuotaLeft {
  changesLeftToday: number;
  newExercisesLeftToday: number;
}

interface UsageDoc {
  day?: string;
  writes?: number;
  exercises?: number;
}

/**
 * One write against the day's counters: the counters after it and what's left,
 * or the reason it's refused. A new day starts from zero.
 */
export const countWrite = (
  usage: UsageDoc | undefined,
  day: string,
  kind: "write" | "exercise",
): { refused: string } | { next: Required<UsageDoc>; left: WriteQuotaLeft } => {
  const sameDay = usage?.day === day;
  const writes = sameDay ? (usage?.writes ?? 0) : 0;
  const exercises = sameDay ? (usage?.exercises ?? 0) : 0;
  if (writes >= MCP_WRITES_PER_DAY) {
    return {
      refused: `Daily limit of ${MCP_WRITES_PER_DAY} changes reached — try again tomorrow.`,
    };
  }
  if (kind === "exercise" && exercises >= MCP_EXERCISES_PER_DAY) {
    return {
      refused: `Daily limit of ${MCP_EXERCISES_PER_DAY} new exercises reached — try again tomorrow.`,
    };
  }
  const next = {
    day,
    writes: writes + 1,
    exercises: exercises + (kind === "exercise" ? 1 : 0),
  };
  return {
    next,
    left: {
      changesLeftToday: MCP_WRITES_PER_DAY - next.writes,
      // A new exercise is a change too: whichever runs out first.
      newExercisesLeftToday: Math.min(
        MCP_EXERCISES_PER_DAY - next.exercises,
        MCP_WRITES_PER_DAY - next.writes,
      ),
    },
  };
};

/**
 * Counts one write against the player's daily allowance, or throws when it's
 * spent. Called before the write itself, so a refused call writes nothing.
 * Returns what's left, for the answer to pass on.
 */
export async function consumeWriteQuota(
  context: McpContext,
  kind: "write" | "exercise",
  now: Date = new Date(),
): Promise<WriteQuotaLeft> {
  if (!context.scopes.includes("write")) {
    throw new McpQuotaError(
      "This token is read-only. Create a token with write access in riff.quest Settings → AI assistants.",
    );
  }
  const day = getServerDateKey(now);
  const ref = firestore.collection(MCP_USAGE_COLLECTION).doc(context.uid);

  return firestore.runTransaction(async (transaction) => {
    const usage = (await transaction.get(ref)).data() as UsageDoc | undefined;
    const counted = countWrite(usage, day, kind);
    if ("refused" in counted) throw new McpQuotaError(counted.refused);
    transaction.set(ref, {
      ...counted.next,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return counted.left;
  });
}
