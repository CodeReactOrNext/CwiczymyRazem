import { lookup } from "dns/promises";
import { Timestamp } from "firebase-admin/firestore";
import { isIP } from "net";

import { firestore } from "../db";
import { isAllowedRedirectUri, randomSecret, sha256Hex } from "./security";

/**
 * The OAuth clients allowed to ask a player for access.
 *
 * Two ways in, both for public clients (no secret — PKCE is the proof):
 * - Client ID Metadata Documents: the client_id is an https URL serving the
 *   client's own metadata (Claude does this). Fetched, checked, cached here.
 * - Dynamic Client Registration (RFC 7591): POST /api/oauth/register, stored
 *   here under a generated id. Kept for clients that don't do CIMD yet.
 *
 * oauthClients/{id} — Admin SDK only (the default deny in firestore.rules).
 */
export const OAUTH_CLIENTS_COLLECTION = "oauthClients";
const CIMD_CACHE_MS = 60 * 60 * 1000;
const CIMD_TIMEOUT_MS = 5000;
const CIMD_MAX_BYTES = 64 * 1024;
const MAX_REDIRECT_URIS = 10;

export interface OAuthClient {
  clientId: string;
  kind: "cimd" | "dcr";
  name: string;
  /** The client's home page, shown on the consent screen when it has one. */
  uri: string | null;
  redirectUris: string[];
}

export class OAuthClientError extends Error {}

const clients = () => firestore.collection(OAUTH_CLIENTS_COLLECTION);

const cleanName = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;

const cleanUri = (value: unknown) => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const cleanRedirectUris = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new OAuthClientError("redirect_uris must be a non-empty array");
  }
  if (value.length > MAX_REDIRECT_URIS) {
    throw new OAuthClientError(`at most ${MAX_REDIRECT_URIS} redirect_uris`);
  }
  for (const uri of value) {
    if (typeof uri !== "string" || !isAllowedRedirectUri(uri)) {
      throw new OAuthClientError(
        `redirect_uri ${String(uri)} must be https, or http on localhost`,
      );
    }
  }
  return Array.from(new Set(value as string[]));
};

// --- Client ID Metadata Documents -------------------------------------------

/** Private, loopback, link-local and other non-public ranges — never fetched. */
const isPublicAddress = (address: string) => {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = address.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPublicAddress(v6.slice(7));
  return !(
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80")
  );
};

export const isCimdClientId = (clientId: string) =>
  clientId.startsWith("https://");

/**
 * Checks a CIMD client_id URL is safe to fetch: https on the default port, a
 * real path, a DNS name (not an IP or localhost) that resolves only to public
 * addresses — the server fetching it must not be turned against its own network.
 */
async function assertFetchableClientId(clientId: string) {
  let url: URL;
  try {
    url = new URL(clientId);
  } catch {
    throw new OAuthClientError("client_id is not a URL");
  }
  if (
    url.protocol !== "https:" ||
    url.port !== "" ||
    url.username ||
    url.password ||
    url.hash ||
    url.pathname === "/" ||
    clientId.length > 500
  ) {
    throw new OAuthClientError("client_id must be an https URL with a path");
  }
  const host = url.hostname.toLowerCase();
  if (
    isIP(host.replace(/^\[|\]$/g, "")) ||
    host === "localhost" ||
    /\.(local|internal|localhost)$/.test(host)
  ) {
    throw new OAuthClientError("client_id must be on a public host");
  }
  const addresses = await lookup(host, { all: true }).catch(() => []);
  if (
    addresses.length === 0 ||
    !addresses.every(({ address }) => isPublicAddress(address))
  ) {
    throw new OAuthClientError(
      "client_id host doesn't resolve to a public address",
    );
  }
}

