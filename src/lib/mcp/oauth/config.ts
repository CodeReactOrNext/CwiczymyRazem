/**
 * The OAuth 2.1 authorization server in front of /api/mcp — what lets claude.ai,
 * Claude Desktop, Claude Code and other MCP clients connect a player's account
 * by URL, without a pasted token.
 *
 * riff.quest is both the protected resource (the MCP server) and its own
 * authorization server, so every URL here is built from the request's origin:
 * the same code serves riff.quest, preview deployments and localhost.
 */

export const MCP_PATH = "/api/mcp";

export const OAUTH_PATHS = {
  authorize: "/oauth/authorize",
  token: "/api/oauth/token",
  register: "/api/oauth/register",
  protectedResource: "/.well-known/oauth-protected-resource",
  authorizationServer: "/.well-known/oauth-authorization-server",
} as const;

/** `read` covers every read tool; `write` the plan, goal, song and exercise tools. */
export const OAUTH_SCOPES = ["read", "write"] as const;
export type OAuthScope = (typeof OAUTH_SCOPES)[number];
/** Accepted so clients that ask for a refresh token get one; every grant has one anyway. */
export const OFFLINE_ACCESS = "offline_access";

export const ACCESS_TOKEN_TTL_S = 60 * 60;
export const REFRESH_TOKEN_TTL_S = 90 * 24 * 60 * 60;
export const AUTHORIZATION_CODE_TTL_S = 5 * 60;

type HeaderSource =
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>;

const header = (headers: HeaderSource, name: string): string | undefined => {
  if (typeof (headers as { get?: unknown }).get === "function") {
    return (
      (headers as { get(name: string): string | null }).get(name) ?? undefined
    );
  }
  const value = (headers as Record<string, string | string[] | undefined>)[
    name
  ];
  return Array.isArray(value) ? value[0] : value;
};

/** `https://riff.quest`, or whatever host the request came in on. */
export const requestOrigin = (headers: HeaderSource): string => {
  const host = (
    header(headers, "x-forwarded-host") ??
    header(headers, "host") ??
    "riff.quest"
  )
    .split(",")[0]
    .trim();
  const forwarded = header(headers, "x-forwarded-proto")?.split(",")[0].trim();
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const protocol = forwarded ?? (isLocal ? "http" : "https");
  return `${protocol}://${host}`.toLowerCase();
};

/** The origin of a Fetch API request: its Host headers, or its own URL when it has none. */
export const originOf = (request: Request): string =>
  request.headers.has("host") || request.headers.has("x-forwarded-host")
    ? requestOrigin(request.headers)
    : new URL(request.url).origin.toLowerCase();

/** The MCP server's canonical URI (RFC 8707) — what tokens are bound to. */
export const mcpResource = (origin: string) => `${origin}${MCP_PATH}`;

/** Two resource URIs name the same server: scheme and host are case-blind, a trailing slash is noise. */
export const sameResource = (a: string, b: string) => {
  const canonical = (uri: string) => {
    try {
      const url = new URL(uri);
      return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
    } catch {
      return null;
    }
  };
  const left = canonical(a);
  return left !== null && left === canonical(b);
};

/** RFC 9728 protected resource metadata for /api/mcp. */
export const protectedResourceMetadata = (origin: string) => ({
  resource: mcpResource(origin),
  authorization_servers: [origin],
  scopes_supported: [...OAUTH_SCOPES],
  bearer_methods_supported: ["header"],
  resource_name: "riff.quest",
  resource_documentation: `${origin}/wiki`,
});

/** RFC 8414 authorization server metadata. */
export const authorizationServerMetadata = (origin: string) => ({
  issuer: origin,
  authorization_endpoint: `${origin}${OAUTH_PATHS.authorize}`,
  token_endpoint: `${origin}${OAUTH_PATHS.token}`,
  registration_endpoint: `${origin}${OAUTH_PATHS.register}`,
  scopes_supported: [...OAUTH_SCOPES, OFFLINE_ACCESS],
  response_types_supported: ["code"],
  response_modes_supported: ["query"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  // Public clients only: PKCE is the proof, there is no client secret to check.
  token_endpoint_auth_methods_supported: ["none"],
  code_challenge_methods_supported: ["S256"],
  client_id_metadata_document_supported: true,
  service_documentation: `${origin}/wiki`,
});

/** The challenge a 401 from /api/mcp carries, pointing the client at the metadata. */
export const bearerChallenge = (origin: string, error?: "invalid_token") =>
  [
    `Bearer resource_metadata="${origin}${OAUTH_PATHS.protectedResource}"`,
    `scope="${OAUTH_SCOPES.join(" ")}"`,
    ...(error ? [`error="${error}"`] : []),
  ].join(", ");

/** Splits a `scope` parameter into the scopes riff.quest grants, read always included. */
export const parseScopes = (scope: string | undefined | null): OAuthScope[] => {
  const requested = new Set((scope ?? "").split(/\s+/).filter(Boolean));
  return OAUTH_SCOPES.filter((name) => name === "read" || requested.has(name));
};
