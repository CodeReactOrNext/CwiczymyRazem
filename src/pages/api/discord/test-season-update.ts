import { NextApiRequest, NextApiResponse } from "next";
import dailySeasonUpdate from "./daily-season-update";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Modify the request to POST since that's what the daily update expects
  const modifiedReq = {
    ...req,
    method: "POST"
  } as NextApiRequest;

  return dailySeasonUpdate(modifiedReq, res);
} 