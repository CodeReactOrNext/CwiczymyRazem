import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: "Admin password not configured on server" });
  }

  if (password === adminPassword) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, error: "Invalid password" });
}
