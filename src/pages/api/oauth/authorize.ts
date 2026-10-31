import {
  type AuthorizationParams,
  checkAuthorizationRequest,
  decideAuthorization,
  describeAuthorization,
} from "lib/mcp/oauth/authorize";
import { requestOrigin } from "lib/mcp/oauth/config";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

const PARAM_NAMES = [
  "response_type",
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "scope",
  "state",
  "resource",
] as const;

const readParams = (raw: unknown): AuthorizationParams => {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return Object.fromEntries(
    PARAM_NAMES.filter(
      (name) => typeof source[name] === "string" && source[name],
    ).map((name) => [name, (source[name] as string).slice(0, 2000)]),
  );
};

/**
 * The server half of the consent screen at /oauth/authorize.
 * - `describe`: checks the request and returns what the screen shows. No account needed.
 * - `decide`: the player's Allow / Cancel, with their Firebase id token. The
 *   request is checked again here — the page's copy of it proves nothing.
 * Either way the answer is a URL to send the browser to, or an error to show.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");
  const { action, params, idToken, approve, allowWrite } = (req.body ?? {}) as {
    action?: string;
    params?: unknown;
    idToken?: string;
    approve?: boolean;
    allowWrite?: boolean;
  };
  const origin = requestOrigin(req.headers);

  try {
    const check = await checkAuthorizationRequest(readParams(params), origin);
    if (!check.ok) {
      return check.fatal
        ? res.status(400).json({ error: check.error })
        : res.status(200).json({ redirect: check.redirect });
    }

    if (action === "describe") {
      return res
        .status(200)
        .json({ request: describeAuthorization(check.request) });
    }
    if (action !== "decide")
      return res.status(400).json({ error: "Unknown action" });

    if (!idToken) return res.status(401).json({ error: "Unauthorized" });
    let uid: string;
    try {
      uid = (await auth.verifyIdToken(idToken)).uid;
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const redirect = await decideAuthorization(
      check.request,
      { uid, approve: approve === true, allowWrite: allowWrite === true },
      origin,
    );
    return res.status(200).json({ redirect });
  } catch (error) {
    console.error("oauth/authorize failed", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
