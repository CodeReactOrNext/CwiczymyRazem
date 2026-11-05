import {
  ReportProcessingError,
  submitPracticeReport,
} from "lib/report/submitPracticeReport";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

export type { SongListInterface } from "lib/report/submitPracticeReport";

/**
 * The report form's endpoint. The scoring and every write live in
 * `submitPracticeReport`, which the MCP server's practice log shares.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(400).end();
  }
  if (!req.body.token) {
    return res.status(401).json("Please include id token");
  }
  const { uid } = await auth.verifyIdToken(req.body.token.token);

  try {
    const result = await submitPracticeReport(uid, req.body.inputData);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ReportProcessingError) {
      return res.status(500).json({
        error: "Game logic processing failed",
        details: error.message,
      });
    }
    throw error;
  }
}
