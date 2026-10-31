import { createHash, randomBytes } from "crypto";
import { Timestamp } from "firebase-admin/firestore";

import { firestore } from "./db";

/**
 * Personal access tokens for the MCP server — what a player pastes into Claude
 * Code, Claude Desktop or Cursor to let it read their practice.
 *
 * mcpTokens/{sha256(token)} — the token itself is shown once and never stored,
 * so a leaked database dump can't be replayed against the server. The doc id
 * is the hash, which is what a request is looked up by. The collection is
 * Admin-SDK-only (the default deny in firestore.rules covers it).
 */
export const MCP_TOKENS_COLLECTION = "mcpTokens";
/** Per-player daily write counters: mcpUsage/{uid}. Admin SDK only, too. */
export const MCP_USAGE_COLLECTION = "mcpUsage";

const TOKEN_PREFIX = "rq_";
export const MAX_TOKENS_PER_USER = 5;
export const MAX_TOKEN_LABEL_LENGTH = 40;

export type McpScope = "read" | "write";

export interface McpTokenDoc {
  uid: string;
  label: string;
  scopes: McpScope[];
  /** First characters of the token, so the player can tell two tokens apart. */
  hint: string;
  createdAt: Timestamp;
  lastUsedAt: Timestamp | null;
  revokedAt: Timestamp | null;
  /** Requests in the current minute, for the rate limit. */
  minute?: { bucket: number; count: number };
  /** Set on access tokens issued through OAuth: the connected app they belong to. */
  grantId?: string;
  /** OAuth access tokens expire; personal tokens don't. */
  expiresAt?: Timestamp;
  /** OAuth: the MCP server URL the token was issued for (RFC 8707 audience). */
  resource?: string;
}

/** Personal tokens only — OAuth access tokens are listed as connected apps instead. */
const isPersonal = (doc: McpTokenDoc) => !doc.grantId;

/** What the settings page lists — never the token or its hash's full form. */
export interface McpTokenSummary {
  id: string;
  label: string;
  scopes: McpScope[];
  hint: string;
  createdAt: number;
  lastUsedAt: number | null;
}

export const hashMcpToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const looksLikeMcpToken = (value: string) =>
  value.startsWith(TOKEN_PREFIX) && value.length > TOKEN_PREFIX.length + 20;

const tokens = () => firestore.collection(MCP_TOKENS_COLLECTION);

export class McpTokenLimitError extends Error {}

const toSummary = (id: string, doc: McpTokenDoc): McpTokenSummary => ({
  id,
  label: doc.label,
  scopes: doc.scopes,
  hint: doc.hint,
  createdAt: doc.createdAt.toMillis(),
  lastUsedAt: doc.lastUsedAt?.toMillis() ?? null,
});

export async function createMcpToken(
  uid: string,
  label: string,
  scopes: McpScope[],
): Promise<{ token: string; summary: McpTokenSummary }> {
  const active = await tokens()
    .where("uid", "==", uid)
    .where("revokedAt", "==", null)
    .get();
  const personal = active.docs.filter((doc) =>
    isPersonal(doc.data() as McpTokenDoc),
  );
  if (personal.length >= MAX_TOKENS_PER_USER) throw new McpTokenLimitError();

  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const id = hashMcpToken(token);
  const doc: McpTokenDoc = {
    uid,
    label: label.trim().slice(0, MAX_TOKEN_LABEL_LENGTH) || "MCP",
    scopes: Array.from(new Set(scopes)),
    hint: token.slice(0, TOKEN_PREFIX.length + 4),
    createdAt: Timestamp.now(),
    lastUsedAt: null,
    revokedAt: null,
  };
  await tokens().doc(id).set(doc);
  return { token, summary: toSummary(id, doc) };
}

export async function listMcpTokens(uid: string): Promise<McpTokenSummary[]> {
  const snapshot = await tokens()
    .where("uid", "==", uid)
    .where("revokedAt", "==", null)
    .get();
  return snapshot.docs
    .filter((doc) => isPersonal(doc.data() as McpTokenDoc))
    .map((doc) => toSummary(doc.id, doc.data() as McpTokenDoc))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Revokes one of the player's tokens; false when it isn't theirs or is gone. */
export async function revokeMcpToken(
  uid: string,
  id: string,
): Promise<boolean> {
  const ref = tokens().doc(id);
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as McpTokenDoc | undefined;
    // an OAuth access token is removed by disconnecting its app, not one by one
    if (!data || data.uid !== uid || data.revokedAt || data.grantId)
      return false;
    transaction.update(ref, { revokedAt: Timestamp.now() });
    return true;
  });
}
