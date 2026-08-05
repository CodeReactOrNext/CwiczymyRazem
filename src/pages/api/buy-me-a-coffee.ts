import { type FundingResponse,getFundingSnapshot } from "lib/funding/getFundingSnapshot";
import type { NextApiRequest, NextApiResponse } from "next";

export type { FundingResponse };

const CACHE_TTL = 20_000; // 20s.

let cache: { at: number; data: FundingResponse } | null = null;

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<FundingResponse>
) {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return res.status(200).json(cache.data);
  }

  const data = await getFundingSnapshot();
  cache = { at: Date.now(), data };
  return res.status(200).json(data);
}
