import { authorizationServerMetadata, originOf } from "lib/mcp/oauth/config";

/** RFC 8414 authorization server metadata — riff.quest is its own issuer. */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version",
};

export function GET(request: Request) {
  return Response.json(authorizationServerMetadata(originOf(request)), {
    headers: { ...CORS, "Cache-Control": "public, max-age=3600" },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
