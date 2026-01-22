import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sessionCookie = req.cookies.session || "";

    // Effectively clear the cookie
    res.setHeader(
      "Set-Cookie",
      "session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
    );

    if (sessionCookie) {
      // Revoke the session if valid
      try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie);
        await auth.revokeRefreshTokens(decodedClaims.sub);
      } catch  {
        // Ignore if invalid
      }
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
