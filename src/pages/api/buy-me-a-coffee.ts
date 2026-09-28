import { type FundingResponse,getFundingSnapshot } from "lib/funding/getFundingSnapshot";
import type { NextApiRequest, NextApiResponse } from "next";

export type { FundingResponse };

const CACHE_TTL = 20_000; // 20s.

/**
 * The totals only move when Buy Me a Coffee fires a webhook, so the edge may hold the answer for
 * two minutes — short enough that a fresh donation shows on the roadmap almost at once — and hand
 * out a stale one for another minute while it refreshes behind the viewer's back.
 *
 * This is what actually bounds the cost: `cache` below is a module-level variable, so on Vercel
 * every serverless instance keeps its own and a cold start ignores it entirely. Without the
 * header the snapshot below — one `meta` document plus all of `bmcRecurring` plus this month's
 * `bmcFundingEvents`, about twelve reads — ran ~500 times a day.
 */
const EDGE_CACHE = "public, s-maxage=120, stale-while-revalidate=60";

let cache: { at: number; data: FundingResponse } | null = null;

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<FundingResponse>
) {
  res.setHeader("Cache-Control", EDGE_CACHE);

  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return res.status(200).json(cache.data);
  }

  const data = await getFundingSnapshot();
  cache = { at: Date.now(), data };
  return res.status(200).json(data);
}
