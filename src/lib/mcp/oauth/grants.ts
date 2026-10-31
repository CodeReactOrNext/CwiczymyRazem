import { Timestamp, type Transaction } from "firebase-admin/firestore";

import { firestore } from "../db";
import { MCP_TOKENS_COLLECTION, type McpTokenDoc } from "../tokens";
import type { OAuthClient } from "./clients";
import {
  ACCESS_TOKEN_TTL_S,
  AUTHORIZATION_CODE_TTL_S,
  type OAuthScope,
  REFRESH_TOKEN_TTL_S,
  sameResource,
} from "./config";
import { randomSecret, sha256Hex, verifyPkce } from "./security";

/**
 * What a player's "Allow" on the consent screen turns into.
 *
 * oauthGrants/{id}         one per connected app: who, which client, which scopes
 * oauthCodes/{sha256}      the one-time code handed back to the client, 5 minutes
 * oauthRefreshTokens/{sha} the grant's refresh token; rotated on every use
 * mcpTokens/{sha256}       the access token — the same collection personal tokens
 *                          live in, so /api/mcp checks both the same way
 *
 * All Admin SDK only (the default deny in firestore.rules covers them). Only
 * hashes are stored: a database dump holds nothing that can be replayed.
 */
export const OAUTH_GRANTS_COLLECTION = "oauthGrants";
export const OAUTH_CODES_COLLECTION = "oauthCodes";
export const OAUTH_REFRESH_COLLECTION = "oauthRefreshTokens";

/** RFC 6749 §5.2 — the token endpoint answers with one of these. */
export class OAuthGrantError extends Error {
  constructor(
    public readonly code:
      | "invalid_grant"
      | "invalid_request"
      | "invalid_client"
      | "invalid_scope",
    message: string,
  ) {
    super(message);
  }
}

interface CodeDoc {
  uid: string;
  clientId: string;
  clientName: string;
  clientUri: string | null;
  redirectUri: string;
  codeChallenge: string;
  scopes: OAuthScope[];
  resource: string;
  expiresAt: Timestamp;
}

interface GrantDoc {
  uid: string;
  clientId: string;
  clientName: string;
  clientUri: string | null;
  redirectHost: string;
  scopes: OAuthScope[];
  resource: string;
  createdAt: Timestamp;
  refreshedAt: Timestamp | null;
  revokedAt: Timestamp | null;
  accessTokenId: string;
  refreshTokenId: string;
}

interface RefreshDoc {
  grantId: string;
  uid: string;
  clientId: string;
  expiresAt: Timestamp;
  usedAt: Timestamp | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

const codes = () => firestore.collection(OAUTH_CODES_COLLECTION);
const grants = () => firestore.collection(OAUTH_GRANTS_COLLECTION);
const refreshTokens = () => firestore.collection(OAUTH_REFRESH_COLLECTION);
const accessTokens = () => firestore.collection(MCP_TOKENS_COLLECTION);

const plusSeconds = (now: number, seconds: number) =>
  Timestamp.fromMillis(now + seconds * 1000);

/** After the player allows access: the code the client exchanges at /token. */
export async function createAuthorizationCode(
  input: {
    uid: string;
    client: OAuthClient;
    redirectUri: string;
    codeChallenge: string;
    scopes: OAuthScope[];
    resource: string;
  },
  now = Date.now(),
): Promise<string> {
  const code = randomSecret("rqcode_");
  const doc: CodeDoc = {
    uid: input.uid,
    clientId: input.client.clientId,
    clientName: input.client.name,
    clientUri: input.client.uri,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    scopes: input.scopes,
    resource: input.resource,
    expiresAt: plusSeconds(now, AUTHORIZATION_CODE_TTL_S),
  };
  await codes().doc(sha256Hex(code)).set(doc);
  return code;
}

/** Writes a fresh access + refresh token pair for a grant inside a transaction. */
function issueTokens(
  transaction: Transaction,
  grantId: string,
  grant: Pick<
    GrantDoc,
    "uid" | "clientId" | "clientName" | "scopes" | "resource"
  >,
  now: number,
) {
  const accessToken = randomSecret("rq_");
  const refreshToken = randomSecret("rqr_");
  const accessTokenId = sha256Hex(accessToken);
  const refreshTokenId = sha256Hex(refreshToken);

  const access: McpTokenDoc = {
    uid: grant.uid,
    label: grant.clientName,
    scopes: grant.scopes,
    hint: accessToken.slice(0, 7),
    createdAt: Timestamp.fromMillis(now),
    lastUsedAt: null,
    revokedAt: null,
    grantId,
    expiresAt: plusSeconds(now, ACCESS_TOKEN_TTL_S),
    resource: grant.resource,
  };
  const refresh: RefreshDoc = {
    grantId,
    uid: grant.uid,
    clientId: grant.clientId,
    expiresAt: plusSeconds(now, REFRESH_TOKEN_TTL_S),
    usedAt: null,
  };
  transaction.set(accessTokens().doc(accessTokenId), access);
  transaction.set(refreshTokens().doc(refreshTokenId), refresh);

  const response: TokenResponse = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_S,
    refresh_token: refreshToken,
    scope: grant.scopes.join(" "),
  };
  return { response, accessTokenId, refreshTokenId };
}

