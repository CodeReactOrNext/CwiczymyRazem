import { originOf, protectedResourceMetadata } from "lib/mcp/oauth/config";

/**
 * RFC 9728 protected resource metadata for /api/mcp — the document a 401's
 * `resource_metadata` points at. Served here at the root and, through
 * [...path], at the path-inserted form clients probe first.
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version",
};

export function GET(request: Request) {
  return Response.json(protectedResourceMetadata(originOf(request)), {
    headers: { ...CORS, "Cache-Control": "public, max-age=3600" },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
