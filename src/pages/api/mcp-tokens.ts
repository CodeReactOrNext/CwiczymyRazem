import { listConnectedApps, revokeConnectedApp } from "lib/mcp/oauth/grants";
import {
  createMcpToken,
  listMcpTokens,
  MAX_TOKENS_PER_USER,
  type McpScope,
  McpTokenLimitError,
  revokeMcpToken,
} from "lib/mcp/tokens";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

type Body = {
  idToken?: string;
  action?: "list" | "create" | "revoke" | "disconnect";
  label?: string;
  write?: boolean;
  id?: string;
};

/**
 * Settings → AI assistants: lists, creates and revokes the player's MCP
 * tokens, and lists and disconnects the apps connected through OAuth. POST-only with the Firebase id token in the body, like the other
 * player-scoped routes. The new token is in the create response and nowhere
 * else — only its hash is stored.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { idToken, action, label, write, id } = (req.body ?? {}) as Body;
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (action === "list") {
      const [tokens, apps] = await Promise.all([
        listMcpTokens(uid),
        listConnectedApps(uid),
      ]);
      return res.status(200).json({ tokens, apps });
    }
    if (action === "disconnect") {
      if (typeof id !== "string" || !id)
        return res.status(400).json({ error: "Missing id" });
      const revoked = await revokeConnectedApp(uid, id);
      return revoked
        ? res.status(200).json({ ok: true })
        : res.status(404).json({ error: "Not found" });
    }
    if (action === "create") {
      const scopes: McpScope[] = write ? ["read", "write"] : ["read"];
      const created = await createMcpToken(
        uid,
        typeof label === "string" ? label : "",
        scopes,
      );
      return res.status(200).json(created);
    }
    if (action === "revoke") {
      if (typeof id !== "string" || !id)
        return res.status(400).json({ error: "Missing id" });
      const revoked = await revokeMcpToken(uid, id);
      return revoked
        ? res.status(200).json({ ok: true })
        : res.status(404).json({ error: "Not found" });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    if (error instanceof McpTokenLimitError) {
      return res.status(409).json({
        error: `At most ${MAX_TOKENS_PER_USER} tokens — revoke one first`,
      });
    }
    console.error("mcp-tokens failed", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
