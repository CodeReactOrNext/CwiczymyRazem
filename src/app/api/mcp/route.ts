import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateMcpRequest } from "lib/mcp/auth";
import { bearerChallenge, originOf } from "lib/mcp/oauth/config";
import { createRiffQuestMcpServer } from "lib/mcp/server";

/**
 * The riff.quest MCP server — Streamable HTTP, stateless, JSON responses.
 * Every POST is one JSON-RPC message authenticated by a bearer token: a
 * personal one from Settings → AI assistants, or an OAuth access token from
 * /api/oauth/token. GET (a server-sent event stream) and DELETE (ending a
 * session) have nothing to do without sessions, so they're 405s.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const jsonRpcError = (
  status: number,
  message: string,
  headers: Record<string, string> = {},
) =>
  new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    },
  );

/**
 * A 401 points the client at the OAuth metadata (RFC 9728) — that is what
 * starts the sign-in in claude.ai. `error` only when a token was sent: a
 * request without one isn't an invalid token, just an anonymous one (RFC 6750).
 * A 403 is a good token without the supporter badge: no challenge, signing in
 * again wouldn't change the answer, and the message says how to unlock it.
 */
const refuse = (request: Request, status: 401 | 403 | 429, message: string) =>
  jsonRpcError(
    status,
    message,
    status === 401
      ? {
          "WWW-Authenticate": bearerChallenge(
            originOf(request),
            request.headers.has("authorization") ? "invalid_token" : undefined,
          ),
        }
      : status === 429
        ? { "Retry-After": "60" }
        : {},
  );

/** Production origins a browser may call from. */
const ALLOWED_ORIGINS = new Set([
  "https://riff.quest",
  "https://www.riff.quest",
]);
/** Local dev and Vercel previews: only ever their own origin. */
const DEV_ORIGIN =
  /^(http:\/\/(localhost|127\.0\.0\.1)(:\d+)?|https:\/\/[a-z0-9-]+\.vercel\.app)$/;

/**
 * DNS rebinding guard the MCP transport spec asks for. A browser always sends
 * `Origin`, and it has to be one of riff.quest's own. Comparing it with the
 * request's Host alone would not do: in a rebinding attack both carry the
 * attacker's name. Server-side clients (claude.ai, ChatGPT, Claude Code,
 * Cursor) send no Origin and pass; the token check still applies to them.
 */
const isForeignOrigin = (request: Request) => {
  const origin = request.headers.get("origin")?.toLowerCase();
  if (origin === undefined) return false;
  if (ALLOWED_ORIGINS.has(origin)) return false;
  return !(DEV_ORIGIN.test(origin) && origin === originOf(request));
};

const forbidden = () => jsonRpcError(403, "Origin not allowed");

export async function POST(request: Request) {
  if (isForeignOrigin(request)) return forbidden();

  const auth = await authenticateMcpRequest(request);
  if (!auth.ok) return refuse(request, auth.status, auth.error);

  const server = createRiffQuestMcpServer(auth.context);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    // the response is already built (JSON mode) — closing frees the server
    void server.close();
  }
}

const methodNotAllowed = () =>
  new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null,
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    },
  );

/** Without a token GET answers like POST, so a client probing with it still finds the sign-in. */
export async function GET(request: Request) {
  if (isForeignOrigin(request)) return forbidden();
  if (!request.headers.has("authorization")) {
    return refuse(request, 401, "Missing or malformed token");
  }
  return methodNotAllowed();
}

export const DELETE = methodNotAllowed;