/** grant_type=authorization_code. The code is spent whatever the outcome. */
export async function exchangeAuthorizationCode(
  input: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    resource?: string;
  },
  now = Date.now(),
): Promise<TokenResponse> {
  const codeRef = codes().doc(sha256Hex(input.code));

  // A refused exchange still spends the code, so the transaction has to
  // commit: refusals come back as values, not as throws.
  const outcome = await firestore.runTransaction(
    async (transaction): Promise<TokenResponse | OAuthGrantError> => {
      const snapshot = await transaction.get(codeRef);
      const code = snapshot.data() as CodeDoc | undefined;
      if (!code)
        return new OAuthGrantError(
          "invalid_grant",
          "unknown or already used code",
        );
      transaction.delete(codeRef);

      const fail = (message: string) =>
        new OAuthGrantError("invalid_grant", message);
      if (code.expiresAt.toMillis() < now) return fail("code expired");
      if (code.clientId !== input.clientId)
        return fail("code was issued to another client");
      if (code.redirectUri !== input.redirectUri)
        return fail("redirect_uri doesn't match");
      if (!verifyPkce(input.codeVerifier, code.codeChallenge))
        return fail("code_verifier doesn't match");
      if (input.resource && !sameResource(input.resource, code.resource)) {
        return fail("resource doesn't match the authorization request");
      }

      const grantRef = grants().doc();
      const tokens = issueTokens(transaction, grantRef.id, code, now);
      const grant: GrantDoc = {
        uid: code.uid,
        clientId: code.clientId,
        clientName: code.clientName,
        clientUri: code.clientUri,
        redirectHost: new URL(code.redirectUri).host,
        scopes: code.scopes,
        resource: code.resource,
        createdAt: Timestamp.fromMillis(now),
        refreshedAt: null,
        revokedAt: null,
        accessTokenId: tokens.accessTokenId,
        refreshTokenId: tokens.refreshTokenId,
      };
      transaction.set(grantRef, grant);
      return tokens.response;
    },
  );

  if (outcome instanceof OAuthGrantError) throw outcome;
  return outcome;
}

/** Revokes a grant and its live tokens inside a transaction. */
function revokeInTransaction(
  transaction: Transaction,
  grantId: string,
  grant: GrantDoc,
  now: number,
) {
  transaction.update(grants().doc(grantId), {
    revokedAt: Timestamp.fromMillis(now),
  });
  transaction.delete(accessTokens().doc(grant.accessTokenId));
  transaction.delete(refreshTokens().doc(grant.refreshTokenId));
}

