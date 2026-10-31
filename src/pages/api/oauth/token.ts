import { requestOrigin } from "lib/mcp/oauth/config";
import {
  exchangeAuthorizationCode,
  OAuthGrantError,
  refreshAccessToken,
} from "lib/mcp/oauth/grants";
import { oauthError, withCors } from "lib/mcp/oauth/http";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * OAuth 2.1 token endpoint: authorization_code (with PKCE) and refresh_token,
 * for public clients — no client secret, the code verifier is the proof.
 * Clients send application/x-www-form-urlencoded, which Next parses into
 * req.body like JSON.
 */
const field = (body: Record<string, unknown>, name: string) =>
  typeof body[name] === "string" && body[name]
    ? (body[name] as string)
    : undefined;

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

  const body = (
    typeof req.body === "object" && req.body ? req.body : {}
  ) as Record<string, unknown>;
  const grantType = field(body, "grant_type");
  const clientId = field(body, "client_id");
  if (!clientId)
    return oauthError(res, 401, "invalid_client", "client_id is required");

  try {
    let tokens;
    if (grantType === "authorization_code") {
      const code = field(body, "code");
      const redirectUri = field(body, "redirect_uri");
      const codeVerifier = field(body, "code_verifier");
      if (!code || !redirectUri || !codeVerifier) {
        return oauthError(
          res,
          400,
          "invalid_request",
          "code, redirect_uri and code_verifier are required",
        );
      }
      tokens = await exchangeAuthorizationCode({
        code,
        clientId,
        redirectUri,
        codeVerifier,
        resource: field(body, "resource"),
      });
    } else if (grantType === "refresh_token") {
      const refreshToken = field(body, "refresh_token");
      if (!refreshToken)
        return oauthError(
          res,
          400,
          "invalid_request",
          "refresh_token is required",
        );
      tokens = await refreshAccessToken({
        refreshToken,
        clientId,
        resource: field(body, "resource"),
      });
    } else {
      return oauthError(
        res,
        400,
        "unsupported_grant_type",
        "authorization_code or refresh_token",
      );
    }
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    return res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof OAuthGrantError)
      return oauthError(res, 400, error.code, error.message);
    console.error("oauth/token failed", {
      origin: requestOrigin(req.headers),
      error,
    });
    return oauthError(res, 500, "server_error");
  }
}
