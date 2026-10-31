import { OAuthClientError, registerClient } from "lib/mcp/oauth/clients";
import { oauthError, withCors, withinIpLimit } from "lib/mcp/oauth/http";
import type { NextApiRequest, NextApiResponse } from "next";

/** Registrations one IP may make in an hour — Claude registers once per fresh connection. */
const REGISTRATIONS_PER_HOUR = 30;

/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591), public clients only.
 * Claude prefers the Client ID Metadata Document and lands here only if a
 * server doesn't advertise it; other MCP clients still rely on this.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return oauthError(res, 405, "invalid_request", "POST only");
  }
  if (!(await withinIpLimit(req, "register", REGISTRATIONS_PER_HOUR))) {
    return oauthError(
      res,
      429,
      "slow_down",
      "too many registrations from this address",
    );
  }

  try {
    const registered = await registerClient(
      (req.body ?? {}) as Record<string, unknown>,
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json(registered);
  } catch (error) {
    if (error instanceof OAuthClientError)
      return oauthError(res, 400, "invalid_client_metadata", error.message);
    console.error("oauth/register failed", error);
    return oauthError(res, 500, "server_error");
  }
}