/**
 * grant_type=refresh_token. Rotates: the old refresh token is spent and a new
 * pair comes back. A spent refresh token showing up again means it leaked —
 * the whole grant is revoked and the player has to connect again.
 */
export async function refreshAccessToken(
  input: { refreshToken: string; clientId: string; resource?: string },
  now = Date.now(),
): Promise<TokenResponse> {
  const refreshRef = refreshTokens().doc(sha256Hex(input.refreshToken));

  type Outcome =
    | { ok: true; response: TokenResponse }
    | { ok: false; error: OAuthGrantError };

  // A refusal that revokes the grant must still commit, so errors come back
  // as values instead of being thrown inside the transaction.
  const outcome = await firestore.runTransaction(
    async (transaction): Promise<Outcome> => {
      const refresh = (await transaction.get(refreshRef)).data() as
        | RefreshDoc
        | undefined;
      const fail = (message: string): Outcome => ({
        ok: false,
        error: new OAuthGrantError("invalid_grant", message),
      });
      if (!refresh) return fail("unknown refresh token");

      const grantRef = grants().doc(refresh.grantId);
      const grant = (await transaction.get(grantRef)).data() as
        | GrantDoc
        | undefined;
      if (!grant || grant.revokedAt) return fail("the connection was removed");
      if (refresh.clientId !== input.clientId)
        return fail("refresh token was issued to another client");

      if (refresh.usedAt) {
        revokeInTransaction(transaction, refresh.grantId, grant, now);
        return fail(
          "refresh token was already used — the connection was revoked, connect again",
        );
      }
      if (refresh.expiresAt.toMillis() < now)
        return fail("refresh token expired");
      if (input.resource && !sameResource(input.resource, grant.resource))
        return fail("resource doesn't match the grant");

      transaction.update(refreshRef, { usedAt: Timestamp.fromMillis(now) });
      transaction.delete(accessTokens().doc(grant.accessTokenId));
      const tokens = issueTokens(transaction, refresh.grantId, grant, now);
      transaction.update(grantRef, {
        accessTokenId: tokens.accessTokenId,
        refreshTokenId: tokens.refreshTokenId,
        refreshedAt: Timestamp.fromMillis(now),
      });
      return { ok: true, response: tokens.response };
    },
  );

  if (!outcome.ok) throw outcome.error;
  return outcome.response;
}

// --- Settings → AI assistants -----------------------------------------------

export interface ConnectedApp {
  id: string;
  name: string;
  uri: string | null;
  redirectHost: string;
  scopes: OAuthScope[];
  connectedAt: number;
  lastRefreshedAt: number | null;
}

export async function listConnectedApps(uid: string): Promise<ConnectedApp[]> {
  const snapshot = await grants()
    .where("uid", "==", uid)
    .where("revokedAt", "==", null)
    .get();
  return snapshot.docs
    .map((doc) => {
      const grant = doc.data() as GrantDoc;
      return {
        id: doc.id,
        name: grant.clientName,
        uri: grant.clientUri,
        redirectHost: grant.redirectHost,
        scopes: grant.scopes,
        connectedAt: grant.createdAt.toMillis(),
        lastRefreshedAt: grant.refreshedAt?.toMillis() ?? null,
      };
    })
    .sort((a, b) => b.connectedAt - a.connectedAt);
}

/** Disconnects an app: its tokens stop working at once. False when it isn't the player's. */
export async function revokeConnectedApp(
  uid: string,
  grantId: string,
  now = Date.now(),
): Promise<boolean> {
  return firestore.runTransaction(async (transaction) => {
    const grant = (await transaction.get(grants().doc(grantId))).data() as
      | GrantDoc
      | undefined;
    if (!grant || grant.uid !== uid || grant.revokedAt) return false;
    revokeInTransaction(transaction, grantId, grant, now);
    return true;
  });
}
