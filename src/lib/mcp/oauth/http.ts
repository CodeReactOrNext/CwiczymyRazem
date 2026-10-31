import type { NextApiRequest, NextApiResponse } from "next";

import { firestore } from "../db";
import { sha256Hex } from "./security";

/**
 * Browser-based MCP clients (the MCP Inspector, web IDEs) call the token and
 * registration endpoints cross-origin. Neither reads cookies — the request
 * carries everything it proves — so any origin may call them.
 */
export const withCors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, MCP-Protocol-Version",
  );
  res.setHeader("Access-Control-Max-Age", "86400");
};

/** RFC 6749 §5.2 error body. Never cached, like every token endpoint answer. */
export const oauthError = (
  res: NextApiResponse,
  status: number,
  error: string,
  description?: string,
) => {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json({
    error,
    ...(description ? { error_description: description } : {}),
  });
};

const clientIp = (req: NextApiRequest) => {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    .trim();
  return first || req.socket.remoteAddress || "unknown";
};

/**
 * Counts a request against a per-IP hourly allowance — for the endpoints
 * anyone can call without an account. Only a hash of the IP is stored.
 */
export async function withinIpLimit(
  req: NextApiRequest,
  name: string,
  perHour: number,
  now = Date.now(),
) {
  const hour = Math.floor(now / 3_600_000);
  const ref = firestore
    .collection("oauthRateLimits")
    .doc(`${name}_${sha256Hex(clientIp(req)).slice(0, 32)}`);
  return firestore.runTransaction(async (transaction) => {
    const data = (await transaction.get(ref)).data() as
      | { hour?: number; count?: number }
      | undefined;
    const count = data?.hour === hour ? (data.count ?? 0) : 0;
    if (count >= perHour) return false;
    transaction.set(ref, { hour, count: count + 1 });
    return true;
  });
}