async function fetchCimd(clientId: string): Promise<OAuthClient> {
  await assertFetchableClientId(clientId);
  let response: Response;
  try {
    response = await fetch(clientId, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(CIMD_TIMEOUT_MS),
    });
  } catch {
    throw new OAuthClientError("couldn't fetch the client metadata document");
  }
  if (!response.ok)
    throw new OAuthClientError(
      `client metadata document answered ${response.status}`,
    );
  const text = await response.text();
  if (text.length > CIMD_MAX_BYTES)
    throw new OAuthClientError("client metadata document is too large");

  let document: Record<string, unknown>;
  try {
    document = JSON.parse(text);
  } catch {
    throw new OAuthClientError("client metadata document isn't JSON");
  }
  if (document.client_id !== clientId) {
    throw new OAuthClientError(
      "client metadata document's client_id doesn't match its URL",
    );
  }
  const authMethod = document.token_endpoint_auth_method;
  if (authMethod !== undefined && authMethod !== "none") {
    throw new OAuthClientError(
      "only public clients (token_endpoint_auth_method none) are supported",
    );
  }
  const host = new URL(clientId).hostname;
  return {
    clientId,
    kind: "cimd",
    name: cleanName(document.client_name) ?? host,
    uri: cleanUri(document.client_uri),
    redirectUris: cleanRedirectUris(document.redirect_uris),
  };
}

const cimdDocId = (clientId: string) => `cimd_${sha256Hex(clientId)}`;

// --- Lookup -----------------------------------------------------------------

/** The client behind a client_id, or throws OAuthClientError. */
export async function resolveClient(
  clientId: string | undefined | null,
  now = Date.now(),
): Promise<OAuthClient> {
  if (!clientId || typeof clientId !== "string")
    throw new OAuthClientError("client_id is missing");

  if (isCimdClientId(clientId)) {
    const ref = clients().doc(cimdDocId(clientId));
    const cached = (await ref.get()).data();
    if (
      cached &&
      now - (cached.fetchedAt as Timestamp).toMillis() < CIMD_CACHE_MS
    ) {
      return cached.client as OAuthClient;
    }
    const client = await fetchCimd(clientId);
    await ref.set({ client, fetchedAt: Timestamp.fromMillis(now) });
    return client;
  }

  if (!/^rqc_[A-Za-z0-9_-]{20,60}$/.test(clientId))
    throw new OAuthClientError("unknown client_id");
  const data = (await clients().doc(clientId).get()).data();
  if (!data) throw new OAuthClientError("unknown client_id");
  return data.client as OAuthClient;
}

// --- Dynamic Client Registration --------------------------------------------

export interface RegistrationRequest {
  redirect_uris?: unknown;
  client_name?: unknown;
  client_uri?: unknown;
  token_endpoint_auth_method?: unknown;
  grant_types?: unknown;
  response_types?: unknown;
}

/** RFC 7591 registration of a public client. Returns the RFC 7591 response body. */
export async function registerClient(
  request: RegistrationRequest,
  now = Date.now(),
) {
  const redirectUris = cleanRedirectUris(request.redirect_uris);
  const authMethod = request.token_endpoint_auth_method;
  if (authMethod !== undefined && authMethod !== "none") {
    throw new OAuthClientError(
      "only token_endpoint_auth_method none is supported",
    );
  }
  const grantTypes = Array.isArray(request.grant_types)
    ? request.grant_types
    : ["authorization_code"];
  if (
    grantTypes.some(
      (grant) => grant !== "authorization_code" && grant !== "refresh_token",
    )
  ) {
    throw new OAuthClientError(
      "only the authorization_code and refresh_token grants are supported",
    );
  }

  const clientId = randomSecret("rqc_").slice(0, 36);
  const client: OAuthClient = {
    clientId,
    kind: "dcr",
    name: cleanName(request.client_name) ?? "MCP client",
    uri: cleanUri(request.client_uri),
    redirectUris,
  };
  await clients()
    .doc(clientId)
    .set({ client, createdAt: Timestamp.fromMillis(now) });

  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(now / 1000),
    client_name: client.name,
    ...(client.uri ? { client_uri: client.uri } : {}),
    redirect_uris: redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };
}

/** Exposed for tests. */
export const __private = { isPublicAddress };
