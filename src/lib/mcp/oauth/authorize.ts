import { type OAuthClient, OAuthClientError, resolveClient } from "./clients";
import {
  mcpResource,
  type OAuthScope,
  parseScopes,
  sameResource,
} from "./config";
import { createAuthorizationCode } from "./grants";
import {
  isLoopbackOnly,
  isValidCodeChallenge,
  redirectUriMatches,
} from "./security";

/** The query of an authorization request, as /oauth/authorize received it. */
export type AuthorizationParams = Partial<
  Record<
    | "response_type"
    | "client_id"
    | "redirect_uri"
    | "code_challenge"
    | "code_challenge_method"
    | "scope"
    | "state"
    | "resource",
    string
  >
>;

export interface ValidAuthorization {
  client: OAuthClient;
  redirectUri: string;
  codeChallenge: string;
  scopes: OAuthScope[];
  state: string | undefined;
  resource: string;
}

/**
 * - `fatal`: the client or its redirect URI can't be trusted — say so on the
 *   page and never redirect (OAuth 2.1 §4.1.2.1).
 * - `redirect`: the client is known, the request is wrong — send the error back.
 */
export type AuthorizationCheck =
  | { ok: true; request: ValidAuthorization }
  | { ok: false; fatal: true; error: string }
  | { ok: false; fatal: false; redirect: string };

/** The client's redirect URI with the response params added (and `iss`, RFC 9207). */
export const redirectWith = (
  redirectUri: string,
  origin: string,
  params: Record<string, string | undefined>,
) => {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  url.searchParams.set("iss", origin);
  return url.toString();
};

export async function checkAuthorizationRequest(
  params: AuthorizationParams,
  origin: string,
): Promise<AuthorizationCheck> {
  let client: OAuthClient;
  try {
    client = await resolveClient(params.client_id);
  } catch (error) {
    return {
      ok: false,
      fatal: true,
      error:
        error instanceof OAuthClientError ? error.message : "unknown client",
    };
  }

  // Without redirect_uri the one registered URI is meant — loopback ones carry
  // a per-session port, so they always have to be named.
  const redirectUri =
    params.redirect_uri ??
    (client.redirectUris.length === 1 && !isLoopbackOnly(client.redirectUris)
      ? client.redirectUris[0]
      : undefined);
  if (!redirectUri || !redirectUriMatches(client.redirectUris, redirectUri)) {
    return {
      ok: false,
      fatal: true,
      error: "redirect_uri isn't one the client registered",
    };
  }

  const fail = (error: string, description: string) => ({
    ok: false as const,
    fatal: false as const,
    redirect: redirectWith(redirectUri, origin, {
      error,
      error_description: description,
      state: params.state,
    }),
  });

  if (params.response_type !== "code")
    return fail("unsupported_response_type", "only response_type=code");
  if (
    params.code_challenge_method !== "S256" ||
    !params.code_challenge ||
    !isValidCodeChallenge(params.code_challenge)
  ) {
    return fail(
      "invalid_request",
      "PKCE with code_challenge_method=S256 is required",
    );
  }
  const resource = mcpResource(origin);
  if (params.resource && !sameResource(params.resource, resource)) {
    return fail(
      "invalid_target",
      `this server only issues tokens for ${resource}`,
    );
  }

  return {
    ok: true,
    request: {
      client,
      redirectUri,
      codeChallenge: params.code_challenge,
      scopes: parseScopes(params.scope),
      state: params.state,
      resource,
    },
  };
}

/** What the consent screen shows — everything the player needs to decide, nothing secret. */
export const describeAuthorization = (request: ValidAuthorization) => ({
  clientName: request.client.name,
  clientUri: request.client.uri,
  clientHost:
    request.client.kind === "cimd"
      ? new URL(request.client.clientId).host
      : null,
  redirectHost: new URL(request.redirectUri).host,
  loopback: isLoopbackOnly([request.redirectUri]),
  scopes: request.scopes,
});

/**
 * The player's decision. Approved: a one-time code back to the client, with
 * write access only if it was asked for and the player left it on.
 */
export async function decideAuthorization(
  request: ValidAuthorization,
  input: { uid: string; approve: boolean; allowWrite: boolean },
  origin: string,
): Promise<string> {
  if (!input.approve) {
    return redirectWith(request.redirectUri, origin, {
      error: "access_denied",
      error_description: "the player declined",
      state: request.state,
    });
  }
  const scopes = request.scopes.filter(
    (scope) => scope === "read" || input.allowWrite,
  );
  const code = await createAuthorizationCode({
    uid: input.uid,
    client: request.client,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    scopes,
    resource: request.resource,
  });
  return redirectWith(request.redirectUri, origin, {
    code,
    state: request.state,
  });
}
