import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { downloadUrl, idToken } = req.body as { downloadUrl: string; idToken: string };

  if (!downloadUrl || !idToken) {
    return res.status(400).json({ error: "Missing params" });
  }

  try {
    await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Server-side fetch has no CORS restriction
  const upstream = await fetch(downloadUrl);
  if (!upstream.ok) {
    return res.status(502).json({ error: "Failed to fetch file from storage" });
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(buffer);
}
